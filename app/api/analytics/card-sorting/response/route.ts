import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { canEditProject } from '@/lib/project-access'
import { parseCardSortingResponses, type CardSortingToolData } from '@/lib/card-sorting-analytics'

/** Fjern ét respondentsvar fra projektets kortsorterings-json (kræver editor). */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const projectId = typeof body.projectId === 'string' ? body.projectId : null
    const responseId = typeof body.responseId === 'string' ? body.responseId : null
    if (!projectId || !responseId) {
      return NextResponse.json({ error: 'projectId og responseId er påkrævet' }, { status: 400 })
    }

    const canEdit = await canEditProject(projectId, userId)
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: row, error: fetchError } = await supabase
      .from('project_tool_data')
      .select('data')
      .eq('project_id', projectId)
      .eq('tool_slug', 'card-sorting')
      .maybeSingle()

    if (fetchError) {
      console.error('card-sorting response delete fetch:', fetchError)
      return NextResponse.json({ error: 'Kunne ikke hente data' }, { status: 500 })
    }

    const raw = (row?.data ?? {}) as CardSortingToolData
    const responses = parseCardSortingResponses(raw.responses)
    const next = responses.filter((r) => r.id !== responseId)
    if (next.length === responses.length) {
      return NextResponse.json({ error: 'Respondent ikke fundet' }, { status: 404 })
    }

    const nextData = { ...raw, responses: next }

    const { error: upError } = await supabase.from('project_tool_data').upsert(
      {
        project_id: projectId,
        tool_slug: 'card-sorting',
        data: nextData,
      },
      { onConflict: 'project_id,tool_slug' }
    )

    if (upError) {
      console.error('card-sorting response delete upsert:', upError)
      return NextResponse.json({ error: 'Kunne ikke gemme' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/analytics/card-sorting/response', e)
    return NextResponse.json({ error: 'Intern server fejl' }, { status: 500 })
  }
}
