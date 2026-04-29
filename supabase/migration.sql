-- Add daily_limit column to email_accounts
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 50;

-- Add tracking for sent emails today if not exists
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS sent_today INTEGER DEFAULT 0;

-- Add reputation score if not exists
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS templates (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT DEFAULT 'Outreach',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own templates." ON templates FOR ALL USING (auth.uid() = user_id);

-- Email queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  campaign_id   UUID REFERENCES campaigns ON DELETE CASCADE NOT NULL,
  contact_id    UUID REFERENCES contacts ON DELETE CASCADE NOT NULL,
  account_id    UUID REFERENCES email_accounts ON DELETE CASCADE NOT NULL,
  step_position INTEGER NOT NULL DEFAULT 0,
  subject       TEXT NOT NULL,
  body          TEXT NOT NULL,
  status        TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
  scheduled_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at       TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own queue." ON email_queue FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS email_queue_status_idx ON email_queue (status, scheduled_at);

-- campaign_contacts: tracks which contacts are in which campaign
CREATE TABLE IF NOT EXISTS campaign_contacts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns ON DELETE CASCADE NOT NULL,
  contact_id  UUID REFERENCES contacts ON DELETE CASCADE NOT NULL,
  status      TEXT DEFAULT 'active', -- 'active' | 'completed' | 'unsubscribed' | 'bounced'
  added_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(campaign_id, contact_id)
);

ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage campaign contacts." ON campaign_contacts FOR ALL
USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND user_id = auth.uid()));

-- Enable pg_cron extension (only needed once)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add tracking_id to email_queue
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS tracking_id UUID DEFAULT gen_random_uuid();
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE;

-- suppression_list already created in Day 1 migration, skip if exists
CREATE TABLE IF NOT EXISTS suppression_list (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  email      TEXT NOT NULL,
  reason     TEXT DEFAULT 'unsubscribed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
CREATE UNIQUE INDEX IF NOT EXISTS suppression_user_email_idx ON suppression_list (user_id, email);
ALTER TABLE suppression_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own suppression list." ON suppression_list FOR ALL USING (auth.uid() = user_id);

-- Reset daily send count every midnight
SELECT cron.schedule(
  'reset-daily-send-count',
  '0 0 * * *',
  66625 UPDATE email_accounts SET sent_today = 0 66625
);

-- Reset daily send count every midnight (Finalized)
SELECT cron.schedule(
  'reset-daily-send-count',
  '0 0 * * *',
  69233 UPDATE email_accounts SET sent_today = 0 69233
);
