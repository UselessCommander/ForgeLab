import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/users'
import { setSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email) {
      return NextResponse.json({ error: 'Email mangler' }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: 'Der findes ingen ForgeLab-bruger med den Google-email endnu.' },
        { status: 404 }
      )
    }

    await setSession(user.id, true)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Intern server fejl', message: error?.message || 'Ukendt fejl' },
      { status: 500 }
    )
  }
}
