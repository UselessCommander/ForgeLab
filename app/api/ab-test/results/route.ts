import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { getAbTestResults } from '@/lib/ab-test'

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Ikke autentificeret' }, { status: 401 })
    }

    const testId = request.nextUrl.searchParams.get('testId')
    if (!testId) {
      return NextResponse.json({ error: 'testId kræves' }, { status: 400 })
    }

    const results = await getAbTestResults(testId, userId)
    if (!results) {
      return NextResponse.json({ error: 'Test ikke fundet eller ingen adgang' }, { status: 404 })
    }

    return NextResponse.json({ results })
  } catch (err: unknown) {
    console.error('ab-test results error:', err)
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}
