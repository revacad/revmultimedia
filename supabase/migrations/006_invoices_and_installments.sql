CREATE TABLE invoices (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference           text NOT NULL UNIQUE,
  type                text NOT NULL CHECK (type IN ('application_fee', 'tuition')),
  application_id      uuid NOT NULL REFERENCES applications(id),
  student_id          uuid REFERENCES students(id),
  enrollment_id       uuid REFERENCES enrollments(id),
  amount_ghs          numeric(10,2) NOT NULL,
  discount_ghs        numeric(10,2) NOT NULL DEFAULT 0,
  promo_code_id       uuid,
  discount_note       text,
  total_ghs           numeric(10,2) NOT NULL,
  due_date            date,
  status              text NOT NULL DEFAULT 'unpaid'
                        CHECK (status IN ('unpaid','partially_paid','paid','waived')),
  payment_method      text CHECK (payment_method IN
                        ('paystack','momo','bank_transfer','international_wire','cash','other')),
  paystack_reference  text,
  r2_key              text,
  created_by_admin_id uuid REFERENCES admins(id),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE TABLE installments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id            uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount_ghs            numeric(10,2) NOT NULL,
  payment_method        text NOT NULL CHECK (payment_method IN
                          ('momo','bank_transfer','international_wire','cash','other')),
  transaction_ref       text,
  payment_note          text,
  confirmed_by_admin_id uuid NOT NULL REFERENCES admins(id),
  paid_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
