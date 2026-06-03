-- Allow applicants to read their application (and related rows) via portal login email
-- when auth_user_id was not yet backfilled.

DROP POLICY IF EXISTS applications_select_own ON applications;
CREATE POLICY applications_select_own ON applications
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = auth_user_id
    OR internal_email = (auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS invoices_select_own ON invoices;
CREATE POLICY invoices_select_own ON invoices
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = invoices.application_id
        AND (
          a.auth_user_id = auth.uid()
          OR a.internal_email = (auth.jwt() ->> 'email')
        )
    )
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = invoices.student_id AND s.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS documents_select_own ON documents;
CREATE POLICY documents_select_own ON documents
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = documents.application_id
        AND (
          a.auth_user_id = auth.uid()
          OR a.internal_email = (auth.jwt() ->> 'email')
        )
    )
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = documents.student_id AND s.auth_user_id = auth.uid()
    )
  );
