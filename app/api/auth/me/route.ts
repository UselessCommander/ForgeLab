import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { getUserById } from '@/lib/users'

export async function GET() {
  const userId = await getCurrentUserId()

  if (userId) {
    if (userId === 'admin') {
      return NextResponse.json({ authenticated: true, userId, username: 'admin' })
    }

    const user = await getUserById(userId)
    return NextResponse.json({
      authenticated: true,
      userId,
      username: user?.username || null,
    })
  }

  return NextResponse.json({ authenticated: false })
}

