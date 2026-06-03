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

CREATE OR REPLACE FUNCTION public.generate_invoice_ref(p_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_type = 'apf' THEN
    RETURN generate_invoice_reference('REVAPF');
  ELSIF p_type = 'inv' THEN
    RETURN generate_invoice_reference('REVINV');
  ELSE
    RAISE EXCEPTION 'Invalid invoice type: %', p_type;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_invoice_ref(text) TO authenticated, service_role;
