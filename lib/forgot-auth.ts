import { randomBytes, createHash } from 'crypto'
import { supabase } from './supabase'
import { sendEmail } from './email'

const TOKEN_TTL_MINUTES = 30

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function getBaseUrl(): string {
  return process.env.BASE_URL || 'http://localhost:3000'
}

export async function sendForgotUsernameEmail(email: string, username: string) {
  await sendEmail({
    to: email,
    subject: 'Dit brugernavn til ForgeLab',
    html: `
      <p>Hej,</p>
      <p>Du har bedt om hjælp til at finde dit brugernavn.</p>
      <p>Dit brugernavn er: <strong>${username}</strong></p>
      <p>Hvis du ikke har bedt om denne mail, kan du ignorere den.</p>
    `,
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
    html: `
      <p>Hej,</p>
      <p>Vi har modtaget en anmodning om at nulstille dit kodeord.</p>
      <p><a href="${resetUrl}">Klik her for at nulstille dit kodeord</a></p>
      <p>Linket udløber om ${TOKEN_TTL_MINUTES} minutter.</p>
      <p>Hvis du ikke har bedt om nulstilling, kan du ignorere denne mail.</p>
    `,
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
