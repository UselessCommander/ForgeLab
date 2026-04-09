import { createHash } from 'crypto'
import { supabase } from '@/lib/supabase'

type RagChunk = {
  sourceSlug: string
  chunkText: string
  similarity?: number
}

const EMBEDDING_MODEL = process.env.RAG_EMBEDDING_MODEL || 'text-embedding-3-small'
const MAX_CHUNK_CHARS = 900
const MAX_CHUNKS_PER_SOURCE = 20

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function chunkText(text: string, maxChars = MAX_CHUNK_CHARS): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []
  if (normalized.length <= maxChars) return [normalized]

  const chunks: string[] = []
  let cursor = 0
  const overlap = Math.floor(maxChars * 0.15)

  while (cursor < normalized.length && chunks.length < MAX_CHUNKS_PER_SOURCE) {
    const end = Math.min(cursor + maxChars, normalized.length)
    chunks.push(normalized.slice(cursor, end))
    if (end >= normalized.length) break
    cursor = Math.max(end - overlap, cursor + 1)
  }

  return chunks
}

function toCompactSourceText(sourceSlug: string, data: unknown): string {
  let text = ''
  try {
    text = JSON.stringify(data)
  } catch {
    text = String(data || '')
  }
  return `${sourceSlug}\n${text}`
}

async function createEmbeddings(texts: string[]): Promise<number[][] | null> {
  if (!process.env.OPENAI_API_KEY || texts.length === 0) return null

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
      }),
    })
    if (!res.ok) return null
    const payload = await res.json()
    const rows = Array.isArray(payload?.data) ? payload.data : []
    const vectors = rows.map((row: any) => row?.embedding).filter((v: any) => Array.isArray(v))
    return vectors.length === texts.length ? vectors : null
  } catch {
    return null
  }
}

export async function refreshProjectKnowledgeIndex(projectId: string, sourceSlugs: string[]) {
  const dedupedSlugs = Array.from(new Set(sourceSlugs.filter(Boolean)))
  if (!projectId || dedupedSlugs.length === 0) return

  const { data: toolRows, error: toolError } = await supabase
    .from('project_tool_data')
    .select('tool_slug, data')
    .eq('project_id', projectId)
    .in('tool_slug', dedupedSlugs)

  if (toolError) {
    console.warn('RAG: could not load tool data for indexing', toolError)
    return
  }

  const rows = Array.isArray(toolRows) ? toolRows : []

  for (const row of rows as Array<{ tool_slug: string; data: unknown }>) {
    const sourceSlug = row.tool_slug
    const sourceText = toCompactSourceText(sourceSlug, row.data)
    const sourceHash = sha256(sourceText)
    const chunks = chunkText(sourceText)
    if (chunks.length === 0) continue

    const { data: existing } = await supabase
      .from('project_knowledge_chunks')
      .select('id, source_hash')
      .eq('project_id', projectId)
      .eq('source_slug', sourceSlug)
      .limit(1)

    const existingHash = existing?.[0]?.source_hash
    if (existingHash === sourceHash) continue

    await supabase
      .from('project_knowledge_chunks')
      .delete()
      .eq('project_id', projectId)
      .eq('source_slug', sourceSlug)

    const embeddings = await createEmbeddings(chunks)
    const insertRows = chunks.map((chunk, idx) => ({
      project_id: projectId,
      source_slug: sourceSlug,
      source_hash: sourceHash,
      chunk_index: idx,
      chunk_text: chunk,
      embedding: embeddings?.[idx] || null,
    }))

    const { error: insertError } = await supabase.from('project_knowledge_chunks').insert(insertRows)
    if (insertError) {
      console.warn('RAG: could not insert chunks', sourceSlug, insertError)
    }
  }
}

function scoreByTokenOverlap(query: string, text: string): number {
  const qTokens = query
    .toLowerCase()
    .split(/[^a-z0-9æøå]+/i)
    .filter(Boolean)
  if (qTokens.length === 0) return 0
  const lower = text.toLowerCase()
  let hits = 0
  for (const t of qTokens) {
    if (lower.includes(t)) hits += 1
  }
  return hits / qTokens.length
}

export async function retrieveProjectKnowledge(args: {
  projectId: string
  query: string
  sourceSlugs?: string[]
  maxChunks?: number
}): Promise<RagChunk[]> {
  const projectId = args.projectId
  const maxChunks = Math.max(1, args.maxChunks || 8)
  const sourceSlugs = (args.sourceSlugs || []).filter(Boolean)
  if (!projectId) return []

  const queryEmbedding = await createEmbeddings([args.query])

  if (queryEmbedding?.[0]) {
    const { data, error } = await supabase.rpc('match_project_knowledge', {
      query_embedding: queryEmbedding[0],
      match_project_id: projectId,
      match_count: maxChunks,
      match_source_slugs: sourceSlugs.length > 0 ? sourceSlugs : null,
    })

    if (!error && Array.isArray(data)) {
      return data.map((row: any) => ({
        sourceSlug: String(row?.source_slug || 'ukendt'),
        chunkText: String(row?.chunk_text || ''),
        similarity: typeof row?.similarity === 'number' ? row.similarity : undefined,
      }))
    }
  }

  // Fallback retrieval when embeddings are unavailable
  let query = supabase
    .from('project_knowledge_chunks')
    .select('source_slug, chunk_text')
    .eq('project_id', projectId)
    .limit(Math.max(maxChunks * 4, 20))

  if (sourceSlugs.length > 0) {
    query = query.in('source_slug', sourceSlugs)
  }

  const { data } = await query
  const rows = Array.isArray(data) ? data : []
  return rows
    .map((row: any) => ({
      sourceSlug: String(row?.source_slug || 'ukendt'),
      chunkText: String(row?.chunk_text || ''),
      similarity: scoreByTokenOverlap(args.query, String(row?.chunk_text || '')),
    }))
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, maxChunks)
}
