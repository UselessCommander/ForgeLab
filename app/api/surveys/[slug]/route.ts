import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    if (!slug) {
      return NextResponse.json({ error: 'Slug mangler' }, { status: 400 })
    }

    const { data: survey, error } = await supabase
      .from('surveys')
      .select('id, slug, title, description, header_image, design, questions, created_at')
      .eq('slug', slug)
      .single()

    if (error || !survey) {
      return NextResponse.json({ error: 'Undersøgelse ikke fundet' }, { status: 404 })
    }

    return NextResponse.json(survey)
  } catch (err: unknown) {
    console.error('Survey GET:', err)
    return NextResponse.json({ error: 'Intern server fejl' }, { status: 500 })
  }
}
