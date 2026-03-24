import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/users'
import { createPasswordResetToken, sendResetPasswordEmail } from '@/lib/forgot-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email er påkrævet' }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (user?.email) {
      const token = await createPasswordResetToken(user.id)
      await sendResetPasswordEmail(user.email, token)
    }

    return NextResponse.json({
      success: true,
      message: 'Hvis email findes, har vi sendt et reset-link.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Intern server fejl', message: error.message },
      { status: 500 }
    )
  }
}
