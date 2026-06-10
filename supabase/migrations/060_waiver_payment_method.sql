-- Waiver payments recorded as installments with reason metadata.
ALTER TABLE installments
  ADD COLUMN IF NOT EXISTS waiver_reason text;

ALTER TABLE installments
  DROP CONSTRAINT IF EXISTS installments_payment_method_check;

ALTER TABLE installments
  ADD CONSTRAINT installments_payment_method_check
  CHECK (payment_method IN (
    'momo',
    'bank_transfer',
    'international_wire',
    'cash',
    'other',
    'waiver'
  ));

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_payment_method_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_payment_method_check
  CHECK (
    payment_method IS NULL
    OR payment_method IN (
      'paystack',
      'momo',
      'bank_transfer',
      'international_wire',
      'cash',
      'other',
      'waiver'
    )
  );
