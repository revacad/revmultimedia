-- entity_id as text (supports UUIDs, slugs like csv-export, r2-backup)
ALTER TABLE audit_logs
  ALTER COLUMN entity_id TYPE text USING entity_id::text;

-- RLS is enabled; service role bypasses policies. Explicit policies for clarity.
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role can select audit logs" ON audit_logs;

CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select audit logs"
  ON audit_logs
  FOR SELECT
  TO service_role
  USING (true);
