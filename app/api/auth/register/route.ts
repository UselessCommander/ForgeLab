import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/users'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, email } = body

    if (!username || !password || !email) {
      return NextResponse.json(
        { error: 'Brugernavn, email og password er påkrævet' },
        { status: 400 }
      )
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Brugernavn skal vÃ¦re mindst 3 tegn' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password skal vÃ¦re mindst 6 tegn' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Indtast en gyldig email adresse' },
        { status: 400 }
      )
    }

    const user = await createUser(username, password, email)

    if (!user) {
      return NextResponse.json(
        { error: 'Brugernavn er allerede taget' },
        { status: 409 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Bruger oprettet succesfuldt'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Intern server fejl', message: error.message },
      { status: 500 }
    )
  }
}