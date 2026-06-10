import { escapeHtml } from '@/lib/security/escape-html'

/** Rev Multimedia primary brand pink */
export const BRAND_PINK = '#E8007D'

const BRAND_LOGO_HTML = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="display:block;">
  <circle cx="7" cy="7" r="7" fill="#E8007D"/>
  <circle cx="25" cy="7" r="7" fill="#F5A800"/>
  <circle cx="7" cy="25" r="7" fill="#00B5B5"/>
  <circle cx="25" cy="25" r="7" fill="#7B2D8B"/>
</svg>`

const ACCENT_GRADIENT_RULE = `<tr><td height="3" style="height:3px;background:linear-gradient(to right,#E8007D,#F5A800,#00B5B5,#7B2D8B);font-size:0;line-height:0;">&nbsp;</td></tr>`

export type EmailContactDetails = {
  email: string
  website: string
  phone: string
}

export interface EmailTemplateOptions {
  recipientName: string
  badgeLabel: string
  badgeColor?: string
  title: string
  bodyHtml: string
  ctaButton?: { label: string; url: string }
  ctaNote?: string
  footerNote?: string
  accentColor?: string
  contact?: EmailContactDetails
}

/** Base URL for portal/admin links in emails (from env; never hardcoded per environment). */
export function emailAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (raw) return raw
  return 'http://localhost:3000'
}

export function resolveEmailContactFooter(
  settings?: Record<string, string>,
): EmailContactDetails {
  const siteUrl = emailAppUrl()

  let website = settings?.academy_website?.trim()
  if (!website && siteUrl) {
    try {
      website = new URL(siteUrl).hostname
    } catch {
      website = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    }
  }

  return {
    email:
      settings?.academy_email?.trim() ||
      process.env.ACADEMY_EMAIL?.trim() ||
      process.env.RESEND_FROM_EMAIL?.trim() ||
      'info@revmultimedia.com',
    website: website || 'revmultimedia.com',
    phone:
      settings?.academy_phone?.trim() ||
      process.env.ACADEMY_PHONE?.trim() ||
      '+233 27 581 8525',
  }
}

export function emailSubject(badgeLabel: string, title: string): string {
  return `${badgeLabel}  -  ${title}`
}

export function buildEmailHtml(opts: EmailTemplateOptions): string {
  const accent = opts.accentColor ?? BRAND_PINK
  const badge = opts.badgeColor ?? BRAND_PINK
  const contact = opts.contact ?? resolveEmailContactFooter()
  const safeName = escapeHtml(opts.recipientName)
  const safeTitle = escapeHtml(opts.title)
  const safeBadge = escapeHtml(opts.badgeLabel)
  const safeCtaLabel = opts.ctaButton ? escapeHtml(opts.ctaButton.label) : ''
  const safeCtaUrl = opts.ctaButton ? escapeHtml(opts.ctaButton.url) : ''
  const safeCtaNote = opts.ctaNote ? escapeHtml(opts.ctaNote) : ''
  const safeFooterNote = opts.footerNote ? escapeHtml(opts.footerNote) : ''
  const websiteDisplay = escapeHtml(
    contact.website.replace(/^https?:\/\//, '').replace(/\/$/, ''),
  )
  const websiteHref = contact.website.startsWith('http')
    ? escapeHtml(contact.website)
    : escapeHtml(`https://${contact.website.replace(/^\/\//, '')}`)
  const contactEmail = escapeHtml(contact.email)
  const contactPhone = escapeHtml(contact.phone)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">

<!-- HEADER -->
<tr><td style="background:#1a1a2e;padding:20px 28px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td>
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
<tr>
<td style="padding-right:12px;vertical-align:middle;">
${BRAND_LOGO_HTML}
</td>
<td style="vertical-align:middle;">
<div style="color:#ffffff;font-weight:700;font-size:15px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">Rev Multimedia</div>
<div style="color:#888888;font-size:10px;letter-spacing:0.8px;text-transform:uppercase;font-family:'Plus Jakarta Sans',Arial,sans-serif;">Creative Education</div>
</td>
</tr>
</table>
</td>
<td align="right" style="vertical-align:middle;">
<span style="background:${badge};color:#ffffff;font-size:10px;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;font-weight:600;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${safeBadge}</span>
</td>
</tr>
</table>
</td></tr>

<!-- ACCENT RULE -->
${ACCENT_GRADIENT_RULE}

