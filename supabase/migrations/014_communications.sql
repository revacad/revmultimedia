CREATE TABLE communication_campaigns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel          text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  subject          text,
  message          text NOT NULL,
  filters          jsonb NOT NULL DEFAULT '{}',
  recipient_count  int NOT NULL DEFAULT 0,
  sent_count       int NOT NULL DEFAULT 0,
  failed_count     int NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'queued', 'processing', 'completed', 'failed')),
  created_by       uuid NOT NULL REFERENCES admins(id),
  queued_at        timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE communication_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES communication_campaigns(id) ON DELETE CASCADE,
  student_id    uuid REFERENCES students(id) ON DELETE SET NULL,
  recipient     text NOT NULL,
  channel       text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  sent_at       timestamptz DEFAULT now()
);

CREATE INDEX communication_campaigns_created_at_idx
  ON communication_campaigns(created_at DESC);

CREATE INDEX communication_logs_campaign_id_idx
  ON communication_logs(campaign_id);

CREATE INDEX communication_logs_student_sent_idx
  ON communication_logs(student_id, sent_at DESC);

ALTER TABLE communication_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY communication_campaigns_admin_select ON communication_campaigns
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY communication_logs_admin_select ON communication_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

INSERT INTO system_settings (key, value, description) VALUES
  ('sms_provider', 'sentdm', 'Active SMS provider: sentdm or fishafrica'),
  ('sentdm_api_key', '', 'Sent.dm API key (overrides SENTDM_API_KEY env when set)'),
  ('sentdm_sender_id', '', 'Sent.dm sender ID'),
  ('fishafrica_api_key', '', 'Fish Africa API key'),
  ('fishafrica_sender_id', '', 'Fish Africa sender ID')
ON CONFLICT (key) DO NOTHING;
