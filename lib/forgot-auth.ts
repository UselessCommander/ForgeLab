import { randomBytes, createHash } from 'crypto'
import { supabase } from './supabase'
import { sendEmail } from './email'
import { renderResetPasswordEmail, renderUsernameRecoveryEmail } from './email-templates'

const TOKEN_TTL_MINUTES = 30

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function getBaseUrl(): string {
  const fromEnv = process.env.BASE_URL?.trim()
  if (fromEnv) return fromEnv

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercelProduction) {
    return vercelProduction.startsWith('http')
      ? vercelProduction
      : `https://${vercelProduction}`
  }

  throw new Error('BASE_URL mangler. Sæt BASE_URL i environment variables (fx https://www.forgelab.dk).')
}

export async function sendForgotUsernameEmail(email: string, username: string) {
  await sendEmail({
    to: email,
    subject: 'Dit brugernavn til ForgeLab',
    html: renderUsernameRecoveryEmail({ username }),
  })
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = sha256(rawToken)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString()

  await supabase.from('password_reset_tokens').delete().eq('user_id', userId)

  const { error } = await supabase.from('password_reset_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  if (error) {
    throw new Error(`Kunne ikke oprette reset token: ${error.message}`)
  }

  return rawToken
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetUrl = `${getBaseUrl()}/forgot/password/reset?token=${token}`

  await sendEmail({
    to: email,
    subject: 'Nulstil dit kodeord til ForgeLab',
    html: renderResetPasswordEmail({ resetUrl, ttlMinutes: TOKEN_TTL_MINUTES }),
  })
}

export async function consumePasswordResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = sha256(rawToken)
  const nowIso = new Date().toISOString()

  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('id, user_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .limit(1)

  if (error || !data || data.length === 0) {
    return null
  }

  const record = data[0]
  if (record.used_at || record.expires_at < nowIso) {
    return null
  }

  const { error: markUsedError } = await supabase
    .from('password_reset_tokens')
    .update({ used_at: nowIso })
    .eq('id', record.id)

  if (markUsedError) {
    return null
  }

  return record.user_id
}
