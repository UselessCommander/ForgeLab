import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/users'
import { sendForgotUsernameEmail } from '@/lib/forgot-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email er påkrævet' }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (user) {
      await sendForgotUsernameEmail(email, user.username)
    }

    return NextResponse.json({
      success: true,
      message: 'Hvis email findes, har vi sendt brugernavn til dig.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Intern server fejl', message: error.message },
      { status: 500 }
    )
  }
}
