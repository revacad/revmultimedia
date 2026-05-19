CREATE TABLE promo_codes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text NOT NULL UNIQUE,
  discount_type       text NOT NULL CHECK (discount_type IN ('percentage', 'flat_ghs')),
  discount_value      numeric(10,2) NOT NULL,
  max_uses            int,
  uses_count          int NOT NULL DEFAULT 0,
  expires_at          timestamptz,
  is_active           boolean NOT NULL DEFAULT true,
  created_by_admin_id uuid NOT NULL REFERENCES admins(id),
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_promo_code_id_fkey
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id);
