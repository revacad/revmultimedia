INSERT INTO system_settings (key, value, description)
VALUES ('paystack_enabled', 'true', 'Enable Paystack for application fee payments')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE manual_payment_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  student_auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_ref text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX manual_payment_claims_invoice_id_idx ON manual_payment_claims (invoice_id);
CREATE INDEX manual_payment_claims_status_created_at_idx ON manual_payment_claims (status, created_at DESC);

ALTER TABLE manual_payment_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY manual_payment_claims_student_insert ON manual_payment_claims
  FOR INSERT TO authenticated
  WITH CHECK (student_auth_user_id = auth.uid());

CREATE POLICY manual_payment_claims_admin_all ON manual_payment_claims
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_finance_access());

  GRANT ALL ON public.manual_payment_claims TO service_role;
GRANT SELECT, INSERT ON public.manual_payment_claims TO authenticated;
