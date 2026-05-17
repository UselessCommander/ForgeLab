/**
 * Canonical username for login/uniqueness: trimmed, lowercased.
 * DB column `users.username_normalized` is kept in sync via migration 023 trigger.
 * Deploy: run 021_username_normalized.sql then 023_username_normalized_sync.sql.
 */
export function normalizeUsername(username: string): string | null {
  const trimmed = username.trim()
  if (trimmed.length < 3) return null
  return trimmed.toLowerCase()
}
