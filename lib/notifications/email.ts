import { Resend } from 'resend'
import { withRetry } from '@/lib/retry'
import { getSystemSettings } from '@/lib/settings/cache'
import { escapeHtml } from '@/lib/security/escape-html'
import { accountsWhatsAppWaMeUrl } from '@/lib/settings/accounts-whatsapp'
import {
  amountDueBlock,
  bodyParagraph,
  bodyParagraphHtml,
  buildEmailHtml,
  detailsCard,
  emailAppUrl,
  emailSubject,
  messageQuoteBlock,
  otpCodeBlock,
  resolveEmailContactFooter,
  successCard,
  warningCard,
  type EmailTemplateOptions,
} from '@/lib/notifications/email-base'

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

const fromEmail =
  process.env.RESEND_FROM_EMAIL ?? 'noreply@revmultimedia.com'
const adminEmail =
  process.env.RESEND_ADMIN_EMAIL ?? 'admin@revmultimedia.com'
const contactAdminEmail =
  process.env.CONTACT_ADMIN_EMAIL?.trim() || 'godfredkojoappiah@gmail.com'

function formatInvoiceDate(d: string): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

async function sendHtmlEmail(
  to: string | string[],
  subject: string,
  html: string,
  fromOverride?: string,
): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.error('[email] RESEND_API_KEY is not configured', { subject })
    return
  }

  try {
    await withRetry(
      () =>
        resend.emails.send({
          from: fromOverride?.trim() || fromEmail,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        }),
      { maxRetries: 3, baseDelayMs: 1000 },
    )
  } catch (error) {
    console.error('[email] send failed', {
      subject,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

async function sendTemplateEmail(
  to: string | string[],
  opts: Omit<EmailTemplateOptions, 'contact'>,
  fromOverride?: string,
): Promise<void> {
  const settings = await getSystemSettings()
  const html = buildEmailHtml({
    ...opts,
    contact: resolveEmailContactFooter(settings),
  })
  await sendHtmlEmail(to, emailSubject(opts.badgeLabel, opts.title), html, fromOverride)
}

function paymentInstructionsHtml(data: {
  reference: string
  momoProvider?: string
  momoNumber?: string
  momoName?: string
  bankName?: string
  bankAccount?: string
  bankAccountName?: string
  swiftCode?: string
  isInternational?: boolean
}): string {
  const parts: string[] = [
    bodyParagraph(
      'Pay using one of the methods below. Include your invoice reference in the payment description so we can match your payment.',
    ),
  ]

  if (data.momoNumber) {
    parts.push(
      bodyParagraphHtml(
        `<strong style="color:#1a1a2e;">Mobile money (${escapeHtml(data.momoProvider ?? 'MoMo')})</strong>`,
      ),
      detailsCard([
        { label: 'Number', value: data.momoNumber },
        { label: 'Account name', value: data.momoName || ' - ' },
      ]),
    )
  }

  if (data.bankName) {
    parts.push(
      bodyParagraphHtml('<strong style="color:#1a1a2e;">Bank transfer</strong>'),
      detailsCard([
        { label: 'Bank', value: data.bankName },
        { label: 'Account number', value: data.bankAccount || ' - ' },
        { label: 'Account name', value: data.bankAccountName || ' - ' },
      ]),
    )
  }

  if (data.isInternational && data.swiftCode) {
    parts.push(
      bodyParagraphHtml('<strong style="color:#1a1a2e;">International wire</strong>'),
      detailsCard([{ label: 'SWIFT / BIC', value: data.swiftCode }]),
    )
  }

  parts.push(
    warningCard(`Quote reference ${data.reference} in your payment description.`),
  )

  return parts.join('')
}

//  -  -  -  1. OTP  -  -  - 

export async function sendOtpEmail(
  to: string,
  code: string,
  name?: string,
): Promise<void> {
  const badgeLabel = 'Verify Email'
  const title = 'Your verification code'
  await sendTemplateEmail(to, {
    recipientName: name?.trim() || 'there',
    badgeLabel,
    title,
    bodyHtml: [
      bodyParagraph(
        'Enter this code in the verification box to continue your application. Do not share this code with anyone.',
      ),
      otpCodeBlock(code),
      warningCard('If you did not request this code, you can safely ignore this email.'),
    ].join(''),
  })
}

/** @deprecated Use sendOtpEmail */
export const sendOTP = sendOtpEmail

//  -  -  -  2. Application received  -  -  - 

export async function sendApplicationReceivedEmail(
  to: string,
  data: {
    name: string
    reference: string
    courseName?: string
    intakeName?: string
    applicationFeeGhs: number
    submittedAt?: string
  },
): Promise<void> {
  const badgeLabel = 'Application Received'
  const title = 'Your application has been received.'
  const feeLabel = data.applicationFeeGhs.toFixed(2)
  const rows = [
    { label: 'Reference', value: data.reference },
    ...(data.courseName ? [{ label: 'Course', value: data.courseName }] : []),
    ...(data.intakeName ? [{ label: 'Intake', value: data.intakeName }] : []),
    { label: 'Submitted', value: data.submittedAt ?? formatToday() },
  ]

  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel,
    title,
    bodyHtml: [
      bodyParagraph(
        'Thank you for applying to Rev Multimedia. We have received your application and our admissions team will review it shortly.',
      ),
      detailsCard(rows),
      bodyParagraph(
        'Log in to your portal to pay your application fee and track updates.',
      ),
    ].join(''),
    ctaButton: {
      label: `Pay Application Fee: GHS ${feeLabel}`,
      url: `${emailAppUrl()}/portal/application`,
    },
    ctaNote: `Save your reference ${data.reference}  -  you will need it to log in.`,
  })
}

export const sendApplicationReceived = sendApplicationReceivedEmail

//  -  -  -  3. Status changed  -  -  - 

const STATUS_EMAIL: Record<
  string,
  {
    badgeLabel: string
    title: string
    body: string
    badgeColor?: string
    extraHtml?: string
    cta?: boolean
  }
> = {
  under_review: {
    badgeLabel: 'Under Review',
    title: 'Your application is being reviewed.',
    body: 'Our admissions team is currently reviewing your application. We will email you when there is an update.',
  },
  shortlisted: {
    badgeLabel: 'Application Shortlisted',
    title: 'You have been shortlisted.',
    body: 'Congratulations! Your application has been shortlisted. Our team will be in touch with next steps.',
    badgeColor: '#2ecc71',
    extraHtml: successCard('You are one step closer to joining Rev Multimedia.'),
  },
  accepted: {
    badgeLabel: 'Application Accepted',
    title: 'Welcome to Rev Multimedia.',
    body: 'Your application has been accepted. Log in to your portal to view your tuition invoice and complete payment to secure your place.',
    badgeColor: '#2ecc71',
    extraHtml: successCard(
      'Pay your tuition fee to confirm enrollment and receive your Student ID.',
    ),
  },
  rejected: {
    badgeLabel: 'Application Update',
    title: 'Update on your application.',
    body: 'After careful review, we are unable to offer you a place in this cohort. We appreciate your interest and encourage you to apply again in a future intake.',
    extraHtml: warningCard(
      'You are welcome to apply for a future cohort when new intakes open.',
    ),
  },
  deferred: {
    badgeLabel: 'Application Deferred',
    title: 'Your application has been deferred.',
    body: 'Your application has been deferred to a future intake. We will contact you with details about the next available cohort.',
  },
}

export async function sendStatusChangedEmail(
  to: string,
  data: { name: string; status: string; reference?: string },
): Promise<void> {
  const content = STATUS_EMAIL[data.status] ?? {
    badgeLabel: 'Application Update',
    title: 'There is an update on your application.',
    body: 'Please log in to your portal for the latest details.',
  }

  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel: content.badgeLabel,
    badgeColor: content.badgeColor,
    title: content.title,
    bodyHtml: [
      bodyParagraph(content.body),
      content.extraHtml ?? '',
      data.reference
        ? detailsCard([{ label: 'Application reference', value: data.reference }])
        : '',
    ].join(''),
    ctaButton: {
      label: 'View your portal',
      url: `${emailAppUrl()}/portal/application`,
    },
  })
}

