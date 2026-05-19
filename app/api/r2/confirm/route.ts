import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  r2Key: z.string().min(1),
  documentType: z.string().min(1),
  draftId: z.string().uuid(),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);

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
