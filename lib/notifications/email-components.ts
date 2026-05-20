export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function emailHeading(text: string): string {
  return `
    <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;
      font-size:28px;font-weight:bold;color:#1A1A2E;line-height:1.2;">
      ${escapeHtml(text)}
    </h1>
  `
}

export function emailSubheading(text: string): string {
  return `
    <p style="margin:0 0 24px;font-family:Helvetica,Arial,sans-serif;
      font-size:16px;color:#9898B8;line-height:1.5;">
      ${escapeHtml(text)}
    </p>
  `
}

export function emailGreeting(name: string): string {
  return `
    <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;
      font-size:16px;color:#1A1A2E;line-height:1.7;">
      Hi <strong>${escapeHtml(name)}</strong>,
    </p>
  `
}

/** For trusted template HTML (bold tags, etc.) — do not pass raw user input. */
export function emailParagraph(text: string): string {
  return `
    <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;
      font-size:15px;color:#5A5A7A;line-height:1.7;">
      ${text}
    </p>
  `
}

export function emailButton(text: string, url: string): string {
  const safeUrl = escapeHtml(url)
  return `
    <table cellpadding="0" cellspacing="0" role="presentation"
      style="margin:24px 0;">
      <tr>
        <td style="background-color:#C74A86;border-radius:9999px;
          box-shadow:0 4px 16px rgba(199,74,134,0.30);">
          <a href="${safeUrl}" target="_blank"
            style="display:inline-block;padding:14px 32px;
            font-family:Helvetica,Arial,sans-serif;font-size:15px;
            font-weight:bold;color:#ffffff;text-decoration:none;
            border-radius:9999px;">
            ${escapeHtml(text)}
          </a>
        </td>
      </tr>
    </table>
  `
}

export function emailReferenceCard(label: string, reference: string): string {
  return `
    <table cellpadding="0" cellspacing="0" role="presentation"
      width="100%" style="margin:20px 0;">
      <tr>
        <td style="background-color:#EBF9F8;border:1.5px solid rgba(45,191,184,0.30);
          border-radius:12px;padding:20px 24px;text-align:center;">
          <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;
            font-size:11px;color:#9898B8;text-transform:uppercase;
            letter-spacing:0.08em;">
            ${escapeHtml(label)}
          </p>
          <p style="margin:0;font-family:'Courier New',Courier,monospace;
            font-size:22px;font-weight:bold;color:#2DBFB8;
            letter-spacing:0.04em;">
            ${escapeHtml(reference)}
          </p>
        </td>
      </tr>
    </table>
  `
}

export function emailInfoCard(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows
    .map(
      (row) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EFEFF5;">
        <span style="font-family:Helvetica,Arial,sans-serif;
          font-size:12px;color:#9898B8;text-transform:uppercase;
          letter-spacing:0.06em;">
          ${escapeHtml(row.label)}
        </span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #EFEFF5;
        text-align:right;">
        <span style="font-family:Helvetica,Arial,sans-serif;
          font-size:14px;font-weight:bold;color:#1A1A2E;">
          ${escapeHtml(row.value)}
        </span>
      </td>
    </tr>
  `,
    )
    .join('')

  return `
    <table cellpadding="0" cellspacing="0" role="presentation"
      width="100%" style="margin:16px 0;background-color:#F7F8FC;
      border-radius:12px;padding:4px 20px;">
      ${rowsHtml}
    </table>
  `
}

export function emailDivider(): string {
  return `
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
      <tr>
        <td style="border-top:1px solid #EFEFF5;padding:16px 0;"></td>
      </tr>
    </table>
  `
}

export function emailAlert(
  type: 'info' | 'success' | 'warning',
  text: string,
): string {
  const colors = {
    info: { bg: '#EBF0FD', border: '#4A7BE8', text: '#4A7BE8' },
    success: { bg: '#EBF9F8', border: '#2DBFB8', text: '#1E9990' },
    warning: { bg: '#FEF6EE', border: '#F18F3B', text: '#C4701E' },
  }
  const c = colors[type]
  return `
    <table cellpadding="0" cellspacing="0" role="presentation"
      width="100%" style="margin:16px 0;">
      <tr>
        <td style="background-color:${c.bg};border-left:3px solid ${c.border};
          border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;
            font-size:14px;color:${c.text};line-height:1.5;">
            ${text}
          </p>
        </td>
      </tr>
    </table>
  `
}
