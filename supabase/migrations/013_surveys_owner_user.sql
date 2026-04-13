-- Kobler undersøgelser til den bruger der oprettede dem (til analytics / mit overblik)
ALTER TABLE surveys
ADD COLUMN IF NOT EXISTS owner_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_surveys_owner_user_id ON surveys(owner_user_id);