export const sendStatusChanged = sendStatusChangedEmail

//  -  -  -  4. Application fee invoice  -  -  - 

export async function sendAppFeeInvoiceEmail(
  to: string,
  data: {
    name: string
    reference: string
    amountGhs: number
    paystackLink?: string
  },
): Promise<void> {
  const badgeLabel = 'Invoice'
  const title = 'Your application fee invoice'
  const portalUrl = `${emailAppUrl()}/portal/application`

  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel,
    title,
    bodyHtml: [
      bodyParagraph('Complete your application by paying the application fee below.'),
      amountDueBlock(data.amountGhs),
      detailsCard([
        { label: 'Invoice reference', value: data.reference },
        { label: 'Type', value: 'Application fee' },
      ]),
      bodyParagraph(
        'You can pay online via Paystack or follow manual payment instructions in your portal if online payments are disabled.',
      ),
    ].join(''),
    ctaButton: data.paystackLink
      ? { label: 'Pay Now via Paystack', url: data.paystackLink }
      : { label: 'View invoice in portal', url: portalUrl },
    ctaNote: data.paystackLink
      ? `Quote reference ${data.reference} if paying manually.`
      : undefined,
    footerNote: `Invoice reference: ${data.reference}`,
  })
}

export const sendAppFeeInvoice = sendAppFeeInvoiceEmail

