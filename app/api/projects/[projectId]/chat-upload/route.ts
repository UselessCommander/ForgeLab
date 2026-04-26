import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const BUCKET = 'chat-uploads'
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const IMAGE_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml',
])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ugyldig formular' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Ingen fil valgt' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.length === 0) return NextResponse.json({ error: 'Tom fil' }, { status: 400 })
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: 'Filen er for stor (maks 10 MB)' }, { status: 400 })
  }

  const mime = (file.type || 'application/octet-stream').toLowerCase().split(';')[0].trim()
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${projectId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const isImage = IMAGE_TYPES.has(mime)

  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Storage ikke konfigureret' }, { status: 503 })
  }

  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType: mime,
    upsert: false,
  })

  if (upErr) {
    console.error('chat-upload error:', upErr)
    return NextResponse.json({ error: 'Upload fejlede: ' + upErr.message }, { status: 500 })
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = data?.publicUrl

  return NextResponse.json({
    url: publicUrl,
    name: file.name,
    size: buf.length,
    mime,
    isImage,
  })
}
