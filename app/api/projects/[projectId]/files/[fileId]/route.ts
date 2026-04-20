import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { canEditProject } from '@/lib/project-access'

const BUCKET = 'project-files'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, fileId } = await params
    const canEdit = await canEditProject(projectId, userId)
    if (!canEdit) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Fil-sletning kræver SUPABASE_SERVICE_ROLE_KEY på serveren' },
        { status: 503 }
      )
    }

    const { data: existing, error: fetchError } = await supabase
      .from('project_files')
      .select('id, storage_path')
      .eq('id', fileId)
      .eq('project_id', projectId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Fil ikke fundet' }, { status: 404 })
    }

    const { error: storageError } = await admin.storage.from(BUCKET).remove([existing.storage_path])
    if (storageError) {
      return NextResponse.json({ error: 'Kunne ikke slette fil i storage' }, { status: 500 })
    }

    const { error: deleteError } = await supabase
      .from('project_files')
      .delete()
      .eq('id', fileId)
      .eq('project_id', projectId)

    if (deleteError) {
      return NextResponse.json({ error: 'Kunne ikke slette fil i database' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[projectId]/files/[fileId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
