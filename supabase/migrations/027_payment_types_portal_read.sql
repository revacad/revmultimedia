-- Students need payment type labels when viewing invoices in the portal
CREATE POLICY payment_types_select_authenticated ON payment_types
  FOR SELECT
  TO authenticated
  USING (is_active = true);
