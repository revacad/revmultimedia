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

/** Password sign-in attempts (portal + admin login forms). */
export const passwordAttemptLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:password-attempt",
});

export const passwordResetLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:password-reset",
});

export const adminPasswordResetLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:admin-password-reset",
});

export const adminPasswordChangeLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "ratelimit:admin-password-change",
});

/** Application form submission (server action). */
export const applySubmitLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:apply-submit",
});

/** Public course search API. */
export const publicSearchLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "ratelimit:public-search",
});

/** Application draft uploads (presign, upload, confirm). */
export const applicationUploadLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  prefix: "ratelimit:application-upload",
});

/** OTP verify attempts per email (in addition to IP login limit). */
export const otpVerifyEmailLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  prefix: "ratelimit:otp-verify-email",
});

/** Burst limit: same public form >10 submissions per minute per IP or email. */
export const formBurstLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "ratelimit:form-burst",
});

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<{ allowed: boolean }> {
  const { success } = await limiter.limit(identifier);
  return { allowed: success };
}
