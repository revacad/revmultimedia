CREATE OR REPLACE FUNCTION public.generate_app_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'REVAPP' || to_char(CURRENT_DATE, 'YYYY') ||
         lpad(nextval('app_ref_seq')::text, 5, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_app_reference() TO authenticated, service_role;
