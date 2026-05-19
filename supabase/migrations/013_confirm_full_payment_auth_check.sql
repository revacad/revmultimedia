CREATE OR REPLACE FUNCTION public.confirm_full_payment(
  p_invoice_id uuid,
  p_admin_id uuid,
  p_payment_method text,
  p_transaction_note text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_application applications%ROWTYPE;
  v_student_pk uuid;
  v_student_id text;
  v_enrollment_id uuid;
BEGIN
  SELECT * INTO v_invoice
  FROM invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  SELECT * INTO v_application
  FROM applications
  WHERE id = v_invoice.application_id;

  IF v_application.auth_user_id IS NULL THEN
    RETURN json_build_object(
      'error', 'auth_user_id is null on application',
      'application_id', v_application.id
    );
  END IF;

  UPDATE invoices
  SET
    status = 'paid',
    payment_method = p_payment_method,
    discount_note = COALESCE(p_transaction_note, discount_note),
    updated_at = now()
  WHERE id = p_invoice_id;

  v_student_id := public.generate_student_id();

  INSERT INTO students (
    student_id,
    application_id,
    auth_user_id,
    full_name,
    real_email,
    phone,
    date_of_birth,
    gender,
    country,
    address,
    state_region,
    city
  ) VALUES (
    v_student_id,
    v_application.id,
    v_application.auth_user_id,
    v_application.full_name,
    v_application.real_email,
    v_application.phone,
    v_application.date_of_birth,
    v_application.gender,
    v_application.country,
    v_application.address,
    v_application.state_region,
    v_application.city
  )
  RETURNING id INTO v_student_pk;

  INSERT INTO enrollments (
    student_id,
    course_id,
    intake_id,
    application_id,
    status
  ) VALUES (
    v_student_pk,
    v_application.course_id,
    v_application.intake_id,
    v_application.id,
    'active'
  )
  RETURNING id INTO v_enrollment_id;

  UPDATE applications
  SET status = 'accepted', updated_at = now()
  WHERE id = v_application.id
    AND status IS DISTINCT FROM 'accepted';

  UPDATE invoices
  SET student_id = v_student_pk, enrollment_id = v_enrollment_id
  WHERE id = p_invoice_id;

  RETURN json_build_object(
    'student_id', v_student_id,
    'enrollment_id', v_enrollment_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_full_payment(uuid, uuid, text, text) TO authenticated, service_role;
