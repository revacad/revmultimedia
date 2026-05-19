import { NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis/client";
import { checkRateLimit, otpSendLimit } from "@/lib/redis/ratelimit";
import { sendOtpEmail } from "@/lib/notifications/email";

const bodySchema = z.object({
  email: z.email(),
});

export async function POST(request: Request): Promise<NextResponse> {
  let email: string;

  try {
    const json: unknown = await request.json();
    email = bodySchema.parse(json).email.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { allowed } = await checkRateLimit(otpSendLimit, email);

  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const otp = Math.floor(100_000 + Math.random() * 900_000).toString();

  await redis.set(
    `otp:${email}`,
    JSON.stringify({ code: otp, attempts: 0 }),
    { ex: 600 },
  );

  await sendOtpEmail(email, otp);

  return NextResponse.json({ success: true });
}
