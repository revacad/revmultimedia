import { NextResponse } from "next/server";
import { redis } from "@/lib/redis/client";
import { checkRateLimit, otpSendLimit } from "@/lib/redis/ratelimit";
import { getRequestIp } from "@/lib/security/rate-limit-request";
import { sendOTP } from "@/lib/notifications/email";
import { otpSendBodySchema } from "@/lib/validations/api";

export async function POST(request: Request): Promise<NextResponse> {
  let email: string;
  let name: string | undefined;

  try {
    const json: unknown = await request.json();
    const parsed = otpSendBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email" },
        { status: 400 },
      );
    }
    email = parsed.data.email;
    name = parsed.data.name;
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const ip = getRequestIp(request);
  const [byEmail, byIp] = await Promise.all([
    checkRateLimit(otpSendLimit, email),
    checkRateLimit(otpSendLimit, `ip:${ip}`),
  ]);

  if (!byEmail.allowed || !byIp.allowed) {
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
