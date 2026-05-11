-- =============================================================
-- Hardening migration: deliverability, compliance, security
-- Run this AFTER setup.sql and migration.sql
-- =============================================================

-- ---------- Fix the corrupted dollar-quoting from prior migration ----------
-- The previous file scheduled the same job twice with broken syntax.
-- Re-register cleanly.
DO $$
BEGIN
  PERFORM cron.unschedule('reset-daily-send-count');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'reset-daily-send-count',
  '0 0 * * *',
  $$UPDATE email_accounts SET sent_today = 0$$
);

-- ---------- email_accounts: address footer + smtp encryption marker ----------
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS sender_address TEXT; -- physical mailing address for CAN-SPAM footer
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS imap_host TEXT;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS imap_port INTEGER;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS imap_user TEXT;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS imap_pass TEXT; -- encrypted (same format as smtp_pass)
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS imap_last_uid BIGINT DEFAULT 0;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS spf_status TEXT;   -- 'pass' | 'fail' | 'none' | 'error'
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS dkim_status TEXT;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS dmarc_status TEXT;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS auth_checked_at TIMESTAMP WITH TIME ZONE;

-- ---------- campaigns: tracking toggles + send window ----------
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS track_opens BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS track_clicks BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS send_window_start INTEGER DEFAULT 9;  -- hour 0-23, recipient TZ
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS send_window_end   INTEGER DEFAULT 17;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS send_window_days  INTEGER[] DEFAULT ARRAY[1,2,3,4,5]; -- Mon-Fri (1=Mon)

-- ---------- campaign_accounts: inbox rotation ----------
CREATE TABLE IF NOT EXISTS campaign_accounts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns ON DELETE CASCADE NOT NULL,
  account_id  UUID REFERENCES email_accounts ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(campaign_id, account_id)
);
ALTER TABLE campaign_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own campaign accounts." ON campaign_accounts FOR ALL
USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND user_id = auth.uid()));

-- Backfill rotation pool from existing single-account campaigns
INSERT INTO campaign_accounts (campaign_id, account_id)
SELECT id, account_id FROM campaigns
WHERE account_id IS NOT NULL
ON CONFLICT (campaign_id, account_id) DO NOTHING;

-- ---------- campaign_steps: hour/minute granularity ----------
ALTER TABLE campaign_steps ADD COLUMN IF NOT EXISTS wait_hours INTEGER DEFAULT 0;
ALTER TABLE campaign_steps ADD COLUMN IF NOT EXISTS wait_minutes INTEGER DEFAULT 0;

-- ---------- contacts: timezone ----------
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- ---------- email_queue: retries, tracking secret, reply linkage ----------
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS message_id TEXT;            -- outbound RFC822 Message-ID we set
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS email_queue_message_id_idx ON email_queue (message_id);

-- Make tracking_id unique so we can match clicks/opens deterministically
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'email_queue_tracking_id_uidx'
  ) THEN
    CREATE UNIQUE INDEX email_queue_tracking_id_uidx ON email_queue (tracking_id);
  END IF;
END $$;

-- ---------- inbox_messages: replies / bounces captured by IMAP poller ----------
CREATE TABLE IF NOT EXISTS inbox_messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  account_id      UUID REFERENCES email_accounts ON DELETE CASCADE NOT NULL,
  queue_id        UUID REFERENCES email_queue ON DELETE SET NULL,
  campaign_id     UUID REFERENCES campaigns ON DELETE SET NULL,
  contact_id      UUID REFERENCES contacts ON DELETE SET NULL,
  kind            TEXT NOT NULL,        -- 'reply' | 'bounce' | 'auto_reply'
  from_email      TEXT,
  subject         TEXT,
  snippet         TEXT,
  message_id      TEXT,
  in_reply_to     TEXT,
  received_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_read         BOOLEAN DEFAULT FALSE
);
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own inbox." ON inbox_messages FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS inbox_messages_user_idx ON inbox_messages (user_id, received_at DESC);

-- ---------- send_log: throttling / per-account rate limiting ----------
CREATE TABLE IF NOT EXISTS send_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id  UUID REFERENCES email_accounts ON DELETE CASCADE NOT NULL,
  sent_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX IF NOT EXISTS send_log_account_time_idx ON send_log (account_id, sent_at DESC);
-- prune entries older than 7 days nightly
SELECT cron.schedule(
  'prune-send-log',
  '15 0 * * *',
  $$DELETE FROM send_log WHERE sent_at < NOW() - INTERVAL '7 days'$$
);

-- ---------- contacts: bounce + reply flags ----------
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE;
