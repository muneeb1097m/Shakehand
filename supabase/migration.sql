-- Add daily_limit column to email_accounts
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 50;

-- Add tracking for sent emails today if not exists
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS sent_today INTEGER DEFAULT 0;

-- Add reputation score if not exists
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL;
