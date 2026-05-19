CREATE OR REPLACE FUNCTION public.update_intake_enrolled_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE intakes
    SET enrolled_count = enrolled_count + 1
    WHERE id = NEW.intake_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'withdrawn' AND OLD.status = 'active' THEN
      UPDATE intakes
      SET enrolled_count = GREATEST(enrolled_count - 1, 0)
      WHERE id = NEW.intake_id;
    ELSIF NEW.status = 'active' AND OLD.status = 'withdrawn' THEN
      UPDATE intakes
      SET enrolled_count = enrolled_count + 1
      WHERE id = NEW.intake_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enrollments_update_intake_count
  AFTER INSERT OR UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_intake_enrolled_count();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER applications_set_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER students_set_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
