import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, getUserByUsername } from '@/lib/users'
import { setSession } from '@/lib/auth'

function buildBaseUsernameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'user'
  const safe = local
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/[._-]{2,}/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
  if (!safe) return 'user'
  if (safe.length < 3) return `${safe}user`
  return safe.slice(0, 24)
}

async function createGoogleUser(email: string) {
  const base = buildBaseUsernameFromEmail(email)
  const randomPassword = `oauth-${crypto.randomUUID()}-${Date.now()}`
  const candidates = [
    base,
    `${base}-${Math.floor(Math.random() * 9000) + 1000}`,
    `${base}-${Date.now().toString().slice(-6)}`,
  ]

  for (const candidate of candidates) {
    const existing = await getUserByUsername(candidate)
    if (existing) continue
    const created = await createUser(candidate, randomPassword, email)
    if (created) return created
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email) {
      return NextResponse.json({ error: 'Email mangler' }, { status: 400 })
    }

    let user = await getUserByEmail(email)
    let created = false
    if (!user) {
      user = await createGoogleUser(email)
      created = !!user
    }
    if (!user) {
      return NextResponse.json({ error: 'Kunne ikke oprette bruger via Google-login.' }, { status: 500 })
    }

    await setSession(user.id, true)
    return NextResponse.json({ success: true, created, userId: user.id })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Intern server fejl', message: error?.message || 'Ukendt fejl' },
      { status: 500 }
    )
  }
}
