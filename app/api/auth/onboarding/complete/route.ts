import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { markUserOnboardingComplete } from '@/lib/users'

export async function POST() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ok = await markUserOnboardingComplete(userId)
  if (!ok) {
    return NextResponse.json({ error: 'Kunne ikke gemme' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
