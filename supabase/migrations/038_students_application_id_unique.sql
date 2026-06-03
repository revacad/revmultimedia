-- One student row per application: dedupe existing rows, add UNIQUE(application_id), idempotent inserts.

BEGIN;

-- Map duplicate student rows to the canonical row (earliest created_at per application_id).
CREATE TEMP TABLE _student_dupe_map ON COMMIT DROP AS
WITH ranked AS (
  SELECT
    id,
    application_id,
    ROW_NUMBER() OVER (
      PARTITION BY application_id
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.students
),
keepers AS (
  SELECT id AS keeper_id, application_id
  FROM ranked
  WHERE rn = 1
),
dupes AS (
  SELECT id AS dupe_id, application_id
  FROM ranked
  WHERE rn > 1
)
SELECT d.dupe_id, k.keeper_id
FROM dupes d
JOIN keepers k ON k.application_id = d.application_id;

UPDATE public.enrollments e
SET student_id = m.keeper_id
FROM _student_dupe_map m
WHERE e.student_id = m.dupe_id;

UPDATE public.invoices i
SET student_id = m.keeper_id
FROM _student_dupe_map m
WHERE i.student_id = m.dupe_id;

UPDATE public.documents d
SET student_id = m.keeper_id
FROM _student_dupe_map m
WHERE d.student_id = m.dupe_id;

UPDATE public.certificates c
SET student_id = m.keeper_id
FROM _student_dupe_map m
WHERE c.student_id = m.dupe_id;

UPDATE public.notifications_log n
SET student_id = m.keeper_id
FROM _student_dupe_map m
WHERE n.student_id = m.dupe_id;

UPDATE public.communication_logs cl
SET student_id = m.keeper_id
FROM _student_dupe_map m
WHERE cl.student_id = m.dupe_id;

UPDATE public.admin_notes an
SET student_id = m.keeper_id
FROM _student_dupe_map m
WHERE an.student_id = m.dupe_id;

UPDATE public.student_activity_logs sal
SET student_id = m.keeper_id
FROM _student_dupe_map m
WHERE sal.student_id = m.dupe_id;

UPDATE public.applications a
SET returning_student_id = m.keeper_id
FROM _student_dupe_map m
WHERE a.returning_student_id = m.dupe_id;

DELETE FROM public.students s
USING _student_dupe_map m
WHERE s.id = m.dupe_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'students_application_id_unique'
      AND conrelid = 'public.students'::regclass
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_application_id_unique UNIQUE (application_id);
  END IF;
END $$;

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

  SELECT s.id, s.student_id
  INTO v_student_pk, v_student_id
  FROM students s
  WHERE s.application_id = v_application.id
  ORDER BY s.created_at ASC NULLS LAST, s.id ASC
  LIMIT 1;

  IF v_student_pk IS NULL THEN
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
    ON CONFLICT (application_id) DO NOTHING;

    SELECT s.id, s.student_id
    INTO v_student_pk, v_student_id
    FROM students s
    WHERE s.application_id = v_application.id
    ORDER BY s.created_at ASC NULLS LAST, s.id ASC
    LIMIT 1;
  END IF;

  SELECT e.id
  INTO v_enrollment_id
  FROM enrollments e
  WHERE e.application_id = v_application.id
  ORDER BY e.enrolled_at ASC NULLS LAST, e.id ASC
  LIMIT 1;

  IF v_enrollment_id IS NULL THEN
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
  END IF;

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

COMMIT;
