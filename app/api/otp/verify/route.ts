import { NextResponse } from "next/server";
import { redis } from "@/lib/redis/client";
import { checkRateLimit, loginLimit, otpVerifyEmailLimit } from "@/lib/redis/ratelimit";
import { getRequestIp } from "@/lib/security/rate-limit-request";
import { otpVerifyBodySchema } from "@/lib/validations/api";

type OtpRecord = {
  code: string;
  attempts: number;
};

export async function POST(request: Request): Promise<NextResponse> {
  let email: string;
  let code: string;

  try {
    const json: unknown = await request.json();
    const parsed = otpVerifyBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    email = parsed.data.email;
    code = parsed.data.code;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ip = getRequestIp(request);
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit(loginLimit, ip),
    checkRateLimit(otpVerifyEmailLimit, email),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    return NextResponse.json({ valid: false, reason: "rate_limited" }, { status: 429 });
  }

  // Dev-only bypass: DISABLE_OTP_VERIFICATION never applies in production.
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction && process.env.DISABLE_OTP_VERIFICATION === "true") {
    return NextResponse.json({ valid: true });
  }

  const key = `otp:${email}`;
  const storedRaw = await redis.get<string>(key);

  if (!storedRaw) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  let stored: OtpRecord;

  try {
    stored =
      typeof storedRaw === "string"
        ? (JSON.parse(storedRaw) as OtpRecord)
        : (storedRaw as OtpRecord);
  } catch {
    await redis.del(key);
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  if (stored.attempts >= 5) {
    await redis.del(key);
    return NextResponse.json({ valid: false, reason: "too_many_attempts" });
  }

  if (stored.code === code) {
    await redis.del(key);
    return NextResponse.json({ valid: true });
  }

  const updated: OtpRecord = {
    code: stored.code,
    attempts: stored.attempts + 1,
  };

  await redis.set(key, JSON.stringify(updated), { ex: 600 });

  return NextResponse.json({ valid: false, reason: "invalid_code" });
}
