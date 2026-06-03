-- Waitlist: status, position, notification timestamp; intake-full applications skip app fee at submit.

ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'pending',
    'under_review',
    'shortlisted',
    'accepted',
    'rejected',
    'deferred',
    'waitlisted'
  ));

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS waitlist_position integer,
  ADD COLUMN IF NOT EXISTS waitlist_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS applications_waitlisted_intake_idx
  ON applications(intake_id)
  WHERE status = 'waitlisted';

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
  v_intake_full boolean := false;
  v_waitlist_position integer;
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

  SELECT
    i.max_slots IS NOT NULL
    AND i.enrolled_count >= i.max_slots
    AND NOT i.is_closed
  INTO v_intake_full
  FROM intakes i
  WHERE i.id = p_intake_id;

  IF v_intake_full IS NULL THEN
    RETURN json_build_object('error', 'intake_not_found');
  END IF;

  -- Resolve payment type for the application fee invoice.
  SELECT id INTO v_payment_type_id
  FROM payment_types
  WHERE is_active = true
    AND (
      slug = 'application_fee'
      OR lower(label) = 'application fee'
    )
  ORDER BY (slug = 'application_fee') DESC, sort_order ASC, created_at ASC
  LIMIT 1;

  IF v_payment_type_id IS NULL THEN
    -- Fallback: first active payment type (keeps system usable even if renamed/misconfigured).
    SELECT id INTO v_payment_type_id
    FROM payment_types
    WHERE is_active = true
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1;
  END IF;

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

  IF v_intake_full THEN
    SELECT COUNT(*) + 1
    INTO v_waitlist_position
    FROM applications
    WHERE intake_id = p_intake_id
      AND status = 'waitlisted';

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
      hybrid_attendance_confirmed,
      status,
      waitlist_position
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
      p_hybrid_attendance_confirmed,
      'waitlisted',
      v_waitlist_position
    )
    RETURNING id INTO v_app_id;

    RETURN json_build_object(
      'reference', v_reference,
      'application_id', v_app_id,
      'waitlisted', true,
      'waitlist_position', v_waitlist_position
    );
  END IF;

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

  IF v_payment_type_id IS NULL THEN
    RAISE EXCEPTION 'Application fee payment type not configured. Please contact the administrator.';
  END IF;

  INSERT INTO invoices (
    reference,
    type,
    application_id,
    amount_ghs,
    discount_ghs,
    total_ghs,
    status,
    payment_type_id
  ) VALUES (
    v_invoice_ref,
    'application_fee',
    v_app_id,
    v_fee_ghs,
    0,
    v_fee_ghs,
    'unpaid',
    v_payment_type_id
  )
  RETURNING id INTO v_invoice_id;

  RETURN json_build_object(
    'reference', v_reference,
    'application_id', v_app_id,
    'invoice_reference', v_invoice_ref,
    'invoice_id', v_invoice_id,
    'waitlisted', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_application(
  text, text, text, date, text, text, text, text, text, text, text, int, text, uuid, uuid, boolean, text
) TO authenticated, service_role;