<!-- BODY -->
<tr><td style="padding:32px 28px 24px;">
<p style="margin:0 0 6px;font-size:13px;color:#888888;font-family:'Plus Jakarta Sans',Arial,sans-serif;">Hi ${safeName},</p>
<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;line-height:1.3;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${safeTitle}</h1>
${opts.bodyHtml}
${
  opts.ctaButton
    ? `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0;">
<tr><td align="center">
<a href="${safeCtaUrl}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:15px;font-weight:600;letter-spacing:0.3px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${safeCtaLabel}</a>
${opts.ctaNote ? `<p style="margin:10px 0 0;font-size:12px;color:#999999;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${safeCtaNote}</p>` : ''}
</td></tr>
</table>`
    : ''
}
${opts.footerNote ? `<p style="margin:24px 0 0;font-size:12px;color:#999999;line-height:1.6;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${safeFooterNote}</p>` : ''}
</td></tr>

<!-- FOOTER -->
<tr><td style="background:#1a1a2e;padding:16px 28px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td style="color:#666666;font-size:11px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${contactEmail}</td>
<td align="center" style="color:#666666;font-size:11px;font-family:'Plus Jakarta Sans',Arial,sans-serif;"><a href="${websiteHref}" style="color:#666666;text-decoration:none;">${websiteDisplay}</a></td>
<td align="right" style="color:#666666;font-size:11px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${contactPhone}</td>
</tr>
</table>
</td></tr>
<tr><td style="background:#1a1a2e;padding:0 28px 16px;text-align:center;">
<p style="margin:0;color:#444444;font-size:10px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">© ${new Date().getFullYear()} Rev Multimedia · Weija, Greater Accra, Ghana</p>
<p style="margin:4px 0 0;color:#444444;font-size:10px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">You are receiving this because you have an account or application with Rev Multimedia.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

export function detailsCard(
  rows: { label: string; value: string }[],
  accentColor = BRAND_PINK,
): string {
  return `<div style="background:#f7f7f7;border-left:3px solid ${accentColor};border-radius:0 6px 6px 0;padding:14px 16px;margin:16px 0 20px;">
  <div style="font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">Details</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  ${rows
    .map(
      (r) =>
        `<tr><td style="color:#666666;padding:3px 0;">${escapeHtml(r.label)}</td><td style="text-align:right;color:#1a1a2e;font-weight:600;padding:3px 0;">${escapeHtml(r.value)}</td></tr>`,
    )
    .join('')}
  </table>
  </div>`
}

export function bodyParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${escapeHtml(text)}</p>`
}

export function bodyParagraphHtml(html: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${html}</p>`
}

export function warningCard(text: string): string {
  return `<div style="background:#fff8f0;border-left:3px solid #f5a623;border-radius:0 6px 6px 0;padding:12px 16px;margin:16px 0 20px;font-size:13px;color:#8a5a00;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${escapeHtml(text)}</div>`
}

export function successCard(text: string): string {
  return `<div style="background:#f0faf5;border-left:3px solid #2ecc71;border-radius:0 6px 6px 0;padding:12px 16px;margin:16px 0 20px;font-size:13px;color:#1a6b3a;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${escapeHtml(text)}</div>`
}

export function otpCodeBlock(code: string): string {
  const safeCode = escapeHtml(code)
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 20px;">
<tr><td style="background:#f7f7f7;border:1px solid #e0e0e0;border-radius:8px;padding:28px;text-align:center;">
<p style="margin:0 0 8px;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:0.8px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">Verification code</p>
<p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;color:${BRAND_PINK};letter-spacing:10px;line-height:1.2;">${safeCode}</p>
<p style="margin:14px 0 0;font-size:12px;color:#999999;font-family:'Plus Jakarta Sans',Arial,sans-serif;">Valid for 10 minutes</p>
</td></tr>
</table>`
}

export function amountDueBlock(amountGhs: number, dueDate?: string): string {
  const dueLine = dueDate
    ? `<p style="margin:8px 0 0;font-size:13px;color:#888888;font-family:'Plus Jakarta Sans',Arial,sans-serif;">Due ${escapeHtml(dueDate)}</p>`
    : ''
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 16px;">
<tr><td style="background:#1a1a2e;border-radius:8px;padding:24px;text-align:center;">
<p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.08em;font-family:'Plus Jakarta Sans',Arial,sans-serif;">Amount due</p>
<p style="margin:0;font-size:32px;font-weight:700;color:${BRAND_PINK};font-family:'Plus Jakarta Sans',Arial,sans-serif;">GHS ${escapeHtml(amountGhs.toFixed(2))}</p>
${dueLine}
</td></tr>
</table>`
}

export function messageQuoteBlock(message: string): string {
  return `<div style="background:#f7f7f7;border-left:3px solid ${BRAND_PINK};border-radius:0 6px 6px 0;padding:14px 16px;margin:16px 0 20px;">
<p style="margin:0;font-size:14px;color:#444444;line-height:1.7;white-space:pre-wrap;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${escapeHtml(message)}</p>
</div>`
}
