import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBaseUrl } from '@/lib/data'

function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, header_image, design, questions } = body

    if (!title || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Titel og spørgsmål er påkrævet' },
        { status: 400 }
      )
    }

    let slug = generateSlug()
    let attempts = 0
    const maxAttempts = 5
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase.from('surveys').select('id').eq('slug', slug).maybeSingle()
      if (!existing) break
      slug = generateSlug()
      attempts++
    }

    const { data: survey, error } = await supabase
      .from('surveys')
      .insert({
        slug,
        title: String(title).trim(),
        description: String(description ?? '').trim(),
        header_image: header_image || null,
        design: design && typeof design === 'object' ? design : {},
        questions,
      })
      .select('id, slug')
      .single()

    if (error) {
      console.error('Survey create error:', error)
      return NextResponse.json(
        { error: 'Kunne ikke oprette undersøgelse', message: error.message },
        { status: 500 }
      )
    }

    const baseUrl = getBaseUrl()
    const magicLink = `${baseUrl}/survey/respond/${survey.slug}`

    return NextResponse.json({
      success: true,
      slug: survey.slug,
      magicLink,
    })
  } catch (err: unknown) {
    console.error('Surveys POST:', err)
    return NextResponse.json(
      { error: 'Intern server fejl' },
      { status: 500 }
    )
  }
}
