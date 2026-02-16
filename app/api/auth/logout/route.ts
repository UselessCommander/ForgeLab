import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('forgelab_session')

    // Redirect til landing page efter logout
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error: any) {
    // Hvis redirect fejler, redirect alligevel
    return NextResponse.redirect(new URL('/', request.url))
  }
}
