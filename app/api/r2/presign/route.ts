import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import {
  buildR2KeyFromUploadContext,
  extensionFromFileName,
  type UploadContext,
} from "@/lib/r2/upload-context";
import { generatePresignedUploadUrl } from "@/lib/r2/presign";

const MAX_FILE_SIZE = 5_242_880;

const uploadContextSchema = z.discriminatedUnion("type", [
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
    type: z.literal("course_thumbnail"),
    slug: z.string().min(1),
  }),
  z.object({
    type: z.literal("team_photo"),
    memberSlug: z.string().min(1),
  }),
]);

const bodySchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
  uploadContext: uploadContextSchema,
});

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;

  try {
    const json: unknown = await request.json();
    body = bodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { fileName, fileType, fileSize, uploadContext } = body;

  if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const ext = extensionFromFileName(fileName);
  const contextWithExt = {
    ...uploadContext,
    ext,
  } as UploadContext;

  const { key, bucket } = buildR2KeyFromUploadContext(contextWithExt);

  const bucketName =
    bucket === "public"
      ? process.env.CLOUDFLARE_R2_PUBLIC_BUCKET_NAME!
      : process.env.CLOUDFLARE_R2_BUCKET_NAME!;

  const presignedUrl = await generatePresignedUploadUrl(
    bucketName,
    key,
    300,
  );

  return NextResponse.json({ presignedUrl, key });
}
