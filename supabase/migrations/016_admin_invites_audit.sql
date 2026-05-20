CREATE TABLE admin_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  full_name   text NOT NULL,
  role        text NOT NULL CHECK (role IN ('admin', 'superadmin')),
  token       text NOT NULL UNIQUE,
  invited_by  uuid NOT NULL REFERENCES admins(id),
  expires_at  timestamptz NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX admin_invites_token_idx ON admin_invites (token) WHERE used = false;
CREATE INDEX admin_invites_pending_idx ON admin_invites (expires_at) WHERE used = false;

CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid REFERENCES admins(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  old_value   jsonb,
  new_value   jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX audit_logs_action_idx ON audit_logs (action);

ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
