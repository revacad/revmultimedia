import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { s3Client } from "@/lib/r2/client";
import { APPLICATION_DOCUMENT_TYPES } from "@/lib/security/files";
import { applicationUploadLimit } from "@/lib/redis/ratelimit";
import { getRequestIp, rateLimitOrNull } from "@/lib/security/rate-limit-request";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PASSPORT_MAX_SIZE = 2 * 1024 * 1024;

const applicationContextSchema = z.object({
  type: z.literal("application_document"),
  draftId: z.string().uuid(),
  documentType: z.enum(APPLICATION_DOCUMENT_TYPES),
});

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = await rateLimitOrNull(applicationUploadLimit, [getRequestIp(request)]);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const key = formData.get("key");
    const uploadContextRaw = formData.get("uploadContext");

    if (!(file instanceof File) || typeof key !== "string" || !key.trim()) {
      return NextResponse.json({ error: "Missing file or key" }, { status: 400 });
    }

    if (typeof uploadContextRaw !== "string" || !uploadContextRaw.trim()) {
      return NextResponse.json({ error: "Missing upload context" }, { status: 400 });
    }

    let uploadContext: z.infer<typeof applicationContextSchema>;
    try {
      uploadContext = applicationContextSchema.parse(JSON.parse(uploadContextRaw));
    } catch {
      return NextResponse.json({ error: "Invalid upload context" }, { status: 400 });
    }

    if (!key.includes(uploadContext.draftId)) {
      return NextResponse.json({ error: "Invalid upload key" }, { status: 400 });
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (
      uploadContext.documentType === "passport_photo" &&
      !file.type.startsWith("image/")
    ) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const maxSize =
      uploadContext.documentType === "passport_photo"
        ? PASSPORT_MAX_SIZE
        : MAX_FILE_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error:
            uploadContext.documentType === "passport_photo"
              ? "File too large. Maximum 2MB."
              : "File too large. Maximum 5MB.",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    return NextResponse.json({ success: true, key });
  } catch (error) {
    console.error("R2 upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