//  -  -  -  5. Tuition invoice  -  -  - 

export type InvoiceReadyEmailData = {
  name: string
  reference: string
  amountGhs: number
  dueDate: string
  invoiceLabel: string
  isInternational: boolean
  momoProvider?: string
  momoNumber?: string
  momoName?: string
  bankName?: string
  bankAccount?: string
  bankAccountName?: string
  swiftCode?: string
  pdfUrl?: string
}

export async function sendTuitionInvoiceEmail(
  to: string,
  data: Omit<InvoiceReadyEmailData, 'invoiceLabel'>,
): Promise<void> {
  await sendInvoiceReadyEmail(to, {
    ...data,
    invoiceLabel: 'Tuition',
  })
}

export const sendTuitionInvoice = sendTuitionInvoiceEmail

export async function sendInvoiceReadyEmail(
  to: string,
  data: InvoiceReadyEmailData,
): Promise<void> {
  const dueFormatted = formatInvoiceDate(data.dueDate)
  const label = data.invoiceLabel.trim() || 'Invoice'
  const isTuition = label.toLowerCase().includes('tuition')
  const badgeLabel = isTuition ? 'Tuition Invoice' : label
  const title = isTuition
    ? 'Your tuition invoice is ready.'
    : `Your ${label.toLowerCase()} is ready.`

  const bodyParts = [
    bodyParagraph(`Please find your ${label.toLowerCase()} details below. Pay before the due date.`),
    amountDueBlock(data.amountGhs, dueFormatted),
    detailsCard([
      { label: 'Invoice reference', value: data.reference },
      { label: 'Due date', value: dueFormatted },
    ]),
    paymentInstructionsHtml({
      reference: data.reference,
      momoProvider: data.momoProvider,
      momoNumber: data.momoNumber,
      momoName: data.momoName,
      bankName: data.bankName,
      bankAccount: data.bankAccount,
      bankAccountName: data.bankAccountName,
      swiftCode: data.swiftCode,
      isInternational: data.isInternational,
    }),
  ]

  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel,
    title,
    bodyHtml: bodyParts.join(''),
    ctaButton: data.pdfUrl
      ? { label: 'Download invoice PDF', url: data.pdfUrl }
      : { label: 'View invoices in portal', url: `${emailAppUrl()}/portal/invoices` },
    ctaNote: data.pdfUrl ? 'PDF link expires in 24 hours.' : undefined,
  })
}

//  -  -  -  6. Payment confirmed  -  -  - 

export async function sendPaymentConfirmedEmail(
  to: string,
  data: {
    name: string
    studentId?: string
    courseName?: string
    amountPaidGhs?: number
    paymentReference?: string
    paidAt?: string
  },
): Promise<void> {
  const enrolled = Boolean(data.studentId)
  const badgeLabel = 'Payment Confirmed'
  const title = enrolled
    ? 'Payment received. Welcome to Rev Multimedia.'
    : 'Payment received. Thank you.'

  const detailRows = [
    ...(data.amountPaidGhs != null
      ? [{ label: 'Amount', value: `GHS ${data.amountPaidGhs.toFixed(2)}` }]
      : []),
    ...(data.paymentReference
      ? [{ label: 'Reference', value: data.paymentReference }]
      : []),
    ...(data.paidAt
      ? [{ label: 'Date', value: formatInvoiceDate(data.paidAt) }]
      : []),
    ...(data.studentId ? [{ label: 'Student ID', value: data.studentId }] : []),
    ...(data.courseName ? [{ label: 'Programme', value: data.courseName }] : []),
  ]

  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel,
    badgeColor: '#2ecc71',
    title,
    bodyHtml: [
      successCard(
        enrolled
          ? 'Your tuition payment has been confirmed and your enrollment is complete.'
          : 'Your payment has been received and your account has been updated.',
      ),
      ...(detailRows.length > 0 ? [detailsCard(detailRows)] : []),
      enrolled
        ? bodyParagraph('Save your Student ID  -  you will use it to log in to your student portal.')
        : '',
    ].join(''),
    ctaButton: {
      label: enrolled ? 'Go to student portal' : 'View my portal',
      url: enrolled ? `${emailAppUrl()}/portal/dashboard` : `${emailAppUrl()}/portal/application`,
    },
  })
}

