import { cookies } from 'next/headers'
import { getUserByUsername, verifyPassword, type User } from './users'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function login(username: string, password: string): Promise<{ success: boolean; userId?: string }> {
  // Check admin account first
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return { success: true, userId: 'admin' }
  }
  
  // Check user accounts
  const user = getUserByUsername(username)
  if (user && verifyPassword(user, password)) {
    return { success: true, userId: user.id }
  }
  
  return { success: false }
}

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('forgelab_session')
  if (!session?.value) return null
  
  try {
    const sessionData = JSON.parse(session.value)
    return sessionData.userId || null
  } catch {
    // Legacy session format
    return session.value === 'authenticated' ? 'admin' : null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId()
  return userId !== null
}

export async function setSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set('forgelab_session', JSON.stringify({ userId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('forgelab_session')
}
