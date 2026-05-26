ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS promo_code_id uuid REFERENCES promo_codes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS applications_promo_code_id_idx ON applications(promo_code_id);

