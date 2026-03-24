import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const defaultFrom = process.env.EMAIL_FROM || 'ForgeLab <no-reply@forgelab.dk>'

let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY mangler i environment variables')
  }

  if (!resendClient) {
    resendClient = new Resend(resendApiKey)
  }

  return resendClient
}

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const resend = getResendClient()

  return resend.emails.send({
    from: defaultFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
  })
}
