import { supabase } from './supabase'

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function generateMagicSlug() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export type VariantType = 'url' | 'image'

export interface AbTestVariant {
  id: string
  test_id: string
  label: string
  type: VariantType
  value: string
  position: number
}

export interface AbTest {
  id: string
  user_id: string
  title: string
  magic_slug: string
  created_at: string
}

export async function createAbTest(
  userId: string,
  title: string,
  variants: { label: string; type: VariantType; value: string }[]
): Promise<{ test: AbTest; magicSlug: string } | null> {
  const testId = generateId()
  let magicSlug = generateMagicSlug()
  const { data: existing } = await supabase.from('ab_tests').select('id').eq('magic_slug', magicSlug).single()
  if (existing) magicSlug = generateMagicSlug()

  const { error: testError } = await supabase.from('ab_tests').insert({
    id: testId,
    user_id: userId,
    title: title || 'A/B/N Test',
    magic_slug: magicSlug,
  })

  if (testError) {
    console.error('createAbTest test error:', testError)
    return null
  }

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i]
    const variantId = generateId()
    const { error: varError } = await supabase.from('ab_test_variants').insert({
      id: variantId,
      test_id: testId,
      label: v.label,
      type: v.type,
      value: v.value,
      position: i,
    })
    if (varError) {
      console.error('createAbTest variant error:', varError)
    }
  }

  return {
    test: { id: testId, user_id: userId, title: title || 'A/B/N Test', magic_slug: magicSlug, created_at: new Date().toISOString() },
    magicSlug,
  }
}

export async function getAbTestByMagicSlug(magicSlug: string): Promise<{ test: AbTest; variants: AbTestVariant[] } | null> {
  const { data: test, error: testError } = await supabase
    .from('ab_tests')
    .select('*')
    .eq('magic_slug', magicSlug)
    .single()

  if (testError || !test) return null

  const { data: variants, error: varError } = await supabase
    .from('ab_test_variants')
    .select('*')
    .eq('test_id', test.id)
    .order('position', { ascending: true })

  if (varError) return null

  return { test, variants: variants || [] }
}

export async function submitAbTestResponse(testId: string, variantId: string): Promise<boolean> {
  const { error } = await supabase.from('ab_test_responses').insert({
    test_id: testId,
    variant_id: variantId,
  })
  return !error
}

export async function getAbTestResults(testId: string, userId: string): Promise<{ variantId: string; label: string; count: number }[] | null> {
  const { data: test } = await supabase.from('ab_tests').select('user_id').eq('id', testId).single()
  if (!test || test.user_id !== userId) return null

  const { data: variants } = await supabase.from('ab_test_variants').select('id, label').eq('test_id', testId).order('position', { ascending: true })
  if (!variants?.length) return null

  const { data: responses } = await supabase.from('ab_test_responses').select('variant_id').eq('test_id', testId)
  const counts: Record<string, number> = {}
  variants.forEach((v) => { counts[v.id] = 0 })
  ;(responses || []).forEach((r) => { counts[r.variant_id] = (counts[r.variant_id] || 0) + 1 })

  return variants.map((v) => ({ variantId: v.id, label: v.label, count: counts[v.id] || 0 }))
}

export async function listAbTestsForUser(userId: string): Promise<{ test: AbTest; responseCount: number }[]> {
  const { data: tests, error } = await supabase.from('ab_tests').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error || !tests?.length) return []

  const out: { test: AbTest; responseCount: number }[] = []
  for (const t of tests) {
    const { count } = await supabase.from('ab_test_responses').select('*', { count: 'exact', head: true }).eq('test_id', t.id)
    out.push({ test: t, responseCount: count ?? 0 })
  }
  return out
}
