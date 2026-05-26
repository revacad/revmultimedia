-- Allow invoice.type to match any payment_types.slug (e.g. laptop, materials)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_type_check;

-- Keep legacy type column aligned with payment_types when payment_type_id is set
CREATE OR REPLACE FUNCTION public.sync_invoice_type_from_payment_type()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_slug text;
BEGIN
  IF NEW.payment_type_id IS NOT NULL THEN
    SELECT slug INTO v_slug FROM payment_types WHERE id = NEW.payment_type_id;
    IF v_slug IS NOT NULL THEN
      NEW.type := v_slug;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_sync_type_from_payment_type ON invoices;
CREATE TRIGGER invoices_sync_type_from_payment_type
  BEFORE INSERT OR UPDATE OF payment_type_id ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_invoice_type_from_payment_type();
