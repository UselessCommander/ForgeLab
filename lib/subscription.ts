export type BillingUserLike = {
  plan_key?: string | null
  subscription_status?: string | null
  subscription_cancel_at_period_end?: boolean | null
  subscription_current_period_end?: string | null
}

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due'])

export function hasAiAccessFromSubscription(user: BillingUserLike | null | undefined) {
  if (!user) return false
  if (user.plan_key !== 'pro') return false
  return ACTIVE_STATUSES.has((user.subscription_status || '').toLowerCase())
}

export function formatPlanLabel(planKey?: string | null) {
  return planKey === 'pro' ? 'Pro' : 'Free'
}
