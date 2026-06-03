-- Separate sequences for application-fee (REVAPF) and tuition/other (REVINV) invoice refs.

CREATE SEQUENCE IF NOT EXISTS invoice_apf_seq START WITH 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS invoice_inv_seq START WITH 1 MINVALUE 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_reference(prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val bigint;
BEGIN
  IF prefix = 'REVAPF' THEN
    SELECT nextval('invoice_apf_seq') INTO next_val;
  ELSIF prefix = 'REVINV' THEN
    SELECT nextval('invoice_inv_seq') INTO next_val;
  ELSE
    RAISE EXCEPTION 'Invalid invoice reference prefix: %', prefix;
  END IF;

  RETURN prefix || to_char(CURRENT_DATE, 'YYYY') ||
         lpad(next_val::text, 5, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_invoice_reference(text) TO authenticated, service_role;

-- invoice_ref_seq is retained but no longer used by generate_invoice_reference.

ALTER SEQUENCE invoice_apf_seq RESTART WITH 1;
ALTER SEQUENCE invoice_inv_seq RESTART WITH 1;
ALTER SEQUENCE app_ref_seq RESTART WITH 1;
ALTER SEQUENCE student_id_seq RESTART WITH 1;
