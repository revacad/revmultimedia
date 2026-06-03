import { NextResponse } from "next/server";
import { authErrorResponse, apiErrorResponse } from "@/lib/errors/api";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/admin";
import {
  buildR2KeyFromUploadContext,
  extensionFromFileName,
  type UploadContext,
} from "@/lib/r2/upload-context";
import { getPublicUrl } from "@/lib/r2/presign";
import { APPLICATION_DOCUMENT_TYPES, sanitizeFileName } from "@/lib/security/files";
import { applicationUploadLimit, fileUploadBurstLimit } from "@/lib/redis/ratelimit";
import { safeExtensionFromFileName } from "@/lib/security/safe-filename";
import {
  allowedMimeTypesForCategory,
  maxBytesForSniffedCategory,
  uploadCategoryForContext,
  type UploadContextKind,
} from "@/lib/security/upload-policy";
import { assertCanUploadCertificate } from "@/lib/enrollment/certificate-upload";
import { assertDraftUploadAuthorized } from "@/lib/apply/verify-draft-upload-token";
import { logUnauthorizedAccessAttempt } from "@/lib/audit/log";
import { getRequestIp, rateLimitOrNull } from "@/lib/security/rate-limit-request";

const objectContextSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("profile_photo"),
    studentId: z.string().min(1),
  }),
  z.object({
    type: z.literal("document"),
    applicationRef: z.string().min(1),
    documentType: z.string().min(1),
  }),
  z.object({
    type: z.literal("student_document"),
    studentId: z.string().min(1),
    documentType: z.enum(["certificate", "other"]),
  }),
  z.object({
    type: z.literal("certificate"),
    studentId: z.string().min(1),
    courseSlug: z.string().min(1),
    enrollmentId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("application_document"),
    draftId: z.string().uuid(),
    documentType: z.enum(APPLICATION_DOCUMENT_TYPES),
  }),
  z.object({
    type: z.literal("course_thumbnail"),
    courseId: z.string().uuid().optional(),
  }),
  z.object({
    type: z.literal("team_photo"),
    memberSlug: z.string().min(1),
  }),
  z.object({
    type: z.literal("course_content"),
    courseId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("course_instructor_photo"),
    courseId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("resource"),
  }),
]);

/** Matches clients that send `uploadContext` as a string on the request root. */
const uploadContextStringSchema = z.enum([
  "profile_photo",
  "student_document",
  "certificate",
  "application_document",
  "course_thumbnail",
  "course_content",
  "course_instructor_photo",
  "instructor_photo",
  "resource",
  "document",
  "team_photo",
]);

const bodySchema = z
  .object({
    fileName: z.string().min(1),
    fileType: z.string().min(1),
    fileSize: z.coerce.number().int().positive(),
    uploadContext: z.union([uploadContextStringSchema, objectContextSchema]),
    courseId: z.string().uuid().optional(),
    studentId: z.string().min(1).optional(),
    courseSlug: z.string().min(1).optional(),
    enrollmentId: z.string().uuid().optional(),
    applicationRef: z.string().min(1).optional(),
    documentType: z.string().optional(),
    draftId: z.string().uuid().optional(),
    memberSlug: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    const ctxValue = data.uploadContext;
    const kind =
      typeof ctxValue === "string"
        ? ctxValue === "instructor_photo"
          ? "course_instructor_photo"
          : ctxValue
        : ctxValue.type;

    if (
      (kind === "course_content" || kind === "course_instructor_photo") &&
      !(
        data.courseId ||
        (typeof ctxValue === "object" &&
          "courseId" in ctxValue &&
          ctxValue.courseId)
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "courseId is required for this upload context",
        path: ["courseId"],
      });
    }

    if (kind === "profile_photo" && !data.studentId) {
      const nestedId =
        typeof ctxValue === "object" && "studentId" in ctxValue
          ? ctxValue.studentId
          : undefined;
      if (!nestedId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "studentId is required",
          path: ["studentId"],
        });
      }
    }
  });

function presignBadRequest(
  reason: string,
  details?: Record<string, unknown>,
): NextResponse {
  console.error("[r2/presign] 400", reason, details ?? "");
  return NextResponse.json({ error: reason }, { status: 400 });
}

