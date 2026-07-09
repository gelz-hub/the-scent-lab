const PINE = '#2F5D50'
const INK = '#1C2622'
const MUTED = '#6B7A73'
const PAPER = '#F4F1E8'
const RULE = '#E3E0D5'

/** Shared HTML shell for every transactional email — inline styles only, table-safe layout. */
export function emailShell(opts: { preheader: string; heading: string; body: string; ctaLabel?: string; ctaUrl?: string }) {
  const { preheader, heading, body, ctaLabel, ctaUrl } = opts

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>The Scent Lab</title>
  </head>
  <body style="margin:0;padding:0;background:${PAPER};font-family:Georgia,'Times New Roman',serif;color:${INK};">
    <span style="display:none;font-size:1px;color:${PAPER};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:${PINE};padding:28px 32px;">
                <span style="font-family:Georgia,serif;font-size:22px;color:#ffffff;letter-spacing:0.02em;">The Scent Lab</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;font-weight:600;color:${INK};">${heading}</h1>
                <div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:${INK};">${body}</div>
                ${
                  ctaLabel && ctaUrl
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                        <tr>
                          <td style="border-radius:6px;background:${PINE};">
                            <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${ctaLabel}</a>
                          </td>
                        </tr>
                      </table>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${RULE};">
                <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${MUTED};">
                  The Scent Lab — Curated Fragrances. Authentic Brands.<br />
                  Phnom Penh, Cambodia
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${MUTED};width:150px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${INK};text-align:right;vertical-align:top;">${value}</td>
  </tr>`
}

export function detailTable(rows: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid ${RULE};border-bottom:1px solid ${RULE};">
    ${rows}
  </table>`
}
