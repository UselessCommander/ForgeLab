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
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Segoe UI,Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #d1d5db;border-radius:0;overflow:hidden;box-shadow:none;">
            <tr>
              <td style="padding:22px 24px 18px;background:#ea8737;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#fff7ed;font-weight:800;">
                  ${escapeHtml(accentLabel)}
                </div>
                <div style="margin-top:10px;font-size:52px;line-height:0.95;font-weight:900;color:#ffffff;letter-spacing:-0.02em;">
                  ForgeLab
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 24px 12px;">
                <h1 style="margin:0 0 10px;font-size:58px;line-height:0.95;color:#111827;font-weight:900;letter-spacing:-0.03em;">
                  ${escapeHtml(params.title)}
                </h1>
                <p style="margin:0 0 20px;font-size:16px;line-height:1.55;color:#4b5563;">
                  ${escapeHtml(params.intro)}
                </p>
                ${params.contentHtml}
                <p style="margin:22px 0 0;font-size:14px;line-height:1.65;color:#6b7280;">
                  ${escapeHtml(outro)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 24px;background:#ffffff;">
                <div style="height:1px;background:#d1d5db;margin-bottom:12px;"></div>
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
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
        <tr>
          <td style="background:#0f172a;border-radius:16px;">
            <a href="${safeUrl}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;letter-spacing:0.01em;">
              Nulstil kodeord
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:#6b7280;">
        Hvis knappen ikke virker, kopier dette link:
      </p>
      <p style="margin:0 0 16px;font-size:12px;line-height:1.6;color:#374151;word-break:break-all;">
        ${safeUrl}
      </p>
      <div style="border-left:4px solid #f59e0b;background:linear-gradient(90deg,#fff7ed 0%,#fffbeb 100%);padding:10px 12px;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#92400e;font-weight:600;">
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
      <div style="border:1px solid #d1d5db;background:#f9fafb;padding:12px 14px;margin:0 0 14px;">
        <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">
          Brugernavn
        </p>
        <p style="margin:6px 0 0;font-size:24px;line-height:1.2;color:#111827;font-weight:800;letter-spacing:-0.01em;">
          ${escapeHtml(params.username)}
        </p>
      </div>
    `,
  })
}
