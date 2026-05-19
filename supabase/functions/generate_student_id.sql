CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_stored_year text;
  v_seq bigint;
BEGIN
  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'student_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE student_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'student_seq_year';
  END IF;

  v_seq := nextval('student_seq');

  RETURN 'REV' || v_year || lpad(v_seq::text, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_student_id() TO authenticated, service_role;
