import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()

  if (userId) {
    return NextResponse.json({ authenticated: true, userId })
  }

  return NextResponse.json({ authenticated: false })
}

