import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { createAbTest } from '@/lib/ab-test'
import { getBaseUrl } from '@/lib/data'

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Ikke autentificeret' }, { status: 401 })
    }

    const body = await request.json()
    const { title, variants } = body as { title?: string; variants: { label: string; type: 'url' | 'image'; value: string }[] }

    if (!variants?.length || variants.length < 2) {
      return NextResponse.json({ error: 'Tilføj mindst 2 varianter' }, { status: 400 })
    }

    for (const v of variants) {
      if (!v.label || !v.type || (v.type !== 'url' && v.type !== 'image') || !v.value?.trim()) {
        return NextResponse.json({ error: 'Hver variant skal have label, type (url eller image) og value' }, { status: 400 })
      }
    }

    const result = await createAbTest(userId, title?.trim() || 'A/B/N Test', variants)
    if (!result) {
      return NextResponse.json({ error: 'Kunne ikke oprette test' }, { status: 500 })
    }

    const baseUrl = getBaseUrl()
    const magicLink = `${baseUrl}/tools/ab-test/v/${result.magicSlug}`

    return NextResponse.json({
      success: true,
      testId: result.test.id,
      magicSlug: result.magicSlug,
      magicLink,
    })
  } catch (err: unknown) {
    console.error('ab-test create error:', err)
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}
