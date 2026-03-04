import { NextRequest, NextResponse } from 'next/server'
import { submitAbTestResponse } from '@/lib/ab-test'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testId, variantId } = body as { testId?: string; variantId?: string }

    if (!testId || !variantId) {
      return NextResponse.json({ error: 'testId og variantId kræves' }, { status: 400 })
    }

    const ok = await submitAbTestResponse(testId, variantId)
    if (!ok) {
      return NextResponse.json({ error: 'Kunne ikke gemme svar' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('ab-test respond error:', err)
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}
