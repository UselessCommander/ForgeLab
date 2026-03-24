import { NextRequest, NextResponse } from 'next/server'
import { consumePasswordResetToken } from '@/lib/forgot-auth'
import { updateUserPassword } from '@/lib/users'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = String(body?.token || '')
    const newPassword = String(body?.password || '')

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token og password er påkrævet' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password skal være mindst 6 tegn' }, { status: 400 })
    }

    const userId = await consumePasswordResetToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Ugyldigt eller udløbet token' }, { status: 400 })
    }

    const success = await updateUserPassword(userId, newPassword)
    if (!success) {
      return NextResponse.json({ error: 'Kunne ikke opdatere password' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Password er nulstillet' })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Intern server fejl', message: error.message },
      { status: 500 }
    )
  }
}
