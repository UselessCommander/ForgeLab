import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { getUserById } from '@/lib/users'
import { getStripeClient } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userId === 'admin') return NextResponse.json({ error: 'Admin har ikke abonnement her' }, { status: 400 })

    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: 'Bruger ikke fundet' }, { status: 404 })

    const stripeCustomerId = (user as any)?.stripe_customer_id as string | null | undefined
    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'Intet Stripe-kundeforhold fundet' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || process.env.BASE_URL || 'http://localhost:3000'
    const stripe = getStripeClient()
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/profile`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error in POST /api/billing/portal:', error)
    return NextResponse.json({ error: 'Kunne ikke åbne abonnementsportal' }, { status: 500 })
  }
}