function normalizeUploadContext(
  body: z.infer<typeof bodySchema>,
): z.infer<typeof objectContextSchema> {
  const raw = body.uploadContext;

  if (typeof raw === "object" && "type" in raw) {
    return raw;
  }

  const kind = raw === "instructor_photo" ? "course_instructor_photo" : raw;

  switch (kind) {
    case "profile_photo":
      return { type: "profile_photo", studentId: body.studentId! };
    case "student_document":
      return {
        type: "student_document",
        studentId: body.studentId!,
        documentType: (body.documentType as "certificate" | "other") ?? "other",
      };
    case "certificate":
      return {
        type: "certificate",
        studentId: body.studentId!,
        courseSlug: body.courseSlug!,
        enrollmentId: body.enrollmentId!,
      };
    case "application_document":
      return {
        type: "application_document",
        draftId: body.draftId!,
        documentType:
          (body.documentType as (typeof APPLICATION_DOCUMENT_TYPES)[number]) ??
          "other",
      };
    case "course_thumbnail":
      return body.courseId
        ? { type: "course_thumbnail", courseId: body.courseId }
        : { type: "course_thumbnail" };
    case "course_content":
      return { type: "course_content", courseId: body.courseId! };
    case "course_instructor_photo":
      return { type: "course_instructor_photo", courseId: body.courseId! };
    case "document":
      return {
        type: "document",
        applicationRef: body.applicationRef!,
        documentType: body.documentType ?? "other",
      };
    case "team_photo":
      return { type: "team_photo", memberSlug: body.memberSlug! };
    case "resource":
      return { type: "resource" };
    default:
      return { type: "resource" };
  }
}

function validateFileForContext(
  context: z.infer<typeof objectContextSchema>,
  fileType: string,
  fileSize: number,
): string | null {
  const kind = context.type as UploadContextKind;
  const documentType =
    context.type === "application_document" || context.type === "student_document"
      ? context.documentType
      : undefined;
  const category = uploadCategoryForContext(kind, documentType);
  const declared = fileType.trim().toLowerCase();
  const allowed = allowedMimeTypesForCategory(category);
  if (!allowed.includes(declared)) {
    return "Invalid file type";
  }
  const maxBytes = maxBytesForSniffedCategory(
    kind,
    declared === "application/pdf",
    documentType,
  );
  if (fileSize > maxBytes) {
    return declared === "application/pdf"
      ? "File too large. Maximum 25MB."
      : kind === "application_document" && documentType === "passport_photo"
        ? "File too large. Maximum 2MB."
        : "File too large. Maximum 5MB.";
  }
  return null;
}

async function resolveStudentPublicId(studentDbId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("students")
    .select("student_id")
    .eq("id", studentDbId)
    .maybeSingle();
  return data?.student_id ?? null;
}

/** Active admin row for the authenticated user (admins.auth_user_id). */
async function requireActiveAdmin(authUserId: string): Promise<{
  adminId: string
} | null> {
  const adminClient = createAdminClient();
  const { data: admin, error } = await adminClient
    .from("admins")
    .select("id, is_active")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    console.error("[r2/presign] admin lookup failed", error.message, {
      authUserId,
    });
    return null;
  }
  if (!admin?.is_active) {
    console.error("[r2/presign] no active admin for auth user", { authUserId });
    return null;
  }
  return { adminId: admin.id };
}

export const maxDuration = 30;

