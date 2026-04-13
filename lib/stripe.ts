import Stripe from 'stripe'
import { serverEnv } from '@/lib/server-env'

let stripeClient: Stripe | null = null

export function getStripeSecretKey() {
  return serverEnv('STRIPE_SECRET_KEY')
}

export function getStripeWebhookSecret() {
  return serverEnv('STRIPE_WEBHOOK_SECRET')
}

export function getStripePriceId() {
  return serverEnv('STRIPE_PRO_PRICE_ID', 'STRIPE_PRICE_ID', 'NEXT_PUBLIC_STRIPE_PRICE_ID')
}

export function getStripeClient() {
  if (stripeClient) return stripeClient
  const secretKey = getStripeSecretKey()
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable.')
  }
  stripeClient = new Stripe(secretKey)
  return stripeClient
}