export const sendPaymentConfirmed = sendPaymentConfirmedEmail

//  -  -  -  7. Enrollment letter  -  -  - 

export async function sendEnrollmentLetterEmail(
  to: string,
  data: {
    name: string
    courseName: string
    applicationReference: string
    studentId?: string
    intakeName?: string
    pdfUrl?: string
  },
): Promise<void> {
  const badgeLabel = 'Enrollment Letter'
  const title = 'You are enrolled. Welcome to Rev Multimedia.'
  const rows = [
    ...(data.studentId
      ? [{ label: 'Student ID', value: data.studentId }]
      : [{ label: 'Application reference', value: data.applicationReference }]),
    { label: 'Course', value: data.courseName },
    ...(data.intakeName ? [{ label: 'Intake', value: data.intakeName }] : []),
  ]

  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel,
    title,
    bodyHtml: [
      bodyParagraph(
        'Congratulations! Your official enrollment letter is ready. Please download and keep it for your records.',
      ),
      detailsCard(rows),
      bodyParagraph('We look forward to seeing you in class.'),
    ].join(''),
    ctaButton: data.pdfUrl
      ? { label: 'Download Enrollment Letter', url: data.pdfUrl }
      : undefined,
    ctaNote: data.pdfUrl ? 'Download link expires in 24 hours.' : undefined,
    footerNote: data.pdfUrl
      ? undefined
      : 'Contact the academy if you need the PDF link resent.',
  })
}

export const sendAdmissionLetterEmail = sendEnrollmentLetterEmail

//  -  -  -  8. Admin invite  -  -  - 

export async function sendAdminInviteEmail(
  to: string,
  data: {
    fullName: string
    role: string
    inviteUrl: string
    invitedBy: string
    resent?: boolean
  },
): Promise<void> {
  const badgeLabel = 'Admin Invitation'
  const title = 'You have been invited to join Rev Multimedia.'
  const intro = data.resent
    ? `Your invitation to join as ${data.role} has been resent.`
    : `${data.invitedBy} has invited you to join the Rev Multimedia admin dashboard as ${data.role}.`

  await sendTemplateEmail(to, {
    recipientName: data.fullName,
    badgeLabel,
    title,
    bodyHtml: [
      bodyParagraph(intro),
      detailsCard([
        { label: 'Role', value: data.role },
        { label: 'Invited by', value: data.invitedBy },
      ]),
      bodyParagraph('Click below to accept the invitation and set your password.'),
    ].join(''),
    ctaButton: { label: 'Accept Invitation', url: data.inviteUrl },
    footerNote: 'This invitation expires in 48 hours.',
  })
}

export const sendAdminInvite = sendAdminInviteEmail

//  -  -  -  9–10. Password reset  -  -  - 

export async function sendAdminPasswordResetEmail(
  to: string,
  data: { name?: string; resetUrl: string },
): Promise<void> {
  await sendTemplateEmail(to, {
    recipientName: data.name?.trim() || 'there',
    badgeLabel: 'Password Reset',
    title: 'Reset your admin password.',
    bodyHtml: bodyParagraph(
      'We received a request to reset the password for your Rev Multimedia admin account. Click the button below to set a new password.',
    ),
    ctaButton: { label: 'Reset Password', url: data.resetUrl },
    footerNote: 'This link expires in 1 hour. If you did not request a reset, ignore this email.',
  })
}

export async function sendPortalPasswordResetEmail(
  to: string,
  data: { name?: string; resetUrl: string },
): Promise<void> {
  await sendTemplateEmail(to, {
    recipientName: data.name?.trim() || 'there',
    badgeLabel: 'Password Reset',
    title: 'Reset your portal password.',
    bodyHtml: bodyParagraph(
      'We received a request to reset the password for your Rev Multimedia student portal account. Click the button below to set a new password.',
    ),
    ctaButton: { label: 'Reset Password', url: data.resetUrl },
    footerNote: 'This link expires in 1 hour. If you did not request a reset, ignore this email.',
  })
}

export async function sendPasswordReset(
  to: string,
  data: { name?: string; resetUrl: string; isAdmin?: boolean },
): Promise<void> {
  if (data.isAdmin) {
    await sendAdminPasswordResetEmail(to, data)
  } else {
    await sendPortalPasswordResetEmail(to, data)
  }
}

