ALTER TABLE communication_logs
  ADD COLUMN IF NOT EXISTS provider_message_id text;

ALTER TABLE communication_logs
  ADD COLUMN IF NOT EXISTS provider_response jsonb;

CREATE INDEX IF NOT EXISTS idx_comm_logs_provider_message_id
  ON communication_logs(provider_message_id);
