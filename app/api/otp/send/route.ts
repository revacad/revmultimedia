import { NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis/client";
import { checkRateLimit, otpSendLimit } from "@/lib/redis/ratelimit";
import { sendOTP } from "@/lib/notifications/email";

const bodySchema = z.object({
  email: z.email(),
  name: z.string().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  let email: string;
  let name: string | undefined;

  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.parse(json);
    email = parsed.email.toLowerCase();
    name = parsed.name?.trim() || undefined;
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { allowed } = await checkRateLimit(otpSendLimit, email);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before requesting another code." },
      {
        status: 429,
        headers: { "Retry-After": "3600" },
      },
    );
  }

  const otp = Math.floor(100_000 + Math.random() * 900_000).toString();

  await redis.set(
    `otp:${email}`,
    JSON.stringify({ code: otp, attempts: 0 }),
    { ex: 600 },
  );

  await sendOTP(email, otp, name);

  return NextResponse.json({ success: true });
}
