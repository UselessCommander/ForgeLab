import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { canViewProject } from '@/lib/project-access'
import {
  aggregateLocations,
  parseCardSortingResponses,
  quartiles,
  type CardSortResponseRecord,
  type CardSortingToolData,
} from '@/lib/card-sorting-analytics'

function categoryBreakdownFromData(data: unknown): { name: string; count: number }[] {
  const d = data as CardSortingToolData
  const categories = Array.isArray(d?.categories) ? d.categories : []
  return categories.map((c) => ({
    name: String(c?.name ?? '').trim() || 'Uden navn',
    count: Array.isArray(c?.cards) ? c.cards.length : 0,
  }))
}

function boardCardsFromData(data: unknown): { id: string; text: string }[] {
  const d = data as CardSortingToolData
  const cards = Array.isArray(d?.cards) ? d.cards : []
  const out: { id: string; text: string }[] = []
  let anon = 0
  for (const c of cards) {
    const text = String(c?.text ?? '').trim()
    if (!text) continue
    const id =
      typeof c?.id === 'string' && c.id.trim()
        ? c.id.trim()
        : `__anon_${anon++}`
    out.push({ id, text })
  }
  return out
}

function summarizeBoard(data: unknown) {
  const d = data as CardSortingToolData
  const cards = Array.isArray(d?.cards) ? d.cards : []
  const categories = Array.isArray(d?.categories) ? d.categories : []
  const cardsWithText = cards.filter((c) => String(c?.text ?? '').trim().length > 0)
  const namedCategories = categories.filter((c) => String(c?.name ?? '').trim().length > 0)
  const placedIds = new Set<string>()
  for (const cat of categories) {
    for (const id of cat.cards || []) {
      if (id) placedIds.add(String(id))
    }
  }
  const placedCount = cardsWithText.filter((c) => placedIds.has(String(c.id))).length
  return {
    mode: d?.mode && ['open', 'closed', 'hybrid'].includes(d.mode) ? d.mode : 'open',
    cardCount: cardsWithText.length,
    categoryCount: namedCategories.length,
    boardUniqueCategories: namedCategories.length,
    cardsPlacedInCategories: placedCount,
    unassignedCards: Math.max(0, cardsWithText.length - placedCount),
  }
}

function buildResponseSummary(
  responses: CardSortResponseRecord[],
  boardUniqueCategories: number
) {
  const completed = responses.filter((r) => !r.abandoned && r.completedAt)
  const abandoned = responses.filter((r) => r.abandoned)
  const durations = completed
    .map((r) => (typeof r.durationSec === 'number' ? r.durationSec : 0))
    .filter((n) => n >= 0)
    .sort((a, b) => a - b)
  const catCounts = completed
    .map((r) => (typeof r.categoryCount === 'number' ? r.categoryCount : 0))
    .filter((n) => n > 0)

  const avgCategories =
    catCounts.length > 0 ? Math.round((catCounts.reduce((a, b) => a + b, 0) / catCounts.length) * 10) / 10 : null
  const maxCategories = catCounts.length > 0 ? Math.max(...catCounts) : null

  const lastAt = completed
    .map((r) => r.completedAt!)
    .sort()
    .pop() ?? null

  return {
    totalResponses: responses.length,
    completed: completed.length,
    abandoned: abandoned.length,
    lastRespondentAt: lastAt,
    boardUniqueCategories,
    avgCategoriesPerResponse: avgCategories,
    maxCategoriesPerResponse: maxCategories,
    durationStats: quartiles(durations),
    locations: aggregateLocations(responses),
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filterProjectId = request.nextUrl.searchParams.get('projectId')

    const { data: memberships, error: memError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId)

    if (memError) {
      console.error('analytics card-sorting memberships:', memError)
      return NextResponse.json({ error: 'Kunne ikke hente projekter' }, { status: 500 })
    }

    let projectIds = Array.from(new Set((memberships || []).map((m) => m.project_id)))

    if (filterProjectId) {
      const allowed = await canViewProject(filterProjectId, userId)
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      projectIds = [filterProjectId]
    }

    if (projectIds.length === 0) {
      return NextResponse.json({
        projects: [],
        summary: { projectCount: 0, totalCards: 0, totalCategories: 0 },
      })
    }

    const { data: toolRows, error: toolError } = await supabase
      .from('project_tool_data')
      .select('project_id, data, updated_at, created_at')
      .eq('tool_slug', 'card-sorting')
      .in('project_id', projectIds)

    if (toolError) {
      console.error('analytics card-sorting tool data:', toolError)
      return NextResponse.json({ error: 'Kunne ikke hente kortsortering' }, { status: 500 })
    }

    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds)

    if (projError) {
      console.error('analytics card-sorting projects:', projError)
      return NextResponse.json({ error: 'Kunne ikke hente projektnavne' }, { status: 500 })
    }

    const nameById = new Map((projects || []).map((p) => [p.id, p.name]))

    const projectsOut = (toolRows || []).map((row) => {
      const d = row.data as CardSortingToolData
      const stats = summarizeBoard(row.data)
      const responses = parseCardSortingResponses(d?.responses)
      const meta = d?.meta && typeof d.meta === 'object' ? d.meta : {}
      const createdAt = (meta.createdAt as string | undefined) || row.created_at || null
      const launchedAt = (meta.launchedAt as string | undefined) || null
      const responseSummary = buildResponseSummary(responses, stats.boardUniqueCategories)

      return {
        projectId: row.project_id,
        projectName: nameById.get(row.project_id) || 'Projekt',
        updatedAt: row.updated_at,
        createdAt,
        launchedAt,
        responses,
        responseSummary,
        categoryBreakdown: categoryBreakdownFromData(row.data),
        boardCards: boardCardsFromData(row.data),
        ...stats,
      }
    })

    const summary = {
      projectCount: projectsOut.length,
      totalCards: projectsOut.reduce((s, p) => s + p.cardCount, 0),
      totalCategories: projectsOut.reduce((s, p) => s + p.categoryCount, 0),
    }

    return NextResponse.json({ projects: projectsOut, summary })
  } catch (e) {
    console.error('GET /api/analytics/card-sorting', e)
    return NextResponse.json({ error: 'Intern server fejl' }, { status: 500 })
  }
}
