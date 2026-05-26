-- Configurable payment categories (application fee, tuition, etc.)
CREATE TABLE payment_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  label       text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_types ENABLE ROW LEVEL SECURITY;

INSERT INTO payment_types (slug, label, description, sort_order) VALUES
  (
    'application_fee',
    'Application fee',
    'Non-refundable fee to process the application (typically GHS 100). Students normally pay via Paystack; record manually for cash at the academy.',
    1
  ),
  (
    'tuition',
    'Tuition fee',
    'Course tuition after acceptance. May be paid in installments.',
    2
  );

ALTER TABLE invoices
  ADD COLUMN payment_type_id uuid REFERENCES payment_types(id);

UPDATE invoices i
SET payment_type_id = pt.id
FROM payment_types pt
WHERE pt.slug = i.type;

ALTER TABLE invoices
  ALTER COLUMN payment_type_id SET NOT NULL;

CREATE INDEX invoices_payment_type_id_idx ON invoices (payment_type_id);

-- Admins can read payment types (for labels in UI)
CREATE POLICY payment_types_select_admin ON payment_types
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.auth_user_id = auth.uid() AND a.is_active = true
    )
  );

-- Service role manages types (seeds, future admin CRUD)
CREATE POLICY payment_types_all_service ON payment_types
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Keep create_application in sync
CREATE OR REPLACE FUNCTION public.create_application(
  p_real_email text,
  p_phone text,
  p_full_name text,
  p_date_of_birth date,
  p_gender text,
  p_country text,
  p_address text,
  p_state_region text,
  p_city text,
  p_qualification text,
  p_institution text,
  p_year_completed int,
  p_prior_experience text,
  p_course_id uuid,
  p_intake_id uuid,
  p_hybrid_attendance_confirmed boolean,
  p_internal_email_domain text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_stored_year text;
  v_seq bigint;
  v_reference text;
  v_internal_email text;
  v_app_id uuid;
  v_invoice_ref text;
  v_apf_seq bigint;
  v_fee_ghs numeric(10,2);
  v_invoice_id uuid;
  v_payment_type_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM applications
    WHERE (real_email = p_real_email OR phone = p_phone)
      AND intake_id = p_intake_id
      AND status NOT IN ('rejected', 'deferred')
    LIMIT 1
  ) THEN
    RETURN json_build_object('error', 'duplicate');
  END IF;

  SELECT id INTO v_payment_type_id
  FROM payment_types
  WHERE slug = 'application_fee' AND is_active = true
  LIMIT 1;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'application_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE application_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'application_seq_year';
  END IF;

  v_seq := nextval('application_seq');
  v_reference := 'REVAPP' || v_year || lpad(v_seq::text, 5, '0');
  v_internal_email := v_reference || '@' || p_internal_email_domain;

  INSERT INTO applications (
    reference,
    internal_email,
    real_email,
    phone,
    full_name,
    date_of_birth,
    gender,
    country,
    address,
    state_region,
    city,
    qualification,
    institution,
    year_completed,
    prior_experience,
    course_id,
    intake_id,
    hybrid_attendance_confirmed
  ) VALUES (
    v_reference,
    v_internal_email,
    p_real_email,
    p_phone,
    p_full_name,
    p_date_of_birth,
    p_gender,
    p_country,
    p_address,
    p_state_region,
    p_city,
    p_qualification,
    p_institution,
    p_year_completed,
    p_prior_experience,
    p_course_id,
    p_intake_id,
    p_hybrid_attendance_confirmed
  )
  RETURNING id INTO v_app_id;

  SELECT value::numeric INTO v_fee_ghs
  FROM system_settings
  WHERE key = 'application_fee_ghs';

  IF v_fee_ghs IS NULL THEN
    v_fee_ghs := 0;
  END IF;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'invoice_apf_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE invoice_apf_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'invoice_apf_seq_year';
  END IF;

  v_apf_seq := nextval('invoice_apf_seq');
  v_invoice_ref := 'REVAPF' || v_year || lpad(v_apf_seq::text, 5, '0');

  INSERT INTO invoices (
    reference,
    type,
    payment_type_id,
    application_id,
    amount_ghs,
    discount_ghs,
    total_ghs,
    status
  ) VALUES (
    v_invoice_ref,
    'application_fee',
    v_payment_type_id,
    v_app_id,
    v_fee_ghs,
    0,
    v_fee_ghs,
    'unpaid'
  )
  RETURNING id INTO v_invoice_id;

  RETURN json_build_object(
    'reference', v_reference,
    'application_id', v_app_id,
    'invoice_reference', v_invoice_ref,
    'invoice_id', v_invoice_id
  );
END;
$$;
