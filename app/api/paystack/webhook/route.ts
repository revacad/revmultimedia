import { NextResponse } from "next/server";
import {
  verifyTransaction,
  verifyWebhookSignature,
} from "@/lib/payments/paystack";

type PaystackWebhookEvent = {
  event: string;
  data?: {
    reference?: string;
    amount?: number;
    metadata?: Record<string, unknown>;
  };
};

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackWebhookEvent;

  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ received: true });
  }

  if (event.event === "charge.success") {
    const reference = event.data?.reference;

    if (reference) {
      try {
        await verifyTransaction(reference);
        // TODO: mark app_fee_paid = true on applications table where paystack_reference matches
      } catch (error) {
        console.error("[paystack:webhook] verification failed", {
          reference,
          error,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
