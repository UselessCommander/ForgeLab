import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { getUserById } from '@/lib/users'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const userId = await getCurrentUserId()

  if (userId) {
    if (userId === 'admin') {
      return NextResponse.json({
        authenticated: true,
        userId,
        username: 'admin',
        firstName: null,
        lastName: null,
        profileRole: null,
        avatarUrl: null,
        planKey: 'pro',
        subscriptionStatus: 'active',
        subscriptionCurrentPeriodEnd: null,
        subscriptionCancelAtPeriodEnd: false,
      })
    }

    const user = await getUserById(userId)
    return NextResponse.json({
      authenticated: true,
      userId,
      username: user?.username || null,
      firstName: (user as any)?.first_name || null,
      lastName: (user as any)?.last_name || null,
      profileRole: (user as any)?.profile_role || null,
      avatarUrl: (user as any)?.avatar_url || null,
      planKey: (user as any)?.plan_key || 'free',
      subscriptionStatus: (user as any)?.subscription_status || null,
      subscriptionCurrentPeriodEnd: (user as any)?.subscription_current_period_end || null,
      subscriptionCancelAtPeriodEnd: Boolean((user as any)?.subscription_cancel_at_period_end),
    })
  }

  return NextResponse.json({ authenticated: false })
}

export async function PATCH(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userId === 'admin') {
    return NextResponse.json({ error: 'Admin profil kan ikke redigeres her' }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : ''
    const lastName = typeof body?.lastName === 'string' ? body.lastName.trim() : ''
    const profileRole = typeof body?.profileRole === 'string' ? body.profileRole.trim() : ''

    const allowedRoles = new Set([
      '',
      'Founder',
      'CEO',
      'COO',
      'CTO',
      'CPO',
      'Product Manager',
      'Designer',
      'Developer',
      'Marketing',
      'Sales',
      'Operations',
      'Student',
      'Other',
    ])
    if (!allowedRoles.has(profileRole)) {
      return NextResponse.json({ error: 'Ugyldig rolle' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        profile_role: profileRole || null,
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Kunne ikke opdatere profil' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/auth/me:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

