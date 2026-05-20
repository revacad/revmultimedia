import { NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis/client";
import { checkRateLimit, loginLimit } from "@/lib/redis/ratelimit";

const bodySchema = z.object({
  email: z.email(),
  code: z.string().length(6),
});

type OtpRecord = {
  code: string;
  attempts: number;
};

export async function POST(request: Request): Promise<NextResponse> {
  let email: string;
  let code: string;

  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.parse(json);
    email = parsed.email.toLowerCase();
    code = parsed.code;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";
  const { allowed } = await checkRateLimit(loginLimit, ip);
  if (!allowed) {
    return NextResponse.json({ valid: false, reason: "rate_limited" }, { status: 429 });
  }

  if (
    process.env.DISABLE_OTP_VERIFICATION === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
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
