import { Resend } from 'resend'
import { withRetry } from '@/lib/retry'
import { emailTemplate } from '@/lib/notifications/email-template'
import {
  emailAlert,
  emailButton,
  emailDivider,
  emailGreeting,
  emailHeading,
  emailInfoCard,
  emailParagraph,
  emailReferenceCard,
  emailSubheading,
  escapeHtml,
} from '@/lib/notifications/email-components'

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

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000'
  )
}

async function sendHtmlEmail(
  to: string | string[],
  subject: string,
  html: string,
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
          from: fromEmail,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        }),
      { maxRetries: 3, baseDelayMs: 1000 },
    )
  } catch (error) {
    console.error('[email] send failed', { subject, error })
  }
}

function formatInvoiceDate(d: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function sendOTP(
  to: string,
  code: string,
  name?: string,
): Promise<void> {
  const safeCode = escapeHtml(code)
  await sendHtmlEmail(
    to,
    `${code} is your Rev Multimedia verification code`,
    emailTemplate({
      previewText: `Your verification code is ${code}. Valid for 10 minutes.`,
      body: `
          ${emailGreeting(name?.trim() || 'there')}
          ${emailHeading('Verify your email')}
          ${emailSubheading('Enter this code to continue your application.')}

          <table cellpadding="0" cellspacing="0" role="presentation"
            width="100%" style="margin:24px 0;">
            <tr>
              <td style="background:linear-gradient(135deg,#FDF0F6,#F7F8FC);
                border:2px solid rgba(199,74,134,0.20);
                border-radius:16px;padding:32px;text-align:center;">
                <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;
                  font-size:12px;color:#9898B8;text-transform:uppercase;
                  letter-spacing:0.1em;">
                  Verification Code
                </p>
                <p style="margin:0;font-family:'Courier New',Courier,monospace;
                  font-size:48px;font-weight:bold;color:#C74A86;
                  letter-spacing:12px;line-height:1.2;">
                  ${safeCode}
                </p>
                <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;
                  font-size:12px;color:#9898B8;">
                  Valid for 10 minutes
                </p>
              </td>
            </tr>
          </table>

          ${emailParagraph('Enter this code in the verification box to continue your application. Do not share this code with anyone.')}

          ${emailAlert('warning', 'If you did not request this code, you can safely ignore this email.')}

          ${emailDivider()}

          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;
            font-size:13px;color:#9898B8;line-height:1.6;">
            Rev Multimedia sends this code to verify your email address
            before processing applications.
          </p>
        `,
    }),
  )
}

/** @deprecated Use sendOTP */
export const sendOtpEmail = sendOTP

export async function sendApplicationReceived(
  to: string,
  data: {
    name: string
    reference: string
    courseName?: string
    intakeName?: string
  },
): Promise<void> {
  const infoRows = data.courseName
    ? [
        { label: 'Course applied', value: data.courseName },
        ...(data.intakeName ? [{ label: 'Intake', value: data.intakeName }] : []),
      ]
    : []

  await sendHtmlEmail(
    to,
    `Application received — ${data.reference}`,
    emailTemplate({
      previewText: `Your application to Rev Multimedia has been received. Reference: ${data.reference}`,
      body: `
          ${emailGreeting(data.name)}
          ${emailHeading('Application received.')}
          ${emailSubheading('Thank you for applying to Rev Multimedia.')}

          ${emailParagraph('We have received your application and our admissions team will review it shortly. You will be notified of any updates by email.')}

          ${emailReferenceCard('Your Application Reference', data.reference)}

          ${infoRows.length > 0 ? emailInfoCard(infoRows) : ''}

          ${emailHeading('Next steps')}
          ${emailParagraph('1. Pay your application fee (GHS 100) to complete your application.')}
          ${emailParagraph('2. Log in to your portal using your application reference and password.')}
          ${emailParagraph('3. Our team will review your application and update you within 5–7 working days.')}

          ${emailButton('Go to your portal', `${appUrl()}/portal/application`)}

          ${emailAlert('info', `Save your application reference: <strong>${escapeHtml(data.reference)}</strong>. You will need it to log in to your portal.`)}
        `,
    }),
  )
}

export async function sendAppFeeInvoice(
  to: string,
  data: {
    name: string
    reference: string
    amountGhs: number
    paystackLink?: string
  },
): Promise<void> {
  const portalUrl = `${appUrl()}/portal/application`
  const paySection = data.paystackLink
    ? emailButton('Pay application fee', data.paystackLink)
    : emailButton('View in portal', portalUrl)

  await sendHtmlEmail(
    to,
    `Application fee invoice — ${data.reference}`,
    emailTemplate({
      previewText: `Pay your application fee of GHS ${data.amountGhs.toFixed(2)} for reference ${data.reference}.`,
      body: `
          ${emailGreeting(data.name)}
          ${emailHeading('Your application fee invoice')}
          ${emailParagraph('Complete your application by paying the application fee below.')}

          <table cellpadding="0" cellspacing="0" role="presentation"
            width="100%" style="margin:24px 0;">
            <tr>
              <td style="background:linear-gradient(135deg,#1A1A2E,#2F2F52);
                border-radius:16px;padding:28px;text-align:center;">
                <p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;
                  font-size:12px;color:rgba(255,255,255,0.6);text-transform:uppercase;
                  letter-spacing:0.1em;">
                  Amount Due
                </p>
                <p style="margin:0;font-family:Georgia,serif;
                  font-size:42px;font-weight:bold;color:#C74A86;">
                  GHS ${escapeHtml(data.amountGhs.toFixed(2))}
                </p>
              </td>
            </tr>
          </table>

          ${emailInfoCard([
            { label: 'Invoice Reference', value: data.reference },
            { label: 'Type', value: 'Application Fee' },
          ])}

          ${paySection}

          ${emailAlert('warning', `Quote reference <strong>${escapeHtml(data.reference)}</strong> when paying so we can match your payment.`)}
        `,
    }),
  )
}

export async function sendStatusChanged(
  to: string,
  data: { name: string; status: string; reference?: string },
): Promise<void> {
  const statusMessages: Record<
    string,
    {
      subject: string
      heading: string
      body: string
      alert?: { type: 'info' | 'success' | 'warning'; text: string }
    }
  > = {
    under_review: {
      subject: 'Your application is under review',
      heading: 'Your application is being reviewed.',
      body: 'Our admissions team is currently reviewing your application. We will be in touch soon with an update.',
    },
    shortlisted: {
      subject: 'Great news — you have been shortlisted',
      heading: 'You have been shortlisted!',
      body: 'Congratulations! Your application has been shortlisted. Our team will be in touch shortly with further information.',
      alert: {
        type: 'success',
        text: 'You are one step closer to joining Rev Multimedia.',
      },
    },
    accepted: {
      subject: 'Congratulations — your application has been accepted',
      heading: 'Welcome to Rev Multimedia!',
      body: 'We are thrilled to inform you that your application has been accepted. Please log in to your portal to view your tuition invoice and complete payment to secure your place.',
      alert: {
        type: 'success',
        text: 'Pay your tuition fee to confirm your enrollment and receive your Student ID.',
      },
    },
    rejected: {
      subject: 'Update on your application',
      heading: 'Application update.',
      body: 'After careful review, we are unable to offer you a place in this cohort. We appreciate your interest in Rev Multimedia and encourage you to apply again in a future intake.',
      alert: {
        type: 'warning',
        text: 'You are welcome to apply for a future cohort. New intakes open regularly.',
      },
    },
    deferred: {
      subject: 'Your application has been deferred',
      heading: 'Application deferred.',
      body: 'Your application has been deferred to a future intake. We will be in touch with more details about the next available cohort.',
    },
  }

  const content = statusMessages[data.status] ?? {
    subject: 'Update on your application',
    heading: 'Application update.',
    body: 'There has been an update to your application. Please log in to your portal for details.',
  }

  await sendHtmlEmail(
    to,
    content.subject,
    emailTemplate({
      previewText: content.subject,
      body: `
          ${emailGreeting(data.name)}
          ${emailHeading(content.heading)}
          ${emailParagraph(content.body)}
          ${content.alert ? emailAlert(content.alert.type, content.alert.text) : ''}
          ${data.reference ? emailReferenceCard('Application Reference', data.reference) : ''}
          ${emailButton('View your portal', `${appUrl()}/portal/application`)}
        `,
    }),
  )
}

export async function sendTuitionInvoice(
  to: string,
  data: {
    name: string
    reference: string
    amountGhs: number
    dueDate: string
    isInternational: boolean
    momoNumber?: string
    momoName?: string
    bankName?: string
    bankAccount?: string
    bankAccountName?: string
    swiftCode?: string
    pdfUrl?: string
  },
): Promise<void> {
  const dueFormatted = formatInvoiceDate(data.dueDate)

  await sendHtmlEmail(
    to,
    `Tuition invoice ${data.reference} — GHS ${data.amountGhs.toFixed(2)}`,
    emailTemplate({
      previewText: `Your tuition invoice for GHS ${data.amountGhs.toFixed(2)} is ready. Due ${dueFormatted}.`,
      body: `
          ${emailGreeting(data.name)}
          ${emailHeading('Your tuition invoice is ready.')}
          ${emailParagraph('Please find your tuition invoice details below. Pay before the due date to secure your enrollment.')}

          <table cellpadding="0" cellspacing="0" role="presentation"
            width="100%" style="margin:24px 0;">
            <tr>
              <td style="background:linear-gradient(135deg,#1A1A2E,#2F2F52);
                border-radius:16px;padding:28px;text-align:center;">
                <p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;
                  font-size:12px;color:rgba(255,255,255,0.6);text-transform:uppercase;
                  letter-spacing:0.1em;">
                  Amount Due
                </p>
                <p style="margin:0 0 8px;font-family:Georgia,serif;
                  font-size:42px;font-weight:bold;color:#C74A86;">
                  GHS ${escapeHtml(data.amountGhs.toFixed(2))}
                </p>
                <p style="margin:0;font-family:Helvetica,Arial,sans-serif;
                  font-size:13px;color:rgba(255,255,255,0.5);">
                  Due ${escapeHtml(dueFormatted)}
                </p>
              </td>
            </tr>
          </table>

          ${emailInfoCard([
            { label: 'Invoice Reference', value: data.reference },
            { label: 'Due Date', value: dueFormatted },
          ])}

          <table cellpadding="0" cellspacing="0" role="presentation"
            width="100%" style="margin:24px 0;">
            <tr>
              <td style="background-color:#F7F8FC;border-radius:16px;padding:24px;">
                <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;
                  font-size:15px;font-weight:bold;color:#1A1A2E;">
                  How to pay
                </p>

                ${
                  data.momoNumber
                    ? `
                <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;
                  font-size:12px;color:#C74A86;font-weight:bold;
                  text-transform:uppercase;letter-spacing:0.06em;">
                  Mobile Money (MoMo)
                </p>
                ${emailInfoCard([
                  { label: 'MoMo Number', value: data.momoNumber },
                  { label: 'Account Name', value: data.momoName || '—' },
                ])}
                `
                    : ''
                }

                ${
                  data.bankName
                    ? `
                <p style="margin:16px 0 8px;font-family:Helvetica,Arial,sans-serif;
                  font-size:12px;color:#C74A86;font-weight:bold;
                  text-transform:uppercase;letter-spacing:0.06em;">
                  Bank Transfer
                </p>
                ${emailInfoCard([
                  { label: 'Bank', value: data.bankName },
                  { label: 'Account Number', value: data.bankAccount || '—' },
                  { label: 'Account Name', value: data.bankAccountName || '—' },
                ])}
                `
                    : ''
                }

                ${
                  data.isInternational && data.swiftCode
                    ? `
                <p style="margin:16px 0 8px;font-family:Helvetica,Arial,sans-serif;
                  font-size:12px;color:#C74A86;font-weight:bold;
                  text-transform:uppercase;letter-spacing:0.06em;">
                  International Wire Transfer
                </p>
                ${emailInfoCard([{ label: 'SWIFT / BIC', value: data.swiftCode }])}
                `
                    : ''
                }

                <table cellpadding="0" cellspacing="0" role="presentation"
                  width="100%" style="margin-top:16px;">
                  <tr>
                    <td style="background-color:#EBF9F8;border:1.5px solid rgba(45,191,184,0.30);
                      border-radius:10px;padding:14px 16px;text-align:center;">
                      <p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;
                        font-size:11px;color:#9898B8;text-transform:uppercase;
                        letter-spacing:0.08em;">
                        Quote this reference in your payment description
                      </p>
                      <p style="margin:0;font-family:'Courier New',Courier,monospace;
                        font-size:20px;font-weight:bold;color:#2DBFB8;">
                        ${escapeHtml(data.reference)}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          ${
            data.pdfUrl
              ? `
          ${emailButton('Download Invoice PDF', data.pdfUrl)}
          <p style="margin:-16px 0 16px;font-family:Helvetica,Arial,sans-serif;
            font-size:12px;color:#9898B8;text-align:center;">
            PDF link expires in 24 hours
          </p>
          `
              : ''
          }

          ${emailButton('View in portal', `${appUrl()}/portal/invoices`)}

          ${emailAlert('warning', `Payments must include the reference number <strong>${escapeHtml(data.reference)}</strong> to be processed correctly.`)}
        `,
    }),
  )
}

export async function sendPasswordReset(
  to: string,
  data: { name?: string; resetUrl: string; isAdmin?: boolean },
): Promise<void> {
  const accountType = data.isAdmin ? 'admin' : 'portal'
  await sendHtmlEmail(
    to,
    'Reset your Rev Multimedia password',
    emailTemplate({
      previewText:
        'Click the link to reset your password. This link expires in 1 hour.',
      body: `
          ${emailGreeting(data.name?.trim() || 'there')}
          ${emailHeading('Reset your password.')}
          ${emailParagraph(`We received a request to reset the password for your Rev Multimedia ${accountType} account. Click the button below to set a new password.`)}

          ${emailButton('Reset my password', data.resetUrl)}

          ${emailAlert('warning', 'This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email — your password will not change.')}

          ${emailDivider()}

          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;
            font-size:12px;color:#9898B8;line-height:1.6;">
            If the button does not work, copy and paste this link into your browser:<br>
            <a href="${escapeHtml(data.resetUrl)}" style="color:#C74A86;word-break:break-all;">
              ${escapeHtml(data.resetUrl)}
            </a>
          </p>
        `,
    }),
  )
}

export async function sendAdminInvite(
  to: string,
  data: {
    fullName: string
    role: string
    inviteUrl: string
    invitedBy: string
    resent?: boolean
  },
): Promise<void> {
  const intro = data.resent
    ? emailParagraph(
        `Your invitation to join as <strong>${escapeHtml(data.role)}</strong> has been resent.`,
      )
    : emailParagraph(
        `<strong>${escapeHtml(data.invitedBy)}</strong> has invited you to join the Rev Multimedia admin dashboard as <strong>${escapeHtml(data.role)}</strong>.`,
      )

  await sendHtmlEmail(
    to,
    'You have been invited to Rev Multimedia Admin',
    emailTemplate({
      previewText: `${data.invitedBy} has invited you to join Rev Multimedia as ${data.role}.`,
      body: `
          ${emailGreeting(data.fullName)}
          ${emailHeading('You have been invited.')}
          ${intro}
          ${emailParagraph('Click the button below to accept the invitation and set your password. This invitation expires in 48 hours.')}
          ${emailButton('Accept invitation', data.inviteUrl)}
          ${emailAlert('info', 'If you were not expecting this invitation, you can safely ignore this email.')}
          ${emailDivider()}
          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;
            font-size:12px;color:#9898B8;">
            This invitation was sent by ${escapeHtml(data.invitedBy)} at Rev Multimedia.
          </p>
        `,
    }),
  )
}

export async function sendCertificateUploaded(
  to: string,
  data: { name: string; courseName: string },
): Promise<void> {
  await sendHtmlEmail(
    to,
    `Your ${data.courseName} certificate is ready`,
    emailTemplate({
      previewText: `Your ${data.courseName} certificate from Rev Multimedia is ready to download.`,
      body: `
          ${emailGreeting(data.name)}
          ${emailHeading('Your certificate is ready!')}
          ${emailParagraph(`Congratulations on completing <strong>${escapeHtml(data.courseName)}</strong>. Your certificate is now available to download from your student portal.`)}
          ${emailButton('Download my certificate', `${appUrl()}/portal/resources`)}
          ${emailAlert('success', 'Add this certificate to your LinkedIn profile and portfolio to showcase your skills.')}
        `,
    }),
  )
}

export async function sendPaymentConfirmed(
  to: string,
  data: {
    name: string
    studentId?: string
    courseName?: string
    amountPaid?: number
  },
): Promise<void> {
  const hasEnrollment = Boolean(data.studentId)

  await sendHtmlEmail(
    to,
    hasEnrollment
      ? `Welcome to Rev Multimedia — Student ID: ${data.studentId}`
      : 'Payment confirmed',
    emailTemplate({
      previewText: hasEnrollment
        ? `Your Student ID is ${data.studentId}. Welcome to Rev Multimedia!`
        : 'Your payment has been confirmed.',
      body: `
          ${emailGreeting(data.name)}
          ${emailHeading(hasEnrollment ? 'Welcome to Rev Multimedia!' : 'Payment confirmed!')}

          ${
            hasEnrollment
              ? `
          ${emailParagraph('Your tuition payment has been confirmed and your enrollment is complete. Welcome to Rev Multimedia!')}
          ${emailReferenceCard('Your Student ID', data.studentId!)}
          ${data.courseName ? emailInfoCard([{ label: 'Programme', value: data.courseName }]) : ''}
          ${emailAlert('success', 'Save your Student ID. You will use it to log in to your student portal.')}
          ${emailButton('Go to my student portal', `${appUrl()}/portal/dashboard`)}
          `
              : `
          ${emailParagraph('Your payment has been received and confirmed. Your account has been updated.')}
          ${emailButton('View my portal', `${appUrl()}/portal/application`)}
          `
          }
        `,
    }),
  )
}

export async function sendAdminNewApplication(params: {
  applicantName: string
  reference: string
  course: string
}): Promise<void> {
  await sendHtmlEmail(
    adminEmail,
    `New application — ${params.reference}`,
    emailTemplate({
      previewText: `New application from ${params.applicantName} (${params.reference}).`,
      body: `
          ${emailGreeting('Team')}
          ${emailHeading('New application received')}
          ${emailParagraph('A new application has been submitted on the public apply form.')}

          ${emailInfoCard([
            { label: 'Applicant', value: params.applicantName },
            { label: 'Reference', value: params.reference },
            { label: 'Course', value: params.course },
          ])}

          ${emailButton('Review in admin', `${appUrl()}/admin/applications`)}
        `,
    }),
  )
}

const contactAdminEmail = 'godfredkojoappiah@gmail.com'

export async function sendContactForm(data: {
  name: string
  email: string
  phone?: string
  message: string
}): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.error('[email] RESEND_API_KEY is not configured — contact form')
    return
  }

  const safeMessage = escapeHtml(data.message)
  const safeName = escapeHtml(data.name)

  await withRetry(async () => {
    await resend.emails.send({
      from: fromEmail,
      to: contactAdminEmail,
      replyTo: data.email,
      subject: `New message from ${data.name} — Rev Multimedia Website`,
      html: emailTemplate({
        previewText: `${data.name} sent a message via the Rev Multimedia website.`,
        body: `
          ${emailHeading('New contact message')}
          ${emailParagraph('You received a new message from the Rev Multimedia website contact form.')}

          ${emailInfoCard([
            { label: 'Name', value: data.name },
            { label: 'Email', value: data.email },
            { label: 'Phone', value: data.phone || 'Not provided' },
          ])}

          <div style="
            background-color: #F7F8FC;
            border-radius: 12px;
            padding: 20px 24px;
            margin: 16px 0;
            border-left: 3px solid #C74A86;
          ">
            <p style="
              font-family: DM Sans, sans-serif;
              font-size: 12px;
              color: #9898B8;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              margin: 0 0 8px;
            ">Message</p>
            <p style="
              font-family: DM Sans, sans-serif;
              font-size: 15px;
              color: #1A1A2E;
              line-height: 1.7;
              margin: 0;
              white-space: pre-wrap;
            ">${safeMessage}</p>
          </div>

          ${emailButton('Reply to ' + safeName, `mailto:${encodeURIComponent(data.email)}`)}
        `,
      }),
    })

    await resend.emails.send({
      from: fromEmail,
      to: data.email,
      subject: 'We received your message — Rev Multimedia',
      html: emailTemplate({
        previewText: 'Thank you for reaching out. We will be in touch shortly.',
        body: `
          ${emailGreeting(data.name)}
          ${emailHeading('Message received.')}
          ${emailParagraph('Thank you for reaching out to Rev Multimedia. We have received your message and will get back to you within 1–2 business days.')}
          ${emailAlert('info', 'If your enquiry is urgent, you can also reach us at <strong>+233 27 581 8525</strong>.')}
          ${emailDivider()}
          ${emailParagraph('Here is a copy of your message:')}
          <div style="
            background-color: #F7F8FC;
            border-radius: 12px;
            padding: 20px 24px;
            border-left: 3px solid #C74A86;
          ">
            <p style="
              font-family: DM Sans, sans-serif;
              font-size: 15px;
              color: #5A5A7A;
              line-height: 1.7;
              margin: 0;
              white-space: pre-wrap;
            ">${safeMessage}</p>
          </div>
        `,
      }),
    })
  }, { maxRetries: 3, baseDelayMs: 1000 })
}
