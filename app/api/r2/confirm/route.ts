import { NextResponse } from "next/server";
import { applicationUploadLimit } from "@/lib/redis/ratelimit";
import { getRequestIp, rateLimitOrNull } from "@/lib/security/rate-limit-request";
import { r2ConfirmBodySchema } from "@/lib/validations/api";

export async function POST(request: Request): Promise<NextResponse> {
  const limited = await rateLimitOrNull(applicationUploadLimit, [getRequestIp(request)]);
  if (limited) return limited;

  try {
    const json: unknown = await request.json();
    const parsed = r2ConfirmBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 },
      );
    }
    const body = parsed.data;

    if (!body.r2Key.includes(body.draftId)) {
      return NextResponse.json({ error: "Invalid upload key" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      key: body.r2Key,
      documentType: body.documentType,
      fileName: body.fileName,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
