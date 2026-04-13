-- Track first-time onboarding; new signups stay NULL until they finish the flow.
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Existing accounts: treat as already onboarded so they are not forced through the wizard.
UPDATE users SET onboarding_completed_at = COALESCE(onboarding_completed_at, NOW())
WHERE onboarding_completed_at IS NULL;