//  -  -  -  11–12. Waitlist  -  -  - 

export async function sendWaitlistConfirmationEmail(
  to: string,
  data: {
    name: string
    reference: string
    courseName: string
    intakeName: string
    waitlistPosition: number
  },
): Promise<void> {
  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel: 'Waitlisted',
    title: 'You are on the waitlist.',
    bodyHtml: [
      bodyParagraph(
        `The intake you selected for ${data.courseName} is currently full. We have added you to the waitlist and will contact you if a spot becomes available.`,
      ),
      detailsCard([
        { label: 'Reference', value: data.reference },
        { label: 'Course', value: data.courseName },
        { label: 'Intake', value: data.intakeName },
        { label: 'Waitlist position', value: `#${data.waitlistPosition}` },
      ]),
      bodyParagraph(
        'No payment is required at this time. When a spot opens, we will notify you by email and SMS.',
      ),
    ].join(''),
    footerNote: `Save your reference ${data.reference} to log in to your portal later.`,
  })
}

export const sendWaitlistConfirmation = sendWaitlistConfirmationEmail

export async function sendWaitlistNotificationEmail(
  to: string,
  data: {
    name: string
    reference: string
    courseName: string
    intakeName: string
  },
): Promise<void> {
  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel: 'Spot Available',
    title: 'A spot may be available for you.',
    bodyHtml: [
      bodyParagraph(
        `A place may have opened for ${data.courseName} (${data.intakeName}). Log in to your portal as soon as possible to confirm your interest and pay the application fee if you still wish to proceed.`,
      ),
      detailsCard([
        { label: 'Reference', value: data.reference },
        { label: 'Course', value: data.courseName },
        { label: 'Intake', value: data.intakeName },
      ]),
      warningCard('Spots are offered in waitlist order. Prompt action helps secure your place.'),
    ].join(''),
    ctaButton: {
      label: 'Log in to Portal',
      url: `${emailAppUrl()}/portal/application`,
    },
  })
}

export const sendWaitlistSpotAvailable = sendWaitlistNotificationEmail

//  -  -  -  13–14. Contact form  -  -  - 

export async function sendContactFormConfirmationEmail(
  to: string,
  data: { name: string; message: string },
): Promise<void> {
  const settings = await getSystemSettings()
  const contact = resolveEmailContactFooter(settings)

  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel: 'Message Received',
    title: 'We received your message.',
    bodyHtml: [
      bodyParagraph(
        'Thank you for reaching out to Rev Multimedia. We have received your message and will get back to you within 1–2 business days.',
      ),
      bodyParagraph(
        `If your enquiry is urgent, call us at ${contact.phone} or email ${contact.email}.`,
      ),
      bodyParagraph('Here is a copy of your message:'),
      messageQuoteBlock(data.message),
    ].join(''),
  })
}

export async function sendContactFormAdminEmail(
  to: string,
  data: {
    name: string
    email: string
    phone?: string
    message: string
  },
): Promise<void> {
  await sendTemplateEmail(to, {
    recipientName: 'Team',
    badgeLabel: 'New Contact',
    title: 'New contact form submission.',
    bodyHtml: [
      bodyParagraph('You received a new message from the Rev Multimedia website contact form.'),
      detailsCard([
        { label: 'Name', value: data.name },
        { label: 'Email', value: data.email },
        { label: 'Phone', value: data.phone || 'Not provided' },
      ]),
      bodyParagraph('Message:'),
      messageQuoteBlock(data.message),
    ].join(''),
    ctaButton: {
      label: `Reply to ${data.name}`,
      url: `mailto:${encodeURIComponent(data.email)}`,
    },
  })
}

