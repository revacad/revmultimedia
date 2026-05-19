CREATE OR REPLACE FUNCTION public.generate_invoice_ref(p_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_stored_year text;
  v_seq bigint;
  v_prefix text;
  v_year_key text;
BEGIN
  IF p_type = 'apf' THEN
    v_prefix := 'REVAPF';
    v_year_key := 'invoice_apf_seq_year';
    SELECT value INTO v_stored_year FROM system_settings WHERE key = v_year_key;
    IF v_stored_year IS DISTINCT FROM v_year THEN
      ALTER SEQUENCE invoice_apf_seq RESTART WITH 1;
      UPDATE system_settings SET value = v_year, updated_at = now() WHERE key = v_year_key;
    END IF;
    v_seq := nextval('invoice_apf_seq');
  ELSIF p_type = 'inv' THEN
    v_prefix := 'REVINV';
    v_year_key := 'invoice_inv_seq_year';
    SELECT value INTO v_stored_year FROM system_settings WHERE key = v_year_key;
    IF v_stored_year IS DISTINCT FROM v_year THEN
      ALTER SEQUENCE invoice_inv_seq RESTART WITH 1;
      UPDATE system_settings SET value = v_year, updated_at = now() WHERE key = v_year_key;
    END IF;
    v_seq := nextval('invoice_inv_seq');
  ELSE
    RAISE EXCEPTION 'Invalid invoice type: %', p_type;
  END IF;

  RETURN v_prefix || v_year || lpad(v_seq::text, 5, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_invoice_ref(text) TO authenticated, service_role;
