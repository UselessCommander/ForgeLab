import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { canViewProject } from '@/lib/project-access'

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filterProjectId = request.nextUrl.searchParams.get('projectId')
    if (filterProjectId) {
      const allowed = await canViewProject(filterProjectId, userId)
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    let query = supabase
      .from('surveys')
      .select('id, slug, title, created_at')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false })

    if (filterProjectId) {
      query = query.eq('project_id', filterProjectId)
    }

    const { data: surveys, error: surveysError } = await query

    if (surveysError) {
      console.error('analytics surveys:', surveysError)
      return NextResponse.json({ error: 'Kunne ikke hente undersøgelser' }, { status: 500 })
    }

    const list = surveys || []
    if (list.length === 0) {
      return NextResponse.json({
        surveys: [],
        summary: { totalSurveys: 0, totalResponses: 0 },
      })
    }

    const ids = list.map((s) => s.id)
    const { data: responses, error: respError } = await supabase
      .from('survey_responses')
      .select('survey_id, created_at')
      .in('survey_id', ids)

    if (respError) {
      console.error('analytics survey responses:', respError)
      return NextResponse.json({ error: 'Kunne ikke hente svar' }, { status: 500 })
    }

    const bySurvey: Record<string, { count: number; byDay: Record<string, number> }> = {}
    for (const id of ids) {
      bySurvey[id] = { count: 0, byDay: {} }
    }
    for (const row of responses || []) {
      const sid = row.survey_id as string
      if (!bySurvey[sid]) continue
      bySurvey[sid].count += 1
      if (row.created_at) {
        const day = new Date(row.created_at as string).toISOString().split('T')[0]
        bySurvey[sid].byDay[day] = (bySurvey[sid].byDay[day] || 0) + 1
      }
    }

    const totalResponses = (responses || []).length

    return NextResponse.json({
      surveys: list.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        createdAt: s.created_at,
        responseCount: bySurvey[s.id]?.count ?? 0,
        responsesByDate: bySurvey[s.id]?.byDay ?? {},
      })),
      summary: {
        totalSurveys: list.length,
        totalResponses,
      },
    })
  } catch (e) {
    console.error('GET /api/analytics/surveys', e)
    return NextResponse.json({ error: 'Intern server fejl' }, { status: 500 })
  }
}
