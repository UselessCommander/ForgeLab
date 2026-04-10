import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const BUCKET = 'profile-avatars'
const MAX_BYTES_STORAGE = 5 * 1024 * 1024
const MAX_BYTES_DATA_URL = 512 * 1024

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
])

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userId === 'admin') {
    return NextResponse.json({ error: 'Admin profil kan ikke redigeres her' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ugyldig formular' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Vælg en fil' }, { status: 400 })
  }

  const mime = (file.type || '').toLowerCase().split(';')[0].trim()
  if (!mime || !ALLOWED_TYPES.has(mime)) {
    return NextResponse.json(
      { error: 'Tilladte formater: billeder (PNG, JPEG, GIF, WebP, SVG, ICO)' },
      { status: 400 }
    )
  }

  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.length === 0) {
    return NextResponse.json({ error: 'Tom fil' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  let publicUrl: string | null = null

  if (admin && buf.length <= MAX_BYTES_STORAGE) {
    const path = `${userId}/avatar`
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, {
      contentType: mime,
      upsert: true,
    })
    if (!upErr) {
      const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
      publicUrl = data?.publicUrl ?? null
    }
  }

  if (!publicUrl) {
    if (buf.length > MAX_BYTES_DATA_URL) {
      return NextResponse.json(
        {
          error:
            admin == null
              ? 'Filen er for stor uden Supabase (maks 512 KB). Sæt SUPABASE_SERVICE_ROLE_KEY for større filer.'
              : 'Kunne ikke uploade (maks 5 MB). Tjek at bucket profile-avatars findes.',
        },
        { status: 400 }
      )
    }
    publicUrl = `data:${mime};base64,${buf.toString('base64')}`
  }

  const { error } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', userId)

  if (error) {
    console.error('Error saving avatar_url:', error)
    return NextResponse.json({ error: 'Kunne ikke gemme profilbillede' }, { status: 500 })
  }

  return NextResponse.json({ avatarUrl: publicUrl })
}

export async function DELETE() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userId === 'admin') {
    return NextResponse.json({ error: 'Admin profil kan ikke redigeres her' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  if (admin) {
    const { data: list } = await admin.storage.from(BUCKET).list(userId)
    if (list?.length) {
      const paths = list.map((o) => `${userId}/${o.name}`)
      await admin.storage.from(BUCKET).remove(paths)
    }
  }

  const { error } = await supabase.from('users').update({ avatar_url: null }).eq('id', userId)
  if (error) {
    console.error('Error clearing avatar_url:', error)
    return NextResponse.json({ error: 'Kunne ikke fjerne profilbillede' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
