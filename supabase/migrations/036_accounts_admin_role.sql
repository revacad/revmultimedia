-- Add accounts role; finance-scoped RLS for payments/reports/comm logs.

ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_check;
ALTER TABLE admins
  ADD CONSTRAINT admins_role_check
  CHECK (role IN ('admin', 'superadmin', 'accounts'));

ALTER TABLE admin_invites DROP CONSTRAINT IF EXISTS admin_invites_role_check;
ALTER TABLE admin_invites
  ADD CONSTRAINT admin_invites_role_check
  CHECK (role IN ('admin', 'superadmin', 'accounts'));

CREATE OR REPLACE FUNCTION public.has_finance_access()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() IN ('admin', 'superadmin', 'accounts');
$$;

CREATE OR REPLACE FUNCTION public.can_view_communication_logs()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() IN ('admin', 'superadmin', 'accounts');
$$;

-- Invoices & installments: accounts may view and record payments.
DROP POLICY IF EXISTS invoices_select_own ON invoices;
CREATE POLICY invoices_select_own ON invoices
  FOR SELECT TO authenticated
  USING (
    public.has_finance_access()
    OR EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = invoices.application_id AND a.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = invoices.student_id AND s.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS invoices_admin_write ON invoices;
CREATE POLICY invoices_admin_write ON invoices
  FOR ALL TO authenticated
  USING (public.has_finance_access())
  WITH CHECK (public.has_finance_access());

DROP POLICY IF EXISTS installments_select_own ON installments;
CREATE POLICY installments_select_own ON installments
  FOR SELECT TO authenticated
  USING (
    public.has_finance_access()
    OR EXISTS (
      SELECT 1
      FROM invoices i
      JOIN applications a ON a.id = i.application_id
      WHERE i.id = installments.invoice_id AND a.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM invoices i
      JOIN students s ON s.id = i.student_id
      WHERE i.id = installments.invoice_id AND s.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS installments_admin_write ON installments;
CREATE POLICY installments_admin_write ON installments
  FOR ALL TO authenticated
  USING (public.has_finance_access())
  WITH CHECK (public.has_finance_access());

-- Communication logs: read-only for accounts (no campaign write).
DROP POLICY IF EXISTS communication_logs_admin_select ON communication_logs;
CREATE POLICY communication_logs_admin_select ON communication_logs
  FOR SELECT TO authenticated
  USING (public.can_view_communication_logs());
