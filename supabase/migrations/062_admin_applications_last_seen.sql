CREATE TABLE IF NOT EXISTS admin_applications_last_seen (
  admin_id uuid PRIMARY KEY REFERENCES admins(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_applications_last_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read and write their own last_seen"
ON admin_applications_last_seen
FOR ALL
TO authenticated
USING (admin_id = (SELECT id FROM admins WHERE auth_user_id = auth.uid()))
WITH CHECK (admin_id = (SELECT id FROM admins WHERE auth_user_id = auth.uid()));
