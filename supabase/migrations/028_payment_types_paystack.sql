-- Optional Paystack checkout for custom invoice types (not tuition / application fee)
ALTER TABLE payment_types
  ADD COLUMN allow_paystack boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN payment_types.allow_paystack IS
  'When true, REVINV invoices of this type can be paid online via Paystack in the student portal.';

UPDATE payment_types SET allow_paystack = false;