export async function POST(request: Request): Promise<NextResponse> {
  try {
  const ip = getRequestIp(request);
  const burstLimited = await rateLimitOrNull(fileUploadBurstLimit, [ip]);
  if (burstLimited) return burstLimited;

  const limited = await rateLimitOrNull(applicationUploadLimit, [ip]);
  if (limited) return limited;

  let body: z.infer<typeof bodySchema>;

  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return presignBadRequest("Invalid request body", {
        zod: parsed.error.flatten(),
      });
    }
    body = parsed.data;
  } catch (err) {
    return presignBadRequest("Invalid request body", {
      parseError: err instanceof Error ? err.message : String(err),
    });
  }

  const uploadContext = normalizeUploadContext(body);
  const fileName = sanitizeFileName(body.fileName);
  try {
    safeExtensionFromFileName(body.fileName);
  } catch {
    return presignBadRequest("Invalid file name");
  }
  const { fileType, fileSize } = body;
  const isApplicationDraft = uploadContext.type === "application_document";

  const validationError = validateFileForContext(uploadContext, fileType, fileSize);
  if (validationError) {
    return presignBadRequest(validationError, {
      uploadType: uploadContext.type,
      fileType,
      fileSize,
    });
  }

  if (isApplicationDraft) {
    const authError = await assertDraftUploadAuthorized(
      request,
      uploadContext.draftId,
    );
    if (authError) return authError;
  }

  if (!isApplicationDraft) {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[r2/presign] 401 unauthenticated", {
        authError: authError?.message,
      });
      return authErrorResponse("r2/presign", authError);
    }

    const adminOnlyTypes = new Set([
      "certificate",
      "course_thumbnail",
      "team_photo",
      "document",
      "course_content",
      "course_instructor_photo",
      "resource",
    ]);

    if (adminOnlyTypes.has(uploadContext.type)) {
      const admin = await requireActiveAdmin(user.id);
      if (!admin) {
        console.error("[r2/presign] 401 admin required", {
          uploadType: uploadContext.type,
          authUserId: user.id,
        });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (uploadContext.type === "certificate") {
      const admin = createAdminClient();
      const enrollmentCheck = await assertCanUploadCertificate(
        admin,
        uploadContext.enrollmentId,
      );
      if (!enrollmentCheck.ok) {
        void logUnauthorizedAccessAttempt({
          actorId: user.id,
          actorType: "admin",
          resource: `r2/presign:certificate:${uploadContext.enrollmentId}`,
          metadata: { reason: enrollmentCheck.error },
        });
        return NextResponse.json({ error: enrollmentCheck.error }, { status: 403 });
      }
    }

    if (
      uploadContext.type === "profile_photo" ||
      uploadContext.type === "student_document"
    ) {
      const admin = createAdminClient();
      const { data: student } = await admin
        .from("students")
        .select("auth_user_id")
        .eq("id", uploadContext.studentId)
        .maybeSingle();

      if (!student || student.auth_user_id !== user.id) {
        void logUnauthorizedAccessAttempt({
          actorId: user.id,
          actorType: "student",
          resource: `r2/presign:${uploadContext.type}:${uploadContext.studentId}`,
        });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  const ext = extensionFromFileName(fileName);
  let contextWithExt: UploadContext;

  switch (uploadContext.type) {
    case "profile_photo": {
      const publicId = await resolveStudentPublicId(uploadContext.studentId);
      if (!publicId) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }
      contextWithExt = { type: "profile_photo", studentId: publicId, ext };
      break;
    }
    case "student_document": {
      const publicId = await resolveStudentPublicId(uploadContext.studentId);
      if (!publicId) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }
      contextWithExt = {
        type: "student_document",
        studentId: publicId,
        documentType: uploadContext.documentType,
        ext,
      };
      break;
    }
    case "certificate":
      contextWithExt = {
        type: "certificate",
        studentId: uploadContext.studentId,
        courseSlug: uploadContext.courseSlug,
        ext: "pdf",
      };
      break;
    case "course_content":
      contextWithExt = {
        type: "course_content",
        courseId: uploadContext.courseId,
        ext,
      };
      break;
    case "course_instructor_photo":
      contextWithExt = {
        type: "course_instructor_photo",
        courseId: uploadContext.courseId,
        ext,
      };
      break;
    case "course_thumbnail":
      contextWithExt = {
        type: "course_thumbnail",
        ext,
        ...(uploadContext.courseId ? { courseId: uploadContext.courseId } : {}),
      };
      break;
    case "resource": {
      const adminSession = await getAdminSession();
      if (!adminSession) {
        console.error("[r2/presign] 401 resource upload requires admin session");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      contextWithExt = {
        type: "resource",
        adminId: adminSession.adminId,
        ext,
      };
      break;
    }
    default:
      contextWithExt = { ...uploadContext, ext } as UploadContext;
  }

  const { key, bucket } = buildR2KeyFromUploadContext(contextWithExt);

  const privateBucket =
    process.env.CLOUDFLARE_R2_BUCKET_NAME ?? process.env.R2_BUCKET_NAME;
  const publicBucket = process.env.CLOUDFLARE_R2_PUBLIC_BUCKET_NAME;

  const bucketName = bucket === "public" ? publicBucket : privateBucket;

  if (!bucketName) {
    console.error("[r2/presign] 503 storage bucket not configured", { bucket });
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  if (bucket === "public") {
    return NextResponse.json({
      key,
      publicUrl: getPublicUrl(key),
    });
  }

  return NextResponse.json({ key });
  } catch (error) {
    return apiErrorResponse("r2/presign", error);
  }
}
