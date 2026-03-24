type BaseEmailParams = {
  preheader?: string
  title: string
  intro: string
  outro?: string
  accentLabel?: string
  contentHtml: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function renderForgeLabEmail(params: BaseEmailParams): string {
  const preheader = params.preheader || 'Notifikation fra ForgeLab'
  const accentLabel = params.accentLabel || 'ForgeLab Account'
  const outro =
    params.outro ||
    'Hvis du ikke genkender denne handling, kan du ignorere mailen. Dit ForgeLab account er sikkert.'

  return `
<!doctype html>
<html lang="da">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ForgeLab</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#f59e0b 0%,#f97316 100%);padding:22px 26px;">
                <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#fffbeb;font-weight:700;">
                  ${escapeHtml(accentLabel)}
                </div>
                <div style="margin-top:8px;font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;">
                  ForgeLab
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 26px 10px;">
                <h1 style="margin:0 0 10px;font-size:24px;line-height:1.25;color:#111827;">
                  ${escapeHtml(params.title)}
                </h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#4b5563;">
                  ${escapeHtml(params.intro)}
                </p>
                ${params.contentHtml}
                <p style="margin:22px 0 0;font-size:14px;line-height:1.65;color:#6b7280;">
                  ${escapeHtml(outro)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 26px 28px;">
                <div style="height:1px;background:#e5e7eb;margin-bottom:14px;"></div>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
                  Sendt af ForgeLab · www.forgelab.dk
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

export function renderResetPasswordEmail(params: { resetUrl: string; ttlMinutes: number }) {
  const safeUrl = escapeHtml(params.resetUrl)
  return renderForgeLabEmail({
    preheader: 'Nulstil dit ForgeLab kodeord',
    accentLabel: 'Sikkerhed',
    title: 'Nulstil dit kodeord',
    intro: 'Vi har modtaget en anmodning om at nulstille dit kodeord til ForgeLab.',
    contentHtml: `
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
        <tr>
          <td style="border-radius:10px;background:#111827;">
            <a href="${safeUrl}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">
              Nulstil kodeord
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 12px;font-size:13px;line-height:1.65;color:#6b7280;">
        Hvis knappen ikke virker, kopier dette link:
      </p>
      <p style="margin:0 0 14px;font-size:12px;line-height:1.65;color:#374151;word-break:break-all;">
        ${safeUrl}
      </p>
      <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:12px 14px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#92400e;">
          Linket udlober om ${params.ttlMinutes} minutter.
        </p>
      </div>
    `,
  })
}

export function renderUsernameRecoveryEmail(params: { username: string }) {
  return renderForgeLabEmail({
    preheader: 'Dit ForgeLab brugernavn',
    accentLabel: 'Brugerkonto',
    title: 'Dit brugernavn',
    intro: 'Du har bedt om hjaelp til at finde dit brugernavn til ForgeLab.',
    contentHtml: `
      <div style="border:1px solid #d1d5db;background:#f9fafb;border-radius:10px;padding:14px 16px;margin:0 0 14px;">
        <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">
          Brugernavn
        </p>
        <p style="margin:6px 0 0;font-size:20px;line-height:1.35;color:#111827;font-weight:800;">
          ${escapeHtml(params.username)}
        </p>
      </div>
    `,
  })
}
