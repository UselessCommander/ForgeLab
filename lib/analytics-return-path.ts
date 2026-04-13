/**
 * Same-origin path allowed as analytics "return" target (project workspace).
 * Rejects protocol-relative URLs and paths outside /dashboard/projects/:id.
 */
export function sanitizeAnalyticsReturnPath(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  let t = raw.trim()
  try {
    t = decodeURIComponent(t)
  } catch {
    return null
  }
  if (!t.startsWith('/') || t.startsWith('//')) return null
  if (t.includes('://') || t.includes('\\')) return null
  const pathOnly = t.split('?')[0].split('#')[0]
  if (!/^\/dashboard\/projects\/[^/?#]+\/?$/.test(pathOnly)) return null
  return pathOnly.replace(/\/$/, '') || null
}
