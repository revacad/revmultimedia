import { createHmac, timingSafeEqual } from "crypto";

export class PaystackVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaystackVerificationError";
  }
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const hash = createHmac("sha512", secret).update(payload).digest("hex");

  try {
    const hashBuffer = Buffer.from(hash);
    const signatureBuffer = Buffer.from(signature);

    if (hashBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return timingSafeEqual(hashBuffer, signatureBuffer);
  } catch {
    return false;
  }
}

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    status: string;
    amount: number;
    customer: { email: string };
    metadata: Record<string, unknown>;
  };
};

export async function verifyTransaction(reference: string): Promise<{
  status: boolean;
  amount: number;
  email: string;
  metadata: Record<string, unknown>;
}> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new PaystackVerificationError("Paystack secret key is not configured");
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new PaystackVerificationError(
      `Paystack verification failed (${response.status})`,
    );
  }

  const body = (await response.json()) as PaystackVerifyResponse;

  if (!body.status || body.data.status !== "success") {
    throw new PaystackVerificationError(
      body.message || "Transaction verification failed",
    );
  }

  return {
    status: body.status,
    amount: body.data.amount,
    email: body.data.customer.email,
    metadata: body.data.metadata ?? {},
  };
}
