import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { canEditProject, canViewProject } from '@/lib/project-access'

const BUCKET = 'project-files'
const MAX_BYTES = 20 * 1024 * 1024
const PDF_MIME = 'application/pdf'

type ProjectFileRow = {
  id: string
  filename: string
  mime_type: string
  size_bytes: number
  created_at: string
  uploaded_by_user_id: string
  storage_path: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const canView = await canViewProject(projectId, userId)
    if (!canView) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('project_files')
      .select('id, filename, mime_type, size_bytes, created_at, uploaded_by_user_id, storage_path')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    const admin = getSupabaseAdmin()
    const rows = (data || []) as ProjectFileRow[]
    const files = await Promise.all(
      rows.map(async (row) => {
        let downloadUrl: string | null = null
        if (admin) {
          const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(row.storage_path, 60 * 60)
          downloadUrl = signed?.signedUrl ?? null
        }
        return {
          id: row.id,
          filename: row.filename,
          mimeType: row.mime_type,
          sizeBytes: row.size_bytes,
          createdAt: row.created_at,
          uploadedByUserId: row.uploaded_by_user_id,
          downloadUrl,
        }
      })
    )

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]/files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const canEdit = await canEditProject(projectId, userId)
    if (!canEdit) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Fil-upload kræver SUPABASE_SERVICE_ROLE_KEY på serveren' },
        { status: 503 }
      )
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Ugyldig formular' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Vælg en PDF-fil' }, { status: 400 })
    }

    const mime = (file.type || '').toLowerCase().split(';')[0].trim()
    if (mime !== PDF_MIME) {
      return NextResponse.json({ error: 'Kun PDF-filer er tilladt' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!buffer.length) {
      return NextResponse.json({ error: 'Tom fil' }, { status: 400 })
    }
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: 'Filen er for stor (maks 20 MB)' }, { status: 400 })
    }

    const safeFilename = (file.name || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${projectId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeFilename}`

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: PDF_MIME,
      upsert: false,
    })
    if (uploadError) {
      return NextResponse.json({ error: 'Kunne ikke uploade fil' }, { status: 500 })
    }

    const { data: inserted, error: insertError } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        uploaded_by_user_id: userId,
        filename: file.name || safeFilename,
        storage_bucket: BUCKET,
        storage_path: storagePath,
        mime_type: PDF_MIME,
        size_bytes: buffer.length,
      })
      .select('id, filename, mime_type, size_bytes, created_at, uploaded_by_user_id')
      .single()

    if (insertError || !inserted) {
      await admin.storage.from(BUCKET).remove([storagePath])
      return NextResponse.json({ error: 'Kunne ikke gemme fil i database' }, { status: 500 })
    }

    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 60)

    return NextResponse.json({
      file: {
        id: inserted.id,
        filename: inserted.filename,
        mimeType: inserted.mime_type,
        sizeBytes: inserted.size_bytes,
        createdAt: inserted.created_at,
        uploadedByUserId: inserted.uploaded_by_user_id,
        downloadUrl: signed?.signedUrl ?? null,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/projects/[projectId]/files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