export async function sendContactForm(data: {
  name: string
  email: string
  phone?: string
  message: string
}): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.error('[email] RESEND_API_KEY is not configured - contact form')
    return
  }

  const settings = await getSystemSettings()
  const contact = resolveEmailContactFooter(settings)

  await withRetry(async () => {
    const adminHtml = buildEmailHtml({
      recipientName: 'Team',
      badgeLabel: 'New Contact',
      title: 'New contact form submission.',
      contact,
      bodyHtml: [
        bodyParagraph('You received a new message from the Rev Multimedia website contact form.'),
        detailsCard([
          { label: 'Name', value: data.name },
          { label: 'Email', value: data.email },
          { label: 'Phone', value: data.phone || 'Not provided' },
        ]),
        bodyParagraph('Message:'),
        messageQuoteBlock(data.message),
      ].join(''),
      ctaButton: {
        label: `Reply to ${data.name}`,
        url: `mailto:${encodeURIComponent(data.email)}`,
      },
    })

    await resend.emails.send({
      from: fromEmail,
      to: contactAdminEmail,
      replyTo: data.email,
      subject: emailSubject('New Contact', 'New contact form submission.'),
      html: adminHtml,
    })

    const confirmHtml = buildEmailHtml({
      recipientName: data.name,
      badgeLabel: 'Message Received',
      title: 'We received your message.',
      contact,
      bodyHtml: [
        bodyParagraph(
          'Thank you for reaching out to Rev Multimedia. We have received your message and will get back to you within 1–2 business days.',
        ),
        bodyParagraph(
          `If your enquiry is urgent, call us at ${contact.phone} or email ${contact.email}.`,
        ),
        bodyParagraph('Here is a copy of your message:'),
        messageQuoteBlock(data.message),
      ].join(''),
    })

    await resend.emails.send({
      from: fromEmail,
      to: data.email,
      subject: emailSubject('Message Received', 'We received your message.'),
      html: confirmHtml,
    })
  }, { maxRetries: 3, baseDelayMs: 1000 })
}

//  -  -  -  15. Manual payment claim  -  -  - 

export async function sendManualPaymentClaimEmail(
  to: string,
  data: {
    name: string
    invoiceReference: string
    transactionRef: string
    amountGhs: number
  },
): Promise<void> {
  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel: 'Payment Claim',
    title: 'Your payment claim has been submitted.',
    bodyHtml: [
      successCard(
        'We have received your manual payment claim. Our finance team will verify it against our records.',
      ),
      detailsCard([
        { label: 'MoMo reference', value: data.transactionRef },
        { label: 'Invoice', value: data.invoiceReference },
        { label: 'Amount', value: `GHS ${data.amountGhs.toFixed(2)}` },
      ]),
    ].join(''),
    footerNote: 'Our team will verify and confirm within 24 hours.',
  })
}

export async function sendManualPaymentClaimRejectedEmail(
  to: string,
  data: {
    name: string
    invoiceReference: string
    transactionRef: string
  },
): Promise<void> {
  const settings = await getSystemSettings()
  const waUrl = accountsWhatsAppWaMeUrl(settings.accounts_whatsapp_number)

  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel: 'Payment Claim Rejected',
    badgeColor: '#f5a623',
    title: 'Your payment claim could not be verified.',
    bodyHtml: [
      warningCard(
        'We could not verify your payment claim against our records. Your application fee remains unpaid in the portal until payment is confirmed.',
      ),
      detailsCard([
        { label: 'Invoice', value: data.invoiceReference },
        { label: 'MoMo reference submitted', value: data.transactionRef },
      ]),
      bodyParagraph(
        'If you have already paid, please contact our accounts team on WhatsApp with your invoice reference and MoMo receipt so we can assist you.',
      ),
    ].join(''),
    ctaButton: waUrl
      ? { label: 'Chat with Accounts on WhatsApp', url: waUrl }
      : undefined,
    footerNote:
      'You can also pay your application fee online via Paystack from the Invoices page if online payments are enabled.',
  })
}

//  -  -  -  16–17. Account deletion  -  -  - 

export async function sendAccountDeletionRequestEmail(
  to: string,
  name: string,
): Promise<void> {
  const settings = await getSystemSettings()
  const contact = resolveEmailContactFooter(settings)

  await sendTemplateEmail(to, {
    recipientName: name,
    badgeLabel: 'Deletion Request',
    title: 'We received your account deletion request.',
    bodyHtml: [
      bodyParagraph(
        'We have received your request to permanently delete your Rev Multimedia student account and all associated personal data, including applications, documents, invoices, and enrollment records.',
      ),
      warningCard(
        'Under Ghana\'s Data Protection Act, we will process your request within 30 days. You will receive a confirmation email once deletion is complete.',
      ),
      bodyParagraph(
        `If you submitted this request by mistake, contact us immediately at ${contact.email}.`,
      ),
    ].join(''),
  })
}

export const sendDeletionRequestReceived = sendAccountDeletionRequestEmail

export async function sendAccountDeletionCompleteEmail(to: string): Promise<void> {
  const settings = await getSystemSettings()
  const contact = resolveEmailContactFooter(settings)

  await sendTemplateEmail(to, {
    recipientName: 'there',
    badgeLabel: 'Account Deleted',
    title: 'Your account has been permanently deleted.',
    bodyHtml: [
      bodyParagraph(
        'Your Rev Multimedia account and all associated personal data have been permanently deleted from our systems.',
      ),
      bodyParagraph(
        'This includes your applications, documents, invoices, and enrollment records. This action cannot be undone.',
      ),
      bodyParagraph(
        `If you believe this was done in error, contact us at ${contact.email}.`,
      ),
    ].join(''),
  })
}

