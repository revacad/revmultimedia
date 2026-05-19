import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";

export const applicationSubmitLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "ratelimit:application-submit",
});

export const otpSendLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:otp-send",
});

export const loginLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  prefix: "ratelimit:login",
});

export const passwordResetLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:password-reset",
});

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<{ allowed: boolean }> {
  const { success } = await limiter.limit(identifier);
  return { allowed: success };
}
