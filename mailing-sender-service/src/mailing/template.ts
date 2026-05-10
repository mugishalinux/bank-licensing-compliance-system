import Handlebars from 'handlebars';

const ACCENT = 'rgb(137, 115, 78)';

const SOURCE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;">
          <tr>
            <td style="padding:24px 32px;background:${ACCENT};">
              <div style="color:#ffffff;font-weight:700;font-size:18px;letter-spacing:0.3px;">BNR Licensing Portal</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#000000;">
              <p style="margin:0 0 16px 0;font-size:16px;">Hello {{name}},</p>
              <div style="font-size:15px;line-height:1.6;white-space:pre-wrap;">{{message}}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;color:#666;font-size:12px;">
              National Bank of Rwanda &middot; Licensing &amp; Compliance Portal
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const TEMPLATE = Handlebars.compile(SOURCE);

export function renderEmail(name: string, message: string, subject = 'BNR Licensing Portal') {
  return TEMPLATE({ name, message, subject });
}
