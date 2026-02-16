import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const cookieStore = await cookies()
      cookieStore.set('forgelab_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Forkert brugernavn eller password' },
        { status: 401 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Intern server fejl', message: error.message },
      { status: 500 }
    )
  }
}