export const sendAccountDeletionCompleted = sendAccountDeletionCompleteEmail

//  -  -  -  18. Data export  -  -  - 

export async function sendDataExportEmail(
  to: string,
  data: { name: string; downloadUrl: string },
): Promise<void> {
  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel: 'Data Export',
    title: 'Your data export is ready.',
    bodyHtml: bodyParagraph(
      'Your personal data export has been prepared. Use the secure link below to download your file.',
    ),
    ctaButton: { label: 'Download My Data', url: data.downloadUrl },
    footerNote: 'This download link expires in 24 hours.',
  })
}

//  -  -  -  Additional emails (same template system)  -  -  - 

export async function sendPaymentReceiptEmail(
  to: string,
  data: {
    name: string
    invoiceReference: string
    paymentForLabel: string
    amountPaidGhs: number
    totalInvoiceGhs: number
    totalPaidGhs: number
    remainingGhs: number
    fullyPaid: boolean
    paymentMethod: string
    receiptPdfUrl?: string
    paidAt?: string
  },
): Promise<void> {
  const methodLabel = data.paymentMethod.replace(/_/g, ' ')
  const rows = [
    { label: 'Invoice', value: data.invoiceReference },
    { label: 'Payment for', value: `${data.paymentForLabel}` },
    { label: 'Amount received', value: `GHS ${data.amountPaidGhs.toFixed(2)}` },
    { label: 'Invoice total', value: `GHS ${data.totalInvoiceGhs.toFixed(2)}` },
    { label: 'Paid to date', value: `GHS ${data.totalPaidGhs.toFixed(2)}` },
    ...(data.fullyPaid
      ? []
      : [{ label: 'Balance remaining', value: `GHS ${data.remainingGhs.toFixed(2)}` }]),
    ...(data.paidAt
      ? [{ label: 'Date', value: formatInvoiceDate(data.paidAt) }]
      : []),
    { label: 'Method', value: methodLabel },
  ]

  await sendTemplateEmail(to, {
    recipientName: data.name,
    badgeLabel: 'Payment Receipt',
    badgeColor: '#2ecc71',
    title: data.fullyPaid
      ? `${data.paymentForLabel} invoice paid in full.`
      : 'We received your payment.',
    bodyHtml: [
      bodyParagraph('Please keep this email for your records.'),
      detailsCard(rows),
      ...(data.fullyPaid ? [successCard('This invoice is now fully paid. Thank you!')] : []),
    ].join(''),
    ctaButton: data.receiptPdfUrl
      ? { label: 'Download receipt PDF', url: data.receiptPdfUrl }
      : { label: 'View my invoices', url: `${emailAppUrl()}/portal/invoices` },
    ctaNote: data.receiptPdfUrl ? 'Receipt link expires in 7 days.' : undefined,
  })
}

export async function sendCertificateUploaded(
  to: string,
  data: { name: string; courseName: string },
): Promise<void> {
  const settings = await getSystemSettings()
  const html = buildEmailHtml({
    recipientName: data.name,
    badgeLabel: 'Certificate Ready',
    badgeColor: '#2ecc71',
    title: 'Your certificate is ready to download.',
    contact: resolveEmailContactFooter(settings),
    bodyHtml: [
      bodyParagraph(
        `Congratulations on completing ${data.courseName}. Your certificate is available in your student portal.`,
      ),
      successCard('Add this certificate to your LinkedIn profile and portfolio.'),
    ].join(''),
    ctaButton: {
      label: 'View my certificate',
      url: `${emailAppUrl()}/portal/profile`,
    },
  })
  await sendHtmlEmail(
    to,
    `Your ${data.courseName} certificate is ready`,
    html,
    adminEmail,
  )
}

