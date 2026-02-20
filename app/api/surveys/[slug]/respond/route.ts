import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    if (!slug) {
      return NextResponse.json({ error: 'Slug mangler' }, { status: 400 })
    }

    const { data: survey } = await supabase
      .from('surveys')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!survey) {
      return NextResponse.json({ error: 'Undersøgelse ikke fundet' }, { status: 404 })
    }

    const body = await request.json()
    const answers = body?.answers ?? {}

    const { error } = await supabase.from('survey_responses').insert({
      survey_id: survey.id,
      answers,
    })

    if (error) {
      console.error('Survey respond error:', error)
      return NextResponse.json(
        { error: 'Kunne ikke gemme svar' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Survey respond POST:', err)
    return NextResponse.json({ error: 'Intern server fejl' }, { status: 500 })
  }
}
