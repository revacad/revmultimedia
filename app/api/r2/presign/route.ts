import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/admin";
import {
  buildR2KeyFromUploadContext,
  extensionFromFileName,
  type UploadContext,
} from "@/lib/r2/upload-context";
import {
  generatePresignedUploadUrl,
  getPublicUrl,
} from "@/lib/r2/presign";
import { APPLICATION_DOCUMENT_TYPES, sanitizeFileName } from "@/lib/security/files";
import { applicationUploadLimit } from "@/lib/redis/ratelimit";
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
  }),
  z.object({
    type: z.literal("application_document"),
    draftId: z.string().uuid(),
    documentType: z.enum(APPLICATION_DOCUMENT_TYPES),
  }),
  z.object({
    type: z.literal("course_thumbnail"),
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
    type: z.literal("resource"),
  }),
]);

const flatContextSchema = z.discriminatedUnion("uploadContext", [
  z.object({
    uploadContext: z.literal("profile_photo"),
    studentId: z.string().min(1),
  }),
  z.object({
    uploadContext: z.literal("student_document"),
    studentId: z.string().min(1),
    documentType: z.enum(["certificate", "other"]),
  }),
  z.object({
    uploadContext: z.literal("certificate"),
    studentId: z.string().min(1),
    courseSlug: z.string().min(1),
  }),
  z.object({
    uploadContext: z.literal("course_content"),
    courseId: z.string().uuid(),
  }),
  z.object({
    uploadContext: z.literal("resource"),
  }),
  z.object({
    uploadContext: z.literal("course_thumbnail"),
  }),
]);

const bodySchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
  uploadContext: z.union([objectContextSchema, flatContextSchema]),
});

function normalizeUploadContext(
  raw: z.infer<typeof bodySchema>["uploadContext"],
): z.infer<typeof objectContextSchema> {
  if ("type" in raw) {
    return raw;
  }

  if (raw.uploadContext === "profile_photo") {
    return { type: "profile_photo", studentId: raw.studentId };
  }
  if (raw.uploadContext === "student_document") {
    return {
      type: "student_document",
      studentId: raw.studentId,
      documentType: raw.documentType,
    };
  }
  if (raw.uploadContext === "certificate") {
    return {
      type: "certificate",
      studentId: raw.studentId,
      courseSlug: raw.courseSlug,
    };
  }
  if (raw.uploadContext === "course_content") {
    return { type: "course_content", courseId: raw.courseId };
  }
  if (raw.uploadContext === "course_thumbnail") {
    return { type: "course_thumbnail" };
  }
  return { type: "resource" };
}

function validateFileForContext(
  context: z.infer<typeof objectContextSchema>,
  fileType: string,
  fileSize: number,
): string | null {
  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  switch (context.type) {
    case "profile_photo":
      if (!isImage) return "Profile photos must be JPEG, PNG, or WebP";
      if (fileSize > 2_097_152) return "File too large. Maximum 2MB.";
      return null;
    case "student_document":
      if (!isImage && !isPdf) return "Invalid file type";
      if (fileSize > 5_242_880) return "File too large. Maximum 5MB.";
      return null;
    case "certificate":
      if (!isPdf) return "Certificates must be PDF files";
      if (fileSize > 10_485_760) return "File too large. Maximum 10MB.";
      return null;
    case "course_content":
    case "course_thumbnail":
      if (!isImage) return "Images must be JPEG, PNG, or WebP";
      if (fileSize > 5_242_880) return "File too large. Maximum 5MB.";
      return null;
    case "resource":
      if (!isImage && !isPdf) return "Resources must be PDF or image files";
      if (isPdf && fileSize > 20_971_520) return "File too large. Maximum 20MB.";
      if (isImage && fileSize > 5_242_880) return "File too large. Maximum 5MB.";
      return null;
    case "application_document":
      if (!isImage && !isPdf) return "Invalid file type";
      if (context.documentType === "passport_photo") {
        if (!isImage) return "Passport photo must be an image";
        if (fileSize > 2_097_152) return "File too large. Maximum 2MB.";
      } else if (fileSize > 5_242_880) {
        return "File too large. Maximum 5MB.";
      }
      return null;
    default:
      if (!isImage && !isPdf) return "Invalid file type";
      if (fileSize > 5_242_880) return "File too large. Maximum 5MB.";
      return null;
  }
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

export async function POST(request: Request): Promise<NextResponse> {
  const limited = await rateLimitOrNull(applicationUploadLimit, [getRequestIp(request)]);
  if (limited) return limited;

  let body: z.infer<typeof bodySchema>;

  try {
    const json: unknown = await request.json();
    body = bodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const uploadContext = normalizeUploadContext(body.uploadContext);
  const fileName = sanitizeFileName(body.fileName);
  const { fileType, fileSize } = body;
  const isApplicationDraft = uploadContext.type === "application_document";

  const validationError = validateFileForContext(uploadContext, fileType, fileSize);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (!isApplicationDraft) {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminOnlyTypes = new Set([
      "certificate",
      "course_thumbnail",
      "team_photo",
      "document",
      "course_content",
      "resource",
    ]);

    if (adminOnlyTypes.has(uploadContext.type)) {
      const adminSession = await getAdminSession();
      if (!adminSession) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    case "course_thumbnail":
      contextWithExt = { type: "course_thumbnail", ext };
      break;
    case "resource": {
      const adminSession = await getAdminSession();
      if (!adminSession) {
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

  const bucketName =
    bucket === "public"
      ? process.env.CLOUDFLARE_R2_PUBLIC_BUCKET_NAME!
      : process.env.CLOUDFLARE_R2_BUCKET_NAME!;

  const presignedUrl = await generatePresignedUploadUrl(bucketName, key, 300);

  if (
    uploadContext.type === "course_content" ||
    uploadContext.type === "course_thumbnail"
  ) {
    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl: getPublicUrl(key),
    });
  }

  return NextResponse.json({ presignedUrl, key });
}