export async function sendWaiverApplied(
  to: string,
  data: {
    name: string
    invoiceRef: string
    courseName: string
    amountGhs: number
    newRemainingGhs: number
  },
): Promise<void> {
  const settings = await getSystemSettings()
  const settledParagraph =
    data.newRemainingGhs <= 0
      ? bodyParagraph('Your invoice is now fully settled.')
      : ''

  const html = buildEmailHtml({
    recipientName: data.name,
    badgeLabel: 'Fee Waiver',
    badgeColor: '#2ecc71',
    title: 'A fee waiver has been applied to your invoice.',
    contact: resolveEmailContactFooter(settings),
    bodyHtml: [
      bodyParagraph(
        `We would like to inform you that a fee waiver of GHS ${data.amountGhs.toFixed(2)} has been applied to your invoice ${data.invoiceRef} for ${data.courseName}. Your updated balance is GHS ${data.newRemainingGhs.toFixed(2)}.`,
      ),
      settledParagraph,
    ].join(''),
    ctaButton: {
      label: 'View invoice',
      url: `${emailAppUrl()}/portal/invoices`,
    },
  })

  await sendHtmlEmail(
    to,
    `Fee waiver applied - ${data.invoiceRef}`,
    html,
    adminEmail,
  )
}

export async function sendSameIntakeAdminReviewRequiredEmail(params: {
  studentId: string
  studentName: string
  reference: string
  applicationId: string
  existingCourseTitle: string
  intakeName: string
  newCourseTitle: string
}): Promise<void> {
  const settings = await getSystemSettings()
  const to =
    settings.academy_email?.trim() || adminEmail

  await sendHtmlEmail(
    to,
    'Admin Review Required - Same Intake Application',
    buildEmailHtml({
      recipientName: 'Team',
      badgeLabel: 'Admin Review Required',
      title: 'Same-intake application needs review',
      contact: resolveEmailContactFooter(settings),
      bodyHtml: [
        bodyParagraph(
          'A returning student submitted a new application for a course in an intake where they already have an active enrollment. Please verify before accepting  -  some courses cannot be taken simultaneously.',
        ),
        detailsCard([
          { label: 'Student ID', value: params.studentId },
          { label: 'Student name', value: params.studentName },
          { label: 'Application reference', value: params.reference },
          {
            label: 'Current active enrollment',
            value: `${params.existingCourseTitle} (${params.intakeName} intake)`,
          },
          { label: 'New course applied for', value: params.newCourseTitle },
        ]),
        warningCard(
          'This application was set to Under Review automatically. Accepting it is still allowed after you verify the enrollment is appropriate.',
        ),
      ].join(''),
      ctaButton: {
        label: 'Review application',
        url: `${emailAppUrl()}/admin/applications/${params.applicationId}`,
      },
    }),
  )
}

export async function sendAdminNewApplication(params: {
  applicantName: string
  reference: string
  course: string
}): Promise<void> {
  await sendTemplateEmail(adminEmail, {
    recipientName: 'Team',
    badgeLabel: 'New Application',
    title: 'A new application has been submitted.',
    bodyHtml: [
      bodyParagraph('A new application was submitted on the public apply form.'),
      detailsCard([
        { label: 'Applicant', value: params.applicantName },
        { label: 'Reference', value: params.reference },
        { label: 'Course', value: params.course },
      ]),
    ].join(''),
    ctaButton: {
      label: 'Review in admin',
      url: `${emailAppUrl()}/admin/applications`,
    },
  })
}

export async function sendParentLevelUpApplicationSubmitted(
  to: string,
  data: {
    studentName: string
    reference: string
    courseName: string
    applicationFeeGhs: number
  },
): Promise<void> {
  await sendTemplateEmail(to, {
    recipientName: 'Parent/Guardian',
    badgeLabel: 'Level Up Application',
    title: 'An application has been submitted.',
    bodyHtml: [
      bodyParagraph(
        `${data.studentName} has submitted an application to Rev Multimedia Level Up for ${data.courseName}.`,
      ),
      detailsCard([
        { label: 'Reference', value: data.reference },
        { label: 'Application fee', value: `GHS ${data.applicationFeeGhs.toFixed(2)}` },
      ]),
      bodyParagraph(
        'Your ward can track progress and pay fees in the student portal.',
      ),
    ].join(''),
  })
}

export async function sendDeletionRequestAdminAlert(data: {
  adminEmail: string
  studentName: string
  studentEmail: string
}): Promise<void> {
  await sendTemplateEmail(data.adminEmail, {
    recipientName: 'Team',
    badgeLabel: 'Deletion Request',
    title: 'A student requested account deletion.',
    bodyHtml: [
      bodyParagraph(
        'A student has requested permanent deletion of their account and associated data.',
      ),
      detailsCard([
        { label: 'Student', value: data.studentName },
        { label: 'Email', value: data.studentEmail },
      ]),
    ].join(''),
    ctaButton: {
      label: 'Review in admin',
      url: `${emailAppUrl()}/admin/compliance`,
    },
  })
}
