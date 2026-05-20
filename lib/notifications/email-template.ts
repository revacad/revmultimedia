export function emailTemplate({
  previewText,
  body,
}: {
  previewText: string
  body: string
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Rev Multimedia Academy</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #F0F2F8; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; }
    .email-container { max-width: 600px; margin: 0 auto; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .mobile-pad { padding-left: 24px !important; padding-right: 24px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F0F2F8;font-family:'DM Sans',Helvetica,Arial,sans-serif;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${previewText}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#F0F2F8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" role="presentation"
          style="background-color:#ffffff;border-radius:24px;overflow:hidden;
          box-shadow:0 4px 40px rgba(26,26,46,0.10);">

          <tr>
            <td style="background:linear-gradient(135deg,#C74A86 0%,#9E3068 100%);
              padding:32px 48px;text-align:center;">
              <table cellpadding="0" cellspacing="0" role="presentation"
                style="margin:0 auto;">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="width:8px;height:8px;border-radius:50%;
                          background-color:#ffffff;padding:0;"></td>
                        <td style="width:4px;"></td>
                        <td style="width:8px;height:8px;border-radius:50%;
                          background-color:rgba(255,255,255,0.6);padding:0;"></td>
                      </tr>
                      <tr><td style="height:4px;" colspan="3"></td></tr>
                      <tr>
                        <td style="width:8px;height:8px;border-radius:50%;
                          background-color:rgba(255,255,255,0.6);padding:0;"></td>
                        <td style="width:4px;"></td>
                        <td style="width:8px;height:8px;border-radius:50%;
                          background-color:#ffffff;padding:0;"></td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-family:Georgia,'Times New Roman',serif;
                      font-size:22px;font-weight:bold;color:#ffffff;
                      letter-spacing:-0.5px;">
                      Rev<span style="font-weight:400;">Multimedia</span>
                    </span>
                  </td>
                </tr>
              </table>
              <p style="color:rgba(255,255,255,0.75);font-size:12px;
                margin:8px 0 0;letter-spacing:0.08em;text-transform:uppercase;
                font-family:Helvetica,Arial,sans-serif;">
                Academy
              </p>
            </td>
          </tr>

          <tr>
            <td class="mobile-pad" style="padding:40px 48px;">
              ${body}
            </td>
          </tr>

          <tr>
            <td style="background-color:#F7F8FC;border-top:1px solid #EFEFF5;
              padding:24px 48px;text-align:center;">
              <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;
                font-size:13px;color:#9898B8;">
                Rev Multimedia Academy · Weija, Accra, Ghana
              </p>
              <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;
                font-size:12px;color:#9898B8;">
                <a href="tel:+233275818525" style="color:#9898B8;text-decoration:none;">
                  +233 27 581 8525
                </a>
                &nbsp;·&nbsp;
                <a href="mailto:info@revmultimedia.com"
                  style="color:#9898B8;text-decoration:none;">
                  info@revmultimedia.com
                </a>
              </p>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;
                font-size:11px;color:#D8D8E8;">
                © ${new Date().getFullYear()} Rev Multimedia Academy. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim()
}
