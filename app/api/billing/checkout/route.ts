import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { getUserById } from '@/lib/users'
import { getStripeClient, getStripePriceId } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userId === 'admin') return NextResponse.json({ error: 'Admin kan ikke opgradere her' }, { status: 400 })

    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: 'Bruger ikke fundet' }, { status: 404 })

    const stripe = getStripeClient()
    const priceId = getStripePriceId()
    if (!priceId) return NextResponse.json({ error: 'Stripe price mangler i miljøvariabler' }, { status: 500 })

    const origin = request.headers.get('origin') || process.env.BASE_URL || 'http://localhost:3000'
    let stripeCustomerId = (user as any)?.stripe_customer_id as string | null | undefined

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.username,
        metadata: { userId: user.id },
      })
      stripeCustomerId = customer.id
      await supabase.from('users').update({ stripe_customer_id: stripeCustomerId }).eq('id', userId)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/profile?billing=success`,
      cancel_url: `${origin}/profile?billing=cancelled`,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe checkout URL mangler' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error in POST /api/billing/checkout:', error)
    return NextResponse.json({ error: 'Kunne ikke starte checkout' }, { status: 500 })
  }
}
