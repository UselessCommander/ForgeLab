import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/users'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Brugernavn og password er påkrævet' },
        { status: 400 }
      )
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Brugernavn skal være mindst 3 tegn' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password skal være mindst 6 tegn' },
        { status: 400 }
      )
    }

    const user = createUser(username, password)

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
