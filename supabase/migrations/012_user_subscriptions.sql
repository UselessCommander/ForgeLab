ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS plan_key TEXT NOT NULL DEFAULT 'free';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id
ON users (stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_subscription_id
ON users (stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;
