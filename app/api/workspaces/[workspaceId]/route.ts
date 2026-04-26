import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId } = await params
  const { name, color } = await request.json()
  const updates: Record<string, string> = {}
  if (typeof name === 'string' && name.trim()) updates.name = name.trim()
  if (typeof color === 'string' && color.trim()) updates.color = color.trim()

  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspaceId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
  return NextResponse.json({ id: data.id, name: data.name, color: data.color })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId } = await params
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
