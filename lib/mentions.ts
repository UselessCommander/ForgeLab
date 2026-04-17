type MentionMember = {
  user_id: string
  username?: string
}

const MENTION_RE = /(^|[^a-zA-Z0-9._-])@([a-zA-Z0-9._-]{2,32})/g

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

export function htmlToPlainText(input: string): string {
  if (!input) return ''
  const withBreaks = input
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6)>/gi, '\n')
  const stripped = withBreaks.replace(/<[^>]+>/g, ' ')
  return decodeHtmlEntities(stripped).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function extractMentionUserIdsFromText(
  rawText: string,
  members: MentionMember[],
  currentUserId?: string | null
): string[] {
  const text = rawText || ''
  if (!text.trim() || members.length === 0) return []

  const userIdByUsername = new Map<string, string>()
  for (const member of members) {
    const username = typeof member.username === 'string' ? member.username.trim().toLowerCase() : ''
    if (!username) continue
    userIdByUsername.set(username, member.user_id)
  }

  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = MENTION_RE.exec(text)) !== null) {
    const mentionedUsername = (m[2] || '').toLowerCase()
    const userId = userIdByUsername.get(mentionedUsername)
    if (!userId) continue
    if (currentUserId && userId === currentUserId) continue
    if (!out.includes(userId)) out.push(userId)
  }
  return out
}
