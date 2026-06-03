-- GDPR / Data Protection Act: student account deletion requests (processed by superadmin).

CREATE TABLE deletion_requests (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_auth_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name           text NOT NULL,
  student_email          text NOT NULL,
  requested_at           timestamptz NOT NULL DEFAULT now(),
  status                 text NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'completed', 'rejected')),
  completed_at           timestamptz,
  rejected_reason        text
);

CREATE INDEX deletion_requests_status_requested_idx
  ON deletion_requests (status, requested_at DESC);

CREATE INDEX deletion_requests_auth_user_idx
  ON deletion_requests (student_auth_user_id);

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY deletion_requests_admin_select ON deletion_requests
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY deletion_requests_student_select_own ON deletion_requests
  FOR SELECT TO authenticated
  USING (student_auth_user_id = auth.uid());
