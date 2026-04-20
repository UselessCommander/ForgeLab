import { supabase } from '@/lib/supabase'

function normalizeName(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase()
}

export async function isAdminUserId(userId: string | null): Promise<boolean> {
  if (!userId) return false
  if (userId === 'admin') return true

  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .limit(1)

  if (error) {
    console.error('Error checking admin identity:', error)
    return false
  }

  const username = normalizeName(data?.[0]?.username)
  const adminUsernames = new Set([
    normalizeName(process.env.ADMIN_USERNAME || 'admin'),
    normalizeName('Useless commander'),
  ])
  return adminUsernames.has(username)
}

