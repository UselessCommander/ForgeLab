import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe'

function toIsoFromUnix(seconds?: number | null) {
  if (!seconds || Number.isNaN(seconds)) return null
  return new Date(seconds * 1000).toISOString()
}

/** Stripe API still returns this; v22 typings omit it on `Subscription` in some builds. */
function subscriptionCurrentPeriodEndUnix(subscription: Stripe.Subscription): number | undefined {
  const end = (subscription as unknown as { current_period_end?: number }).current_period_end
  return typeof end === 'number' && !Number.isNaN(end) ? end : undefined
}

async function applySubscriptionUpdate(subscription: Stripe.Subscription) {
  const userIdFromMetadata = subscription.metadata?.userId
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id || null

  const updates = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscription_current_period_end: toIsoFromUnix(subscriptionCurrentPeriodEndUnix(subscription)),
    subscription_cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    plan_key: subscription.status === 'active' || subscription.status === 'trialing' ? 'pro' : 'free',
  }

  if (userIdFromMetadata) {
    await supabase.from('users').update(updates).eq('id', userIdFromMetadata)
    return
  }

  if (customerId) {
    await supabase.from('users').update(updates).eq('stripe_customer_id', customerId)
  }
}

async function markSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userIdFromMetadata = subscription.metadata?.userId
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id || null

  const updates = {
    stripe_subscription_id: null,
    subscription_status: 'canceled',
    subscription_current_period_end: toIsoFromUnix(subscriptionCurrentPeriodEndUnix(subscription)),
    subscription_cancel_at_period_end: false,
    plan_key: 'free',
  }

  if (userIdFromMetadata) {
    await supabase.from('users').update(updates).eq('id', userIdFromMetadata)
    return
  }

  if (customerId) {
    await supabase.from('users').update(updates).eq('stripe_customer_id', customerId)
  }
}

export async function POST(request: Request) {
  try {
    const stripe = getStripeClient()
    const webhookSecret = getStripeWebhookSecret()
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 })
    }

    const signature = request.headers.get('stripe-signature')
    if (!signature) return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })

    const body = await request.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null
        const userId = session.metadata?.userId

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await applySubscriptionUpdate(subscription)
        } else if (userId && customerId) {
          await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId)
        }
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await applySubscriptionUpdate(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await markSubscriptionDeleted(subscription)
        break
      }
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 400 })
  }
}
