-- Student ID: 6-digit sequence padding (REV2026000001).

CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'REV' || to_char(CURRENT_DATE, 'YYYY') ||
         lpad(nextval('student_id_seq')::text, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_student_id() TO authenticated, service_role;
