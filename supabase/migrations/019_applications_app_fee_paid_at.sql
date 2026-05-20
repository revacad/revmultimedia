ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS app_fee_paid_at timestamptz;
