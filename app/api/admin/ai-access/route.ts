import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

function normalizeName(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase()
}

async function isAdminUser(userId: string | null) {
  if (!userId) return false
  if (userId === 'admin') return true

  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .limit(1)

  if (error) {
    console.error('Error checking admin identity:', error)
    return false
  }

  const username = normalizeName(data?.[0]?.username)
  const adminUsernames = new Set([
    normalizeName(process.env.ADMIN_USERNAME || 'admin'),
    normalizeName('Useless commander'),
  ])
  return adminUsernames.has(username)
}

// GET /api/admin/ai-access?q=...
// Returnerer brugere med ai_enabled status (kun admin).
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!(await isAdminUser(userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() || ''
    const limitRaw = Number(request.nextUrl.searchParams.get('limit') || '50')
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 50

    const { data, error } = await supabase
      .from('users')
      .select(
        'id, username, email, ai_enabled, plan_key, subscription_status, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching AI access list:', error)
      return NextResponse.json({ error: 'Kunne ikke hente AI adgangsliste' }, { status: 500 })
    }

    const filtered = q
      ? (data || []).filter((row: any) => {
          const username = String(row?.username || '').toLowerCase()
          const email = String(row?.email || '').toLowerCase()
          const id = String(row?.id || '').toLowerCase()
          return username.includes(q) || email.includes(q) || id.includes(q)
        })
      : data || []

    return NextResponse.json({ users: filtered })
  } catch (error) {
    console.error('Error in GET /api/admin/ai-access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/ai-access
// Body: { userId?: string, email?: string, aiEnabled: boolean }
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!(await isAdminUser(userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const targetUserId = typeof body?.userId === 'string' ? body.userId.trim() : ''
    const targetEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const aiEnabled = body?.aiEnabled

    if (typeof aiEnabled !== 'boolean') {
      return NextResponse.json({ error: 'aiEnabled skal være true/false' }, { status: 400 })
    }
    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ error: 'Angiv userId eller email' }, { status: 400 })
    }

    let resolvedUserId = targetUserId
    if (!resolvedUserId && targetEmail) {
      const lookup = await supabase
        .from('users')
        .select('id')
        .eq('email', targetEmail)
        .limit(1)

      const match = lookup.data?.[0]
      if (!match?.id) {
        return NextResponse.json({ error: 'Bruger ikke fundet' }, { status: 404 })
      }
      resolvedUserId = match.id
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update({ ai_enabled: aiEnabled })
      .eq('id', resolvedUserId)
      .select('id, username, email, ai_enabled, plan_key, subscription_status')
      .single()

    if (error) {
      console.error('Error updating AI access:', error)
      return NextResponse.json({ error: 'Kunne ikke opdatere AI adgang' }, { status: 500 })
    }

    console.info('AI access updated by admin', {
      actorUserId: userId,
      targetUserId: updated.id,
      targetEmail: updated.email || null,
      aiEnabled: updated.ai_enabled,
      at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('Error in PATCH /api/admin/ai-access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

