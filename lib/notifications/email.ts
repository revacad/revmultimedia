import { Resend } from "resend";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

const fromEmail =
  process.env.RESEND_FROM_EMAIL ?? "noreply@revmultimedia.com";
const adminEmail =
  process.env.RESEND_ADMIN_EMAIL ?? "admin@revmultimedia.com";

async function sendPlainText(
  to: string | string[],
  subject: string,
  text: string,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.error("[email] RESEND_API_KEY is not configured", { subject });
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
    });
  } catch (error) {
    console.error("[email] send failed", { subject, error });
  }
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  await sendPlainText(
    to,
    "Your verification code",
    `Your Rev Multimedia Academy verification code is: ${otp}`,
  );
}

export async function sendApplicationReceived(
  to: string,
  params: { name: string; reference: string },
): Promise<void> {
  await sendPlainText(
    to,
    "Application received",
    `Hi ${params.name},\n\nWe received your application (reference: ${params.reference}).`,
  );
}

export async function sendAppFeeInvoice(
  to: string,
  params: {
    name: string;
    reference: string;
    amountGhs: number;
    paystackLink: string;
  },
): Promise<void> {
  await sendPlainText(
    to,
    "Application fee invoice",
    `Hi ${params.name},\n\nPlease pay your application fee of GHS ${params.amountGhs} for reference ${params.reference}.\nPay here: ${params.paystackLink}`,
  );
}

export async function sendStatusChanged(
  to: string,
  params: { name: string; status: string; message?: string },
): Promise<void> {
  const body = params.message
    ? `${params.message}\n\nYour application status is now: ${params.status}.`
    : `Your application status is now: ${params.status}.`;

  await sendPlainText(
    to,
    "Application status update",
    `Hi ${params.name},\n\n${body}`,
  );
}

export async function sendTuitionInvoice(
  to: string,
  params: {
    name: string;
    reference: string;
    amountGhs: number;
    dueDate: string;
    isInternational: boolean;
    pdfUrl: string;
  },
): Promise<void> {
  await sendPlainText(
    to,
    "Tuition invoice",
    `Hi ${params.name},\n\nYour tuition invoice ${params.reference} for GHS ${params.amountGhs} is due ${params.dueDate}.\nInternational: ${params.isInternational ? "yes" : "no"}\nInvoice PDF: ${params.pdfUrl}`,
  );
}

export async function sendPaymentConfirmed(
  to: string,
  params: { name: string; studentId: string; courseName: string },
): Promise<void> {
  await sendPlainText(
    to,
    "Payment confirmed",
    `Hi ${params.name},\n\nYour payment is confirmed. Student ID: ${params.studentId}. Course: ${params.courseName}.`,
  );
}

export async function sendCertificateUploaded(
  to: string,
  params: { name: string; courseName: string },
): Promise<void> {
  await sendPlainText(
    to,
    "Certificate available",
    `Hi ${params.name},\n\nYour certificate for ${params.courseName} is now available in your portal.`,
  );
}

export async function sendPasswordReset(
  to: string,
  params: { resetUrl: string },
): Promise<void> {
  await sendPlainText(
    to,
    "Password reset",
    `Reset your password using this link: ${params.resetUrl}`,
  );
}

export async function sendContactForm(params: {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}): Promise<void> {
  await sendPlainText(
    adminEmail,
    `Contact form: ${params.subject}`,
    `From: ${params.senderName} <${params.senderEmail}>\n\n${params.message}`,
  );
}

export async function sendAdminNewApplication(params: {
  applicantName: string;
  reference: string;
  course: string;
}): Promise<void> {
  await sendPlainText(
    adminEmail,
    "New application",
    `New application from ${params.applicantName} (${params.reference}) for ${params.course}.`,
  );
}
