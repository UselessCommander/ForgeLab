import { NextRequest, NextResponse } from 'next/server'
import { login, setSession } from '@/lib/auth'
import { getUserById, userNeedsOnboarding } from '@/lib/users'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, rememberMe } = body

    const result = await login(username, password)

    if (result.success && result.userId) {
      await setSession(result.userId, rememberMe === true)
      const user = await getUserById(result.userId)
      const needsOnboarding = userNeedsOnboarding(result.userId, user)
      return NextResponse.json({ success: true, needsOnboarding })
    } else {
      return NextResponse.json(
        { error: 'Forkert brugernavn eller password' },
        { status: 401 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Intern server fejl', message: error.message },
      { status: 500 }
    )
  }
}
