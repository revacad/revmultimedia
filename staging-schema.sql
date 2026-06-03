-- Migration: 001_sequences_and_settings.sql

CREATE SEQUENCE application_seq START 1;
CREATE SEQUENCE invoice_apf_seq START 1;
CREATE SEQUENCE invoice_inv_seq START 1;
CREATE SEQUENCE student_seq START 1;

CREATE TABLE system_settings (
  key          text PRIMARY KEY,
  value        text,
  description  text,
  updated_at   timestamptz DEFAULT now(),
  updated_by   uuid
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO system_settings (key, value, description) VALUES
  ('application_fee_ghs', '', 'Application fee in GHS'),
  ('application_seq_year', to_char(now(), 'YYYY'), 'Year for application reference sequence reset'),
  ('invoice_apf_seq_year', to_char(now(), 'YYYY'), 'Year for REVAPF invoice sequence reset'),
  ('invoice_inv_seq_year', to_char(now(), 'YYYY'), 'Year for REVINV invoice sequence reset'),
  ('student_seq_year', to_char(now(), 'YYYY'), 'Year for student ID sequence reset'),
  ('momo_number_1', '', 'Primary MoMo number'),
  ('momo_name_1', '', 'Primary MoMo account name'),
  ('momo_number_2', '', 'Secondary MoMo number'),
  ('momo_name_2', '', 'Secondary MoMo account name'),
  ('bank_name', '', 'Bank name'),
  ('bank_account_number', '', 'Bank account number'),
  ('bank_account_name', '', 'Bank account name'),
  ('bank_branch', '', 'Bank branch'),
  ('bank_swift_code', '', 'SWIFT/BIC code'),
  ('bank_iban', '', 'IBAN'),
  ('bank_routing_number', '', 'Routing number'),
  ('paystack_public_key', '', 'Paystack public key'),
  ('sentdm_sender_id', '', 'Sent.dm sender ID'),
  ('academy_email', '', 'Academy contact email'),
  ('academy_phone', '', 'Academy contact phone'),
  ('academy_address', '', 'Academy physical address'),
  ('application_deadline_message', '', 'Message shown on application form');

-- Migration: 002_admins.sql

CREATE TABLE admins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text NOT NULL,
  email         text NOT NULL UNIQUE,
  role          text NOT NULL CHECK (role IN ('admin', 'superadmin')),
  is_active     boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES admins(id),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

ALTER TABLE system_settings
  ADD CONSTRAINT system_settings_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES admins(id);

-- Migration: 003_courses_and_intakes.sql

CREATE TABLE courses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  slug             text NOT NULL UNIQUE,
  category         text NOT NULL CHECK (category IN ('graphic_design', 'motion_graphics', 'video_editing')),
  description      text,
  curriculum       jsonb,
  mode             text NOT NULL CHECK (mode IN ('online', 'in_person', 'hybrid')),
  tuition_fee_ghs  numeric(10,2) NOT NULL,
  max_slots        int NOT NULL DEFAULT 20,
  is_published     boolean NOT NULL DEFAULT false,
  thumbnail_r2_key text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE TABLE intakes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id            uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  start_date           date NOT NULL,
  end_date             date NOT NULL,
  application_deadline date,
  max_slots            int,
  enrolled_count       int NOT NULL DEFAULT 0,
  is_closed            boolean NOT NULL DEFAULT false,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE intakes ENABLE ROW LEVEL SECURITY;

-- Migration: 004_applications.sql

CREATE TABLE applications (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference                    text NOT NULL UNIQUE,
  auth_user_id                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_email               text NOT NULL UNIQUE,
  real_email                   text NOT NULL,
  phone                        text NOT NULL,
  full_name                    text NOT NULL,
  date_of_birth                date NOT NULL,
  gender                       text NOT NULL CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
  country                      text NOT NULL DEFAULT 'Ghana',
  address                      text NOT NULL,
  state_region                 text,
  city                         text,
  qualification                text NOT NULL CHECK (qualification IN ('wassce', 'hnd', 'degree', 'masters', 'other')),
  institution                  text NOT NULL,
  year_completed               int NOT NULL,
  prior_experience             text,
  course_id                    uuid NOT NULL REFERENCES courses(id),
  intake_id                    uuid NOT NULL REFERENCES intakes(id),
  hybrid_attendance_confirmed  boolean NOT NULL DEFAULT false,
  status                       text NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','under_review','shortlisted','accepted','rejected','deferred')),
  app_fee_paid                 boolean NOT NULL DEFAULT false,
  created_at                   timestamptz DEFAULT now(),
  updated_at                   timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX applications_real_email_idx ON applications(real_email);
CREATE INDEX applications_phone_idx ON applications(phone);
CREATE INDEX applications_course_id_idx ON applications(course_id);
CREATE INDEX applications_intake_id_idx ON applications(intake_id);
CREATE INDEX applications_status_idx ON applications(status);

-- Migration: 005_students_and_enrollments.sql

CREATE TABLE students (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           text NOT NULL UNIQUE,
  application_id       uuid NOT NULL REFERENCES applications(id),
  auth_user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            text NOT NULL,
  real_email           text NOT NULL,
  phone                text NOT NULL,
  date_of_birth        date NOT NULL,
  gender               text NOT NULL,
  country              text NOT NULL,
  address              text NOT NULL,
  state_region         text,
  city                 text,
  profile_photo_r2_key text,
  is_active            boolean NOT NULL DEFAULT true,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE TABLE enrollments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid NOT NULL REFERENCES students(id),
  course_id      uuid NOT NULL REFERENCES courses(id),
  intake_id      uuid NOT NULL REFERENCES intakes(id),
  application_id uuid NOT NULL REFERENCES applications(id),
  status         text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'completed', 'withdrawn', 'deferred')),
  enrolled_at    timestamptz DEFAULT now(),
  completed_at   timestamptz
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE INDEX enrollments_student_id_idx ON enrollments(student_id);
CREATE INDEX students_student_id_idx ON students(student_id);

-- Migration: 006_invoices_and_installments.sql

CREATE TABLE invoices (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference           text NOT NULL UNIQUE,
  type                text NOT NULL CHECK (type IN ('application_fee', 'tuition')),
  application_id      uuid NOT NULL REFERENCES applications(id),
  student_id          uuid REFERENCES students(id),
  enrollment_id       uuid REFERENCES enrollments(id),
  amount_ghs          numeric(10,2) NOT NULL,
  discount_ghs        numeric(10,2) NOT NULL DEFAULT 0,
  promo_code_id       uuid,
  discount_note       text,
  total_ghs           numeric(10,2) NOT NULL,
  due_date            date,
  status              text NOT NULL DEFAULT 'unpaid'
                        CHECK (status IN ('unpaid','partially_paid','paid','waived')),
  payment_method      text CHECK (payment_method IN
                        ('paystack','momo','bank_transfer','international_wire','cash','other')),
  paystack_reference  text,
  r2_key              text,
  created_by_admin_id uuid REFERENCES admins(id),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE TABLE installments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id            uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount_ghs            numeric(10,2) NOT NULL,
  payment_method        text NOT NULL CHECK (payment_method IN
                          ('momo','bank_transfer','international_wire','cash','other')),
  transaction_ref       text,
  payment_note          text,
  confirmed_by_admin_id uuid NOT NULL REFERENCES admins(id),
  paid_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

-- Migration: 007_promo_codes.sql

CREATE TABLE promo_codes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text NOT NULL UNIQUE,
  discount_type       text NOT NULL CHECK (discount_type IN ('percentage', 'flat_ghs')),
  discount_value      numeric(10,2) NOT NULL,
  max_uses            int,
  uses_count          int NOT NULL DEFAULT 0,
  expires_at          timestamptz,
  is_active           boolean NOT NULL DEFAULT true,
  created_by_admin_id uuid NOT NULL REFERENCES admins(id),
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_promo_code_id_fkey
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id);

-- Migration: 008_documents_and_certificates.sql

CREATE TABLE documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid REFERENCES applications(id),
  student_id      uuid REFERENCES students(id),
  document_type   text NOT NULL CHECK (document_type IN
                    ('national_id', 'passport', 'passport_photo', 'certificate', 'other')),
  r2_key          text NOT NULL,
  file_name       text NOT NULL,
  file_size_bytes int,
  mime_type       text,
  uploaded_by     text NOT NULL CHECK (uploaded_by IN ('student', 'admin')),
  uploaded_at     timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE certificates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           uuid NOT NULL REFERENCES students(id),
  enrollment_id        uuid NOT NULL REFERENCES enrollments(id),
  course_id            uuid NOT NULL REFERENCES courses(id),
  r2_key               text NOT NULL,
  file_name            text NOT NULL,
  uploaded_by_admin_id uuid NOT NULL REFERENCES admins(id),
  uploaded_at          timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Migration: 009_notifications_log.sql

CREATE TABLE notifications_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   uuid REFERENCES applications(id),
  student_id       uuid REFERENCES students(id),
  channel          text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  event_type       text NOT NULL CHECK (event_type IN (
                     'application_received', 'otp_sent', 'status_changed',
                     'app_fee_invoice_generated', 'tuition_invoice_generated',
                     'payment_confirmed', 'enrollment_confirmed',
                     'certificate_uploaded', 'password_reset', 'contact_form'
                   )),
  recipient        text NOT NULL,
  status           text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  provider_response jsonb,
  sent_at          timestamptz DEFAULT now()
);

ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- Migration: 010_admin_notes.sql

CREATE TABLE admin_notes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id),
  student_id     uuid REFERENCES students(id),
  note           text NOT NULL,
  created_by     uuid NOT NULL REFERENCES admins(id),
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- Migration: 011_rls_policies.sql

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() IN ('admin', 'superadmin');
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() = 'superadmin';
$$;

-- courses (public read for published)
CREATE POLICY courses_anon_select ON courses
  FOR SELECT TO anon
  USING (is_published = true);

CREATE POLICY courses_authenticated_select ON courses
  FOR SELECT TO authenticated
  USING (is_published = true OR public.is_admin());

CREATE POLICY courses_admin_insert ON courses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY courses_admin_update ON courses
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY courses_admin_delete ON courses
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- intakes (public read when course published)
CREATE POLICY intakes_anon_select ON intakes
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = intakes.course_id AND c.is_published = true
    )
  );

CREATE POLICY intakes_authenticated_select ON intakes
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = intakes.course_id AND c.is_published = true
    )
  );

CREATE POLICY intakes_admin_insert ON intakes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY intakes_admin_update ON intakes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY intakes_admin_delete ON intakes
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- applications
CREATE POLICY applications_select_own ON applications
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id OR public.is_admin());

CREATE POLICY applications_admin_write ON applications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- students
CREATE POLICY students_select_own ON students
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id OR public.is_admin());

CREATE POLICY students_admin_write ON students
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- enrollments
CREATE POLICY enrollments_select_own ON enrollments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = enrollments.student_id AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY enrollments_admin_write ON enrollments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- invoices
CREATE POLICY invoices_select_own ON invoices
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = invoices.application_id AND a.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = invoices.student_id AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY invoices_admin_write ON invoices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- installments
CREATE POLICY installments_select_own ON installments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM invoices i
      JOIN applications a ON a.id = i.application_id
      WHERE i.id = installments.invoice_id AND a.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM invoices i
      JOIN students s ON s.id = i.student_id
      WHERE i.id = installments.invoice_id AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY installments_admin_write ON installments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- documents
CREATE POLICY documents_select_own ON documents
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = documents.application_id AND a.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = documents.student_id AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY documents_admin_write ON documents
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- certificates
CREATE POLICY certificates_select_own ON certificates
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = certificates.student_id AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY certificates_admin_write ON certificates
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- admins
CREATE POLICY admins_select ON admins
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY admins_superadmin_insert ON admins
  FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin());

CREATE POLICY admins_superadmin_update ON admins
  FOR UPDATE TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- admin_notes
CREATE POLICY admin_notes_select ON admin_notes
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY admin_notes_insert ON admin_notes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY admin_notes_update ON admin_notes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- promo_codes
CREATE POLICY promo_codes_select ON promo_codes
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY promo_codes_insert ON promo_codes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY promo_codes_update ON promo_codes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- system_settings
CREATE POLICY system_settings_anon_select ON system_settings
  FOR SELECT TO anon
  USING (true);

CREATE POLICY system_settings_admin_select ON system_settings
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY system_settings_admin_insert ON system_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY system_settings_admin_update ON system_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- notifications_log
CREATE POLICY notifications_log_select ON notifications_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Migration: 012_triggers.sql

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

-- Migration: 013_confirm_full_payment_auth_check.sql

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

-- Migration: 014_communications.sql

CREATE TABLE communication_campaigns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel          text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  subject          text,
  message          text NOT NULL,
  filters          jsonb NOT NULL DEFAULT '{}',
  recipient_count  int NOT NULL DEFAULT 0,
  sent_count       int NOT NULL DEFAULT 0,
  failed_count     int NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'queued', 'processing', 'completed', 'failed')),
  created_by       uuid NOT NULL REFERENCES admins(id),
  queued_at        timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE communication_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES communication_campaigns(id) ON DELETE CASCADE,
  student_id    uuid REFERENCES students(id) ON DELETE SET NULL,
  recipient     text NOT NULL,
  channel       text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  sent_at       timestamptz DEFAULT now()
);

CREATE INDEX communication_campaigns_created_at_idx
  ON communication_campaigns(created_at DESC);

CREATE INDEX communication_logs_campaign_id_idx
  ON communication_logs(campaign_id);

CREATE INDEX communication_logs_student_sent_idx
  ON communication_logs(student_id, sent_at DESC);

ALTER TABLE communication_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY communication_campaigns_admin_select ON communication_campaigns
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY communication_logs_admin_select ON communication_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

INSERT INTO system_settings (key, value, description) VALUES
  ('sms_provider', 'sentdm', 'Active SMS provider: sentdm or fishafrica'),
  ('sentdm_api_key', '', 'Sent.dm API key (overrides SENTDM_API_KEY env when set)'),
  ('sentdm_sender_id', '', 'Sent.dm sender ID'),
  ('fishafrica_api_key', '', 'Fish Africa API key'),
  ('fishafrica_sender_id', '', 'Fish Africa sender ID')
ON CONFLICT (key) DO NOTHING;

-- Migration: 015_create_application_intake_duplicate.sql

-- Allow returning students to apply for different courses/intakes;
-- block only duplicate active applications for the same intake.

CREATE OR REPLACE FUNCTION public.create_application(
  p_real_email text,
  p_phone text,
  p_full_name text,
  p_date_of_birth date,
  p_gender text,
  p_country text,
  p_address text,
  p_state_region text,
  p_city text,
  p_qualification text,
  p_institution text,
  p_year_completed int,
  p_prior_experience text,
  p_course_id uuid,
  p_intake_id uuid,
  p_hybrid_attendance_confirmed boolean,
  p_internal_email_domain text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_stored_year text;
  v_seq bigint;
  v_reference text;
  v_internal_email text;
  v_app_id uuid;
  v_invoice_ref text;
  v_apf_seq bigint;
  v_fee_ghs numeric(10,2);
  v_invoice_id uuid;
BEGIN
  -- Only block if they have an active/pending application for the SAME intake
  IF EXISTS (
    SELECT 1 FROM applications
    WHERE (real_email = p_real_email OR phone = p_phone)
      AND intake_id = p_intake_id
      AND status NOT IN ('rejected', 'deferred')
    LIMIT 1
  ) THEN
    RETURN json_build_object('error', 'duplicate');
  END IF;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'application_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE application_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'application_seq_year';
  END IF;

  v_seq := nextval('application_seq');
  v_reference := 'REVAPP' || v_year || lpad(v_seq::text, 5, '0');
  v_internal_email := v_reference || '@' || p_internal_email_domain;

  INSERT INTO applications (
    reference,
    internal_email,
    real_email,
    phone,
    full_name,
    date_of_birth,
    gender,
    country,
    address,
    state_region,
    city,
    qualification,
    institution,
    year_completed,
    prior_experience,
    course_id,
    intake_id,
    hybrid_attendance_confirmed
  ) VALUES (
    v_reference,
    v_internal_email,
    p_real_email,
    p_phone,
    p_full_name,
    p_date_of_birth,
    p_gender,
    p_country,
    p_address,
    p_state_region,
    p_city,
    p_qualification,
    p_institution,
    p_year_completed,
    p_prior_experience,
    p_course_id,
    p_intake_id,
    p_hybrid_attendance_confirmed
  )
  RETURNING id INTO v_app_id;

  SELECT value::numeric INTO v_fee_ghs
  FROM system_settings
  WHERE key = 'application_fee_ghs';

  IF v_fee_ghs IS NULL THEN
    v_fee_ghs := 0;
  END IF;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'invoice_apf_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE invoice_apf_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'invoice_apf_seq_year';
  END IF;

  v_apf_seq := nextval('invoice_apf_seq');
  v_invoice_ref := 'REVAPF' || v_year || lpad(v_apf_seq::text, 5, '0');

  INSERT INTO invoices (
    reference,
    type,
    application_id,
    amount_ghs,
    discount_ghs,
    total_ghs,
    status
  ) VALUES (
    v_invoice_ref,
    'application_fee',
    v_app_id,
    v_fee_ghs,
    0,
    v_fee_ghs,
    'unpaid'
  )
  RETURNING id INTO v_invoice_id;

  RETURN json_build_object(
    'reference', v_reference,
    'application_id', v_app_id,
    'invoice_reference', v_invoice_ref,
    'invoice_id', v_invoice_id
  );
END;
$$;

-- Migration: 016_admin_invites_audit.sql

CREATE TABLE admin_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  full_name   text NOT NULL,
  role        text NOT NULL CHECK (role IN ('admin', 'superadmin')),
  token       text NOT NULL UNIQUE,
  invited_by  uuid NOT NULL REFERENCES admins(id),
  expires_at  timestamptz NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX admin_invites_token_idx ON admin_invites (token) WHERE used = false;
CREATE INDEX admin_invites_pending_idx ON admin_invites (expires_at) WHERE used = false;

CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid REFERENCES admins(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  old_value   jsonb,
  new_value   jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX audit_logs_action_idx ON audit_logs (action);

ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Migration: 017_search_vectors.sql

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(category, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_courses_search_vector
  ON courses USING gin(search_vector);

ALTER TABLE students
ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(full_name, '') || ' ' ||
      coalesce(real_email, '') || ' ' ||
      coalesce(student_id, '') || ' ' ||
      coalesce(phone, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_students_search_vector
  ON students USING gin(search_vector);

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(full_name, '') || ' ' ||
      coalesce(real_email, '') || ' ' ||
      coalesce(reference, '') || ' ' ||
      coalesce(phone, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_applications_search_vector
  ON applications USING gin(search_vector);

-- Migration: 018_resources_and_course_content.sql

-- Resources for admin upload / student download
CREATE TABLE resources (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  file_r2_key  text NOT NULL,
  file_name    text NOT NULL,
  file_type    text NOT NULL CHECK (file_type IN ('pdf', 'image')),
  file_size    bigint,
  course_id    uuid REFERENCES courses(id) ON DELETE SET NULL,
  intake_id    uuid REFERENCES intakes(id) ON DELETE SET NULL,
  visibility   text NOT NULL DEFAULT 'all_students'
                 CHECK (visibility IN ('all_students', 'course_specific', 'intake_specific')),
  is_active    boolean NOT NULL DEFAULT true,
  uploaded_by  uuid NOT NULL REFERENCES admins(id),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_resources_course_id ON resources(course_id);
CREATE INDEX idx_resources_intake_id ON resources(intake_id);
CREATE INDEX idx_resources_visibility ON resources(visibility);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_resources_all"
  ON resources FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "student_resources_select"
  ON resources FOR SELECT TO authenticated
  USING (
    is_active = true AND (
      visibility = 'all_students'
      OR (
        visibility = 'course_specific'
        AND course_id IN (
          SELECT e.course_id FROM enrollments e
          JOIN students s ON s.id = e.student_id
          WHERE s.auth_user_id = auth.uid()
          AND e.status = 'active'
        )
      )
      OR (
        visibility = 'intake_specific'
        AND intake_id IN (
          SELECT e.intake_id FROM enrollments e
          JOIN students s ON s.id = e.student_id
          WHERE s.auth_user_id = auth.uid()
          AND e.status = 'active'
        )
      )
    )
  );

ALTER TABLE courses
  ALTER COLUMN curriculum SET DEFAULT '{}'::jsonb;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS video_intro_url text;

-- Student activity for resource downloads
CREATE TABLE student_activity_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  action     text NOT NULL,
  metadata   jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_student_activity_student_id ON student_activity_logs(student_id);
CREATE INDEX idx_student_activity_created_at ON student_activity_logs(created_at DESC);

ALTER TABLE student_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_activity_insert_own"
  ON student_activity_logs FOR INSERT TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "admin_student_activity_select"
  ON student_activity_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
  );

-- Migration: 019_applications_app_fee_paid_at.sql

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS app_fee_paid_at timestamptz;

-- Migration: 020_sentdm_template_settings.sql

INSERT INTO system_settings (key, value, description) VALUES
  ('sentdm_whatsapp_template_id', '', 'Sent.dm WhatsApp template ID'),
  ('sentdm_sms_template_id', '', 'Sent.dm SMS template ID')
ON CONFLICT (key) DO NOTHING;

-- Migration: 021_communication_logs_provider_message_id.sql

ALTER TABLE communication_logs
  ADD COLUMN IF NOT EXISTS provider_message_id text;

ALTER TABLE communication_logs
  ADD COLUMN IF NOT EXISTS provider_response jsonb;

CREATE INDEX IF NOT EXISTS idx_comm_logs_provider_message_id
  ON communication_logs(provider_message_id);

-- Migration: 022_audit_logs_retroactive.sql

-- Retroactive audit log entries (run once in Supabase SQL Editor if not applied via migration)
TRUNCATE audit_logs;

INSERT INTO audit_logs (action, entity_type, entity_id, new_value, created_at)
SELECT
  'application.submitted',
  'application',
  id,
  json_build_object(
    'reference', reference,
    'full_name', full_name,
    'status', status
  ),
  created_at
FROM applications;

INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, new_value, created_at)
SELECT
  i.confirmed_by_admin_id,
  'payment.confirmed',
  'installment',
  i.id,
  json_build_object(
    'amount_ghs', i.amount_ghs,
    'payment_method', i.payment_method
  ),
  i.paid_at
FROM installments i
WHERE i.confirmed_by_admin_id IS NOT NULL;

INSERT INTO audit_logs (action, entity_type, entity_id, new_value, created_at)
SELECT
  'student.enrolled',
  'student',
  id,
  json_build_object(
    'student_id', student_id,
    'full_name', full_name
  ),
  created_at
FROM students;

INSERT INTO audit_logs (action, entity_type, entity_id, new_value, created_at)
SELECT
  'invoice.generated',
  'invoice',
  id,
  json_build_object(
    'reference', reference,
    'type', type,
    'amount', total_ghs
  ),
  created_at
FROM invoices;

-- Migration: 023_audit_logs_entity_id_text_rls.sql

-- entity_id as text (supports UUIDs, slugs like csv-export, r2-backup)
ALTER TABLE audit_logs
  ALTER COLUMN entity_id TYPE text USING entity_id::text;

-- RLS is enabled; service role bypasses policies. Explicit policies for clarity.
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role can select audit logs" ON audit_logs;

CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select audit logs"
  ON audit_logs
  FOR SELECT
  TO service_role
  USING (true);

-- Migration: 024_applications_promo_code.sql

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS promo_code_id uuid REFERENCES promo_codes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS applications_promo_code_id_idx ON applications(promo_code_id);


-- Migration: 025_payment_types.sql

-- Configurable payment categories (application fee, tuition, etc.)
CREATE TABLE payment_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  label       text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_types ENABLE ROW LEVEL SECURITY;

INSERT INTO payment_types (slug, label, description, sort_order) VALUES
  (
    'application_fee',
    'Application fee',
    'Non-refundable fee to process the application (typically GHS 100). Students normally pay via Paystack; record manually for cash at the academy.',
    1
  ),
  (
    'tuition',
    'Tuition fee',
    'Course tuition after acceptance. May be paid in installments.',
    2
  );

ALTER TABLE invoices
  ADD COLUMN payment_type_id uuid REFERENCES payment_types(id);

UPDATE invoices i
SET payment_type_id = pt.id
FROM payment_types pt
WHERE pt.slug = i.type;

ALTER TABLE invoices
  ALTER COLUMN payment_type_id SET NOT NULL;

CREATE INDEX invoices_payment_type_id_idx ON invoices (payment_type_id);

-- Admins can read payment types (for labels in UI)
CREATE POLICY payment_types_select_admin ON payment_types
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.auth_user_id = auth.uid() AND a.is_active = true
    )
  );

-- Service role manages types (seeds, future admin CRUD)
CREATE POLICY payment_types_all_service ON payment_types
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Keep create_application in sync
CREATE OR REPLACE FUNCTION public.create_application(
  p_real_email text,
  p_phone text,
  p_full_name text,
  p_date_of_birth date,
  p_gender text,
  p_country text,
  p_address text,
  p_state_region text,
  p_city text,
  p_qualification text,
  p_institution text,
  p_year_completed int,
  p_prior_experience text,
  p_course_id uuid,
  p_intake_id uuid,
  p_hybrid_attendance_confirmed boolean,
  p_internal_email_domain text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_stored_year text;
  v_seq bigint;
  v_reference text;
  v_internal_email text;
  v_app_id uuid;
  v_invoice_ref text;
  v_apf_seq bigint;
  v_fee_ghs numeric(10,2);
  v_invoice_id uuid;
  v_payment_type_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM applications
    WHERE (real_email = p_real_email OR phone = p_phone)
      AND intake_id = p_intake_id
      AND status NOT IN ('rejected', 'deferred')
    LIMIT 1
  ) THEN
    RETURN json_build_object('error', 'duplicate');
  END IF;

  SELECT id INTO v_payment_type_id
  FROM payment_types
  WHERE slug = 'application_fee' AND is_active = true
  LIMIT 1;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'application_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE application_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'application_seq_year';
  END IF;

  v_seq := nextval('application_seq');
  v_reference := 'REVAPP' || v_year || lpad(v_seq::text, 5, '0');
  v_internal_email := v_reference || '@' || p_internal_email_domain;

  INSERT INTO applications (
    reference,
    internal_email,
    real_email,
    phone,
    full_name,
    date_of_birth,
    gender,
    country,
    address,
    state_region,
    city,
    qualification,
    institution,
    year_completed,
    prior_experience,
    course_id,
    intake_id,
    hybrid_attendance_confirmed
  ) VALUES (
    v_reference,
    v_internal_email,
    p_real_email,
    p_phone,
    p_full_name,
    p_date_of_birth,
    p_gender,
    p_country,
    p_address,
    p_state_region,
    p_city,
    p_qualification,
    p_institution,
    p_year_completed,
    p_prior_experience,
    p_course_id,
    p_intake_id,
    p_hybrid_attendance_confirmed
  )
  RETURNING id INTO v_app_id;

  SELECT value::numeric INTO v_fee_ghs
  FROM system_settings
  WHERE key = 'application_fee_ghs';

  IF v_fee_ghs IS NULL THEN
    v_fee_ghs := 0;
  END IF;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'invoice_apf_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE invoice_apf_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'invoice_apf_seq_year';
  END IF;

  v_apf_seq := nextval('invoice_apf_seq');
  v_invoice_ref := 'REVAPF' || v_year || lpad(v_apf_seq::text, 5, '0');

  INSERT INTO invoices (
    reference,
    type,
    payment_type_id,
    application_id,
    amount_ghs,
    discount_ghs,
    total_ghs,
    status
  ) VALUES (
    v_invoice_ref,
    'application_fee',
    v_payment_type_id,
    v_app_id,
    v_fee_ghs,
    0,
    v_fee_ghs,
    'unpaid'
  )
  RETURNING id INTO v_invoice_id;

  RETURN json_build_object(
    'reference', v_reference,
    'application_id', v_app_id,
    'invoice_reference', v_invoice_ref,
    'invoice_id', v_invoice_id
  );
END;
$$;

-- Migration: 026_payment_types_flexible_invoice_type.sql

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

-- Migration: 027_payment_types_portal_read.sql

-- Students need payment type labels when viewing invoices in the portal
CREATE POLICY payment_types_select_authenticated ON payment_types
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Migration: 028_payment_types_paystack.sql

-- Optional Paystack checkout for custom invoice types (not tuition / application fee)
ALTER TABLE payment_types
  ADD COLUMN allow_paystack boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN payment_types.allow_paystack IS
  'When true, REVINV invoices of this type can be paid online via Paystack in the student portal.';

UPDATE payment_types SET allow_paystack = false;

-- Migration: 029_admission_letters_enrollment.sql

-- Per-program enrollment: partial tuition payment + admission letter PDF sent by admin.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS enrolled_at timestamptz,
  ADD COLUMN IF NOT EXISTS admission_letter_r2_key text,
  ADD COLUMN IF NOT EXISTS admission_letter_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS admission_letter_sent_by_admin_id uuid REFERENCES admins(id);

CREATE INDEX IF NOT EXISTS applications_enrolled_at_idx ON applications(enrolled_at)
  WHERE enrolled_at IS NOT NULL;

-- Allow storing admission letters in documents (portal / admin view).
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check
  CHECK (document_type IN (
    'national_id', 'passport', 'passport_photo', 'certificate',
    'admission_letter', 'other'
  ));

-- Notification log event for admission letter email.
ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS notifications_log_event_type_check;
ALTER TABLE notifications_log ADD CONSTRAINT notifications_log_event_type_check
  CHECK (event_type IN (
    'application_received', 'otp_sent', 'status_changed',
    'app_fee_invoice_generated', 'tuition_invoice_generated',
    'payment_confirmed', 'enrollment_confirmed', 'admission_letter_sent',
    'certificate_uploaded', 'password_reset', 'contact_form'
  ));

-- Migration: 030_application_next_intake.sql

-- Allow a new application for the same course when a prior intake has ended or closed.
-- Still block duplicate applications for the same intake (unless rejected/deferred).

CREATE OR REPLACE FUNCTION public.create_application(
  p_real_email text,
  p_phone text,
  p_full_name text,
  p_date_of_birth date,
  p_gender text,
  p_country text,
  p_address text,
  p_state_region text,
  p_city text,
  p_qualification text,
  p_institution text,
  p_year_completed int,
  p_prior_experience text,
  p_course_id uuid,
  p_intake_id uuid,
  p_hybrid_attendance_confirmed boolean,
  p_internal_email_domain text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_stored_year text;
  v_seq bigint;
  v_reference text;
  v_internal_email text;
  v_app_id uuid;
  v_invoice_ref text;
  v_apf_seq bigint;
  v_fee_ghs numeric(10,2);
  v_invoice_id uuid;
  v_payment_type_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM applications a
    JOIN intakes i ON i.id = a.intake_id
    WHERE (a.real_email = p_real_email OR a.phone = p_phone)
      AND a.status NOT IN ('rejected', 'deferred')
      AND (
        a.intake_id = p_intake_id
        OR (
          a.course_id = p_course_id
          AND i.end_date >= CURRENT_DATE
          AND NOT i.is_closed
        )
      )
    LIMIT 1
  ) THEN
    RETURN json_build_object('error', 'duplicate');
  END IF;

  SELECT id INTO v_payment_type_id
  FROM payment_types
  WHERE slug = 'application_fee' AND is_active = true
  LIMIT 1;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'application_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE application_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'application_seq_year';
  END IF;

  v_seq := nextval('application_seq');
  v_reference := 'REVAPP' || v_year || lpad(v_seq::text, 5, '0');
  v_internal_email := v_reference || '@' || p_internal_email_domain;

  INSERT INTO applications (
    reference,
    internal_email,
    real_email,
    phone,
    full_name,
    date_of_birth,
    gender,
    country,
    address,
    state_region,
    city,
    qualification,
    institution,
    year_completed,
    prior_experience,
    course_id,
    intake_id,
    hybrid_attendance_confirmed
  ) VALUES (
    v_reference,
    v_internal_email,
    p_real_email,
    p_phone,
    p_full_name,
    p_date_of_birth,
    p_gender,
    p_country,
    p_address,
    p_state_region,
    p_city,
    p_qualification,
    p_institution,
    p_year_completed,
    p_prior_experience,
    p_course_id,
    p_intake_id,
    p_hybrid_attendance_confirmed
  )
  RETURNING id INTO v_app_id;

  SELECT value::numeric INTO v_fee_ghs
  FROM system_settings
  WHERE key = 'application_fee_ghs';

  IF v_fee_ghs IS NULL THEN
    v_fee_ghs := 0;
  END IF;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'invoice_apf_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE invoice_apf_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'invoice_apf_seq_year';
  END IF;

  v_apf_seq := nextval('invoice_apf_seq');
  v_invoice_ref := 'REVAPF' || v_year || lpad(v_apf_seq::text, 5, '0');

  INSERT INTO invoices (
    reference,
    type,
    application_id,
    amount_ghs,
    discount_ghs,
    total_ghs,
    status,
    payment_type_id
  ) VALUES (
    v_invoice_ref,
    'application_fee',
    v_app_id,
    v_fee_ghs,
    0,
    v_fee_ghs,
    'unpaid',
    v_payment_type_id
  )
  RETURNING id INTO v_invoice_id;

  RETURN json_build_object(
    'reference', v_reference,
    'application_id', v_app_id,
    'invoice_reference', v_invoice_ref,
    'invoice_id', v_invoice_id
  );
END;
$$;

-- Migration: 031_enrollment_letter_settings.sql

INSERT INTO system_settings (key, value)
VALUES
  ('enrollment_letter_signatory_name', 'Godfred Ferdinand Appiah'),
  ('enrollment_letter_signatory_title', 'President')
ON CONFLICT (key) DO NOTHING;

-- Migration: 032_level_up_and_communications.sql

-- SHS Level Up applications + senior high schools directory

CREATE TABLE senior_high_schools (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  name_norm  text NOT NULL,
  region     text,
  school_type text CHECK (school_type IN ('shs', 'technical', 'other')),
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX senior_high_schools_name_norm_idx ON senior_high_schools(name_norm);
CREATE INDEX senior_high_schools_name_norm_pattern_idx ON senior_high_schools(name_norm text_pattern_ops);

ALTER TABLE senior_high_schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY senior_high_schools_public_read ON senior_high_schools
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY senior_high_schools_admin_write ON senior_high_schools
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS application_channel text NOT NULL DEFAULT 'standard'
    CHECK (application_channel IN ('standard', 'level_up')),
  ADD COLUMN IF NOT EXISTS parent_guardian_whatsapp text,
  ADD COLUMN IF NOT EXISTS parent_guardian_email text,
  ADD COLUMN IF NOT EXISTS shs_school_id uuid REFERENCES senior_high_schools(id),
  ADD COLUMN IF NOT EXISTS shs_school_name_freeform text;

CREATE INDEX applications_channel_idx ON applications(application_channel);
CREATE INDEX applications_shs_school_id_idx ON applications(shs_school_id)
  WHERE shs_school_id IS NOT NULL;

-- Allow new automated notification event types
ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS notifications_log_event_type_check;
ALTER TABLE notifications_log ADD CONSTRAINT notifications_log_event_type_check
  CHECK (event_type IN (
    'application_received',
    'otp_sent',
    'status_changed',
    'app_fee_invoice_generated',
    'tuition_invoice_generated',
    'payment_confirmed',
    'enrollment_confirmed',
    'certificate_uploaded',
    'password_reset',
    'contact_form',
    'admission_letter_sent',
    'parent_application_submitted',
    'student_application_sms'
  ));

-- Migration: 033_seed_senior_high_schools.sql

-- Seed Ghana SHS / TVET schools (655 unique names from SHSTVET_school_names.txt)
-- Source: data/shs-tvet-school-names.txt

INSERT INTO senior_high_schools (name, name_norm, school_type, region)
VALUES
  ('ABAKRAMPA SENIOR HIGH/TECH SCHOOL', 'abakrampa senior high/tech school', 'technical', NULL),
  ('ABEASEMAN COMM. DAY SENIOR HIGH SCHOOL', 'abeaseman comm day senior high school', 'shs', NULL),
  ('ABETIFI PRESBY SENIOR HIGH SCHOOL', 'abetifi presby senior high school', 'shs', NULL),
  ('ABOR SENIOR HIGH SCHOOL', 'abor senior high school', 'shs', NULL),
  ('ABRAFI SENIOR HIGH SCHOOL', 'abrafi senior high school', 'shs', NULL),
  ('ABUADI/TSREFE SENIOR HIGH SCHOOL', 'abuadi/tsrefe senior high school', 'shs', NULL),
  ('ABURAMAN SENIOR HIGH SCHOOL', 'aburaman senior high school', 'shs', NULL),
  ('ABURI GIRLS SENIOR HIGH SCHOOL', 'aburi girls senior high school', 'shs', NULL),
  ('ABUTIA SENIOR HIGH/TCHNICAL SCHOOL', 'abutia senior high/tchnical school', 'technical', NULL),
  ('ACCRA GIRLS SENIOR HIGH SCHOOL', 'accra girls senior high school', 'shs', NULL),
  ('ACCRA SENIOR HIGH SCHOOL', 'accra senior high school', 'shs', NULL),
  ('ACCRA WESLEY GIRLS SENIOR HIGH SCHOOL', 'accra wesley girls senior high school', 'shs', NULL),
  ('ACHERENSUA SENIOR HIGH SCHOOL', 'acherensua senior high school', 'shs', NULL),
  ('ACHIASE SENIOR HIGH SCHOOL', 'achiase senior high school', 'shs', NULL),
  ('ACHIMOTA SENIOR HIGH SCHOOL', 'achimota senior high school', 'shs', NULL),
  ('ACHINAKROM SENIOR HIGH SCHOOL', 'achinakrom senior high school', 'shs', NULL),
  ('ADA SENIOR HIGH SCHOOL', 'ada senior high school', 'shs', NULL),
  ('ADA SENIOR HIGH/TECH SCHOOL', 'ada senior high/tech school', 'technical', NULL),
  ('ADAKLU SENIOR HIGH SCHOOL', 'adaklu senior high school', 'shs', NULL),
  ('ADANKWAMAN SENIOR HIGH SCHOOL', 'adankwaman senior high school', 'shs', NULL),
  ('ADANWOMASE SENIOR HIGH SCHOOL', 'adanwomase senior high school', 'shs', NULL),
  ('ADEISO PRESBY SENIOR HIGH SCHOOL', 'adeiso presby senior high school', 'shs', NULL),
  ('ADIDOME SENIOR HIGH SCHOOL', 'adidome senior high school', 'shs', NULL),
  ('ADIEMBRA SENIOR HIGH SCHOOL', 'adiembra senior high school', 'shs', NULL),
  ('ADJEN KOTOKU SENIOR HIGH SCHOOL', 'adjen kotoku senior high school', 'shs', NULL),
  ('ADJENA SENIOR HIGH/TECH SCHOOL', 'adjena senior high/tech school', 'technical', NULL),
  ('ADJOAFUA COMM. SENIOR HIGH SCHOOL', 'adjoafua comm senior high school', 'shs', NULL),
  ('ADOBEWORA COMM. SENIOR HIGH SCHOOL', 'adobewora comm senior high school', 'shs', NULL),
  ('ADONTEN SENIOR HIGH SCHOOL', 'adonten senior high school', 'shs', NULL),
  ('ADU GYAMFI SENIOR HIGH SCHOOL', 'adu gyamfi senior high school', 'shs', NULL),
  ('ADUGYAMA COMM. SENIOR HIGH SCHOOL', 'adugyama comm senior high school', 'shs', NULL),
  ('ADUMAN SENIOR HIGH SCHOOL', 'aduman senior high school', 'shs', NULL),
  ('ADVENTIST GIRLS SENIOR HIGH SCHOOL, NTONSO', 'adventist girls senior high school, ntonso', 'shs', NULL),
  ('ADVENTIST SENIOR HIGH SCHOOL, KUMASI', 'adventist senior high school, kumasi', 'shs', NULL),
  ('AFADJATO SENIOR HIGH/TECH SCHOOL', 'afadjato senior high/tech school', 'technical', NULL),
  ('AFIFE SENIOR HIGH TECH SCHOOL', 'afife senior high tech school', 'technical', NULL),
  ('AFIGYAMAN SENIOR HIGH SCHOOL', 'afigyaman senior high school', 'shs', NULL),
  ('AFUA KOBI AMPEM GIRLS'' SENIOR HIGH SCHOOL', 'afua kobi ampem girls senior high school', 'shs', NULL),
  ('AGATE COMM. SENIOR HIGH SCHOOL', 'agate comm senior high school', 'shs', NULL),
  ('AGGREY MEM. A.M.E.ZION SENIOR HIGH SCHOOL', 'aggrey mem amezion senior high school', 'shs', NULL),
  ('AGONA FANKOBAA SENIOR HIGH SCHOOL', 'agona fankobaa senior high school', 'shs', NULL),
  ('AGONA NAMONWORA COMM.SENIOR HIGH SCHOOL', 'agona namonwora commsenior high school', 'shs', NULL),
  ('AGONA SENIOR HIGH/TECH SCHOOL', 'agona senior high/tech school', 'technical', NULL),
  ('AGOTIME SENIOR HIGH SCHOOL', 'agotime senior high school', 'shs', NULL),
  ('AGRIC NZEMA SENIOR HIGH SCHOOL, KUMASI', 'agric nzema senior high school, kumasi', 'shs', NULL),
  ('AHAFOMAN SENIOR HIGH/TECH SCHOOL', 'ahafoman senior high/tech school', 'technical', NULL),
  ('AHAMANSU ISLAMIC SENIOR HIGH SCHOOL', 'ahamansu islamic senior high school', 'shs', NULL),
  ('AHANTAMAN GIRLS'' SENIOR HIGH SCHOOL', 'ahantaman girls senior high school', 'shs', NULL),
  ('AKATSI SENIOR HIGH/TECH SCHOOL', 'akatsi senior high/tech school', 'technical', NULL),
  ('AKIM ASAFO SENIOR HIGH SCHOOL', 'akim asafo senior high school', 'shs', NULL),
  ('AKIM SWEDRU SENIOR HIGH SCHOOL', 'akim swedru senior high school', 'shs', NULL),
  ('AKOKOASO SENIOR HIGH/TECH SCHOOL', 'akokoaso senior high/tech school', 'technical', NULL),
  ('AKOME SENIOR HIGH/TECH SCHOOL', 'akome senior high/tech school', 'technical', NULL),
  ('AKONTOMBRA SENIOR HIGH SCHOOL', 'akontombra senior high school', 'shs', NULL),
  ('AKPAFU SENIOR HIGH/TECH SCHOOL', 'akpafu senior high/tech school', 'technical', NULL),
  ('AKRO SENIOR HIGH/TECH SCHOOL', 'akro senior high/tech school', 'technical', NULL),
  ('AKROFUOM SENIOR HIGH/TECH SCHOOL', 'akrofuom senior high/tech school', 'technical', NULL),
  ('AKROSO SENIOR HIGH/TECH SCHOOL', 'akroso senior high/tech school', 'technical', NULL),
  ('AKUMADAN SENIOR HIGH SCHOOL', 'akumadan senior high school', 'shs', NULL),
  ('AKUSE METHODIST SENIOR HIGH/TECH SCHOOL', 'akuse methodist senior high/tech school', 'technical', NULL),
  ('AKWAMUMAN SENIOR HIGH SCHOOL', 'akwamuman senior high school', 'shs', NULL),
  ('AKWESI AWOBAA SENIOR HIGH SCHOOL', 'akwesi awobaa senior high school', 'shs', NULL),
  ('AKYIN SENIOR HIGH SCHOOL', 'akyin senior high school', 'shs', NULL),
  ('AL-AZARIYA ISLAMIC SENIOR HIGH SCHOOL, KUMASI', 'al-azariya islamic senior high school, kumasi', 'shs', NULL),
  ('ALAVANYO SENIOR HIGH/TECH SCHOOL', 'alavanyo senior high/tech school', 'technical', NULL),
  ('AMANIAMPONG SENIOR HIGH SCHOOL', 'amaniampong senior high school', 'shs', NULL),
  ('AMANTEN SENIOR HIGH SCHOOL', 'amanten senior high school', 'shs', NULL),
  ('AMASAMAN SENIOR HIGH/TECH SCHOOL', 'amasaman senior high/tech school', 'technical', NULL),
  ('AMENFIMAN SENIOR HIGH SCHOOL', 'amenfiman senior high school', 'shs', NULL),
  ('AMEYAW AKUMFI SENIOR HIGH/TECH SCHOOL', 'ameyaw akumfi senior high/tech school', 'technical', NULL),
  ('AMOANA PRASO SENIOR HIGH SCHOOL', 'amoana praso senior high school', 'shs', NULL),
  ('ANBARIYA SENIOR HIGH SCHOOL', 'anbariya senior high school', 'shs', NULL),
  ('ANFOEGA SENIOR HIGH SCHOOL', 'anfoega senior high school', 'shs', NULL),
  ('ANGLICAN SENIOR HIGH SCHOOL, KUMASI', 'anglican senior high school, kumasi', 'shs', NULL),
  ('ANLO AFIADENYIGBA SENIOR HIGH SCHOOL', 'anlo afiadenyigba senior high school', 'shs', NULL),
  ('ANLO AWOMEFIA SENIOR HIGH SCHOOL', 'anlo awomefia senior high school', 'shs', NULL),
  ('ANLO SENIOR HIGH SCHOOL', 'anlo senior high school', 'shs', NULL),
  ('ANNOR ADJAYE SENIOR HIGH SCHOOL', 'annor adjaye senior high school', 'shs', NULL),
  ('ANTOA SENIOR HIGH SCHOOL', 'antoa senior high school', 'shs', NULL),
  ('ANUM APAPAM COMM. DAY SENIOR HIGH SCHOOL', 'anum apapam comm day senior high school', 'shs', NULL)
ON CONFLICT (name_norm) DO NOTHING;

INSERT INTO senior_high_schools (name, name_norm, school_type, region)
VALUES
  ('ANUM PRESBY SENIOR HIGH SCHOOL', 'anum presby senior high school', 'shs', NULL),
  ('APAM SENIOR HIGH SCHOOL', 'apam senior high school', 'shs', NULL),
  ('APEDWA PRESBY SENIOR HIGH SCHOOL', 'apedwa presby senior high school', 'shs', NULL),
  ('APEGUSO SENIOR HIGH SCHOOL', 'apeguso senior high school', 'shs', NULL),
  ('APERADE SENIOR HIGH/TECH SCHOOL', 'aperade senior high/tech school', 'technical', NULL),
  ('ARCHBISHOP PORTER GIRLS SENIOR HIGH SCHOOL', 'archbishop porter girls senior high school', 'shs', NULL),
  ('ARMED FORCES SENIOR HIGH/TECH SCHOOL, KUMASI', 'armed forces senior high/tech school, kumasi', 'technical', NULL),
  ('ASAMANKESE SENIOR HIGH SCHOOL', 'asamankese senior high school', 'shs', NULL),
  ('ASANKRANGWA SENIOR HIGH SCHOOL', 'asankrangwa senior high school', 'shs', NULL),
  ('ASANKRANGWA SENIOR HIGH/TECH SCHOOL', 'asankrangwa senior high/tech school', 'technical', NULL),
  ('ASANTEMAN SENIOR HIGH SCHOOL', 'asanteman senior high school', 'shs', NULL),
  ('ASARE BEDIAKO SENIOR HIGH SCHOOL', 'asare bediako senior high school', 'shs', NULL),
  ('ASAWINSO SENIOR HIGH SCHOOL', 'asawinso senior high school', 'shs', NULL),
  ('ASESEWA SENIOR HIGH SCHOOL', 'asesewa senior high school', 'shs', NULL),
  ('ASHIAMAN SENIOR HIGH SCHOOL', 'ashiaman senior high school', 'shs', NULL),
  ('ASSIN MANSO SENIOR HIGH SCHOOL', 'assin manso senior high school', 'shs', NULL),
  ('ASSIN NORTH SENIOR HIGH/TECH SCHOOL', 'assin north senior high/tech school', 'technical', NULL),
  ('ASSIN NSUTA SENIOR HIGH SCHOOL', 'assin nsuta senior high school', 'shs', NULL),
  ('ASUKAWKAW SENIOR HIGH SCHOOL', 'asukawkaw senior high school', 'shs', NULL),
  ('ASUOM SENIOR HIGH SCHOOL', 'asuom senior high school', 'shs', NULL),
  ('ASUOSO COMM. SENIOR HIGH SCHOOL', 'asuoso comm senior high school', 'shs', NULL),
  ('ATEBUBU SENIOR HIGH SCHOOL', 'atebubu senior high school', 'shs', NULL),
  ('ATIAVI SENIOR HIGH/TECH SCHOOL', 'atiavi senior high/tech school', 'technical', NULL),
  ('ATTAFUAH SENIOR HIGH/TECH SCHOOL', 'attafuah senior high/tech school', 'technical', NULL),
  ('ATWEAMAN SENIOR HIGH SCHOOL', 'atweaman senior high school', 'shs', NULL),
  ('ATWIMA KWANWOMA SENIOR HIGH/TECH SCHOOL', 'atwima kwanwoma senior high/tech school', 'technical', NULL),
  ('AVATIME SENIOR HIGH SCHOOL', 'avatime senior high school', 'shs', NULL),
  ('AVE SENIOR HIGH SCHOOL', 'ave senior high school', 'shs', NULL),
  ('AVENOR SENIOR HIGH SCHOOL', 'avenor senior high school', 'shs', NULL),
  ('AVEYIME BATTOR SENIOR HIGH/TECH SCHOOL', 'aveyime battor senior high/tech school', 'technical', NULL),
  ('AWE SENIOR HIGH/TECH SCHOOL', 'awe senior high/tech school', 'technical', NULL),
  ('AWUDOME SENIOR HIGH SCHOOL', 'awudome senior high school', 'shs', NULL),
  ('AWUTU BAWJIASE COMM SENIOR HIGH SCHOOL', 'awutu bawjiase comm senior high school', 'shs', NULL),
  ('AWUTU WINTON SENIOR HIGH SCHOOL', 'awutu winton senior high school', 'shs', NULL),
  ('AXIM GIRLS SENIOR HIGH SCHOOL', 'axim girls senior high school', 'shs', NULL),
  ('AYANFURI SENIOR HIGH SCHOOL', 'ayanfuri senior high school', 'shs', NULL),
  ('AYIREBI SENIOR HIGH SCHOOL', 'ayirebi senior high school', 'shs', NULL),
  ('AZEEM-NAMOA SENIOR HIGH/TECH SCHOOL', 'azeem-namoa senior high/tech school', 'technical', NULL),
  ('BADU SENIOR HIGH/TECH SCHOOL', 'badu senior high/tech school', 'technical', NULL),
  ('BAGLO RIDGE SENIOR HIGH/TECH SCHOOL', 'baglo ridge senior high/tech school', 'technical', NULL),
  ('BAIDOO BONSOE SENIOR HIGH/TECH SCHOOL', 'baidoo bonsoe senior high/tech school', 'technical', NULL),
  ('BAMBOI COMM. SENIOR HIGH SCHOOL', 'bamboi comm senior high school', 'shs', NULL),
  ('BANDAMAN SENIOR HIGH SCHOOL', 'bandaman senior high school', 'shs', NULL),
  ('BANKA COMM. SENIOR HIGH SCHOOL', 'banka comm senior high school', 'shs', NULL),
  ('BANKOMAN SENIOR HIGH SCHOOL', 'bankoman senior high school', 'shs', NULL),
  ('BAREKESE SENIOR HIGH SCHOOL', 'barekese senior high school', 'shs', NULL),
  ('BASSA COMMUNITY SENIOR HIGH SCHOOL', 'bassa community senior high school', 'shs', NULL),
  ('BATTOR SENIOR HIGH SCHOOL', 'battor senior high school', 'shs', NULL),
  ('BAWKU SENIOR HIGH SCHOOL', 'bawku senior high school', 'shs', NULL),
  ('BAWKU SENIOR HIGH/TECH SCHOOL', 'bawku senior high/tech school', 'technical', NULL),
  ('BECHEM PRESBY SENIOR HIGH SCHOOL', 'bechem presby senior high school', 'shs', NULL),
  ('BENKUM SENIOR HIGH SCHOOL', 'benkum senior high school', 'shs', NULL),
  ('BENSO SENIOR HIGH/TECH SCHOOL', 'benso senior high/tech school', 'technical', NULL),
  ('BEPONG SENIOR HIGH SCHOOL', 'bepong senior high school', 'shs', NULL),
  ('BEPOSO SENIOR HIGH SCHOOL', 'beposo senior high school', 'shs', NULL),
  ('BEREKUM PRESBY SENIOR HIGH SCHOOL', 'berekum presby senior high school', 'shs', NULL),
  ('BEREKUM SENIOR HIGH SCHOOL', 'berekum senior high school', 'shs', NULL),
  ('BIA SENIOR HIGH/TECH SCHOOL', 'bia senior high/tech school', 'technical', NULL),
  ('BIAKOYE COMM. DAY SCHOOL', 'biakoye comm day school', 'shs', NULL),
  ('BIBIANI SENIOR HIGH/TECH SCHOOL', 'bibiani senior high/tech school', 'technical', NULL),
  ('BIMBILLA SENIOR HIGH SCHOOL', 'bimbilla senior high school', 'shs', NULL),
  ('BINDURI COMM. SENIOR HIGH SCHOOL', 'binduri comm senior high school', 'shs', NULL),
  ('BIRIFOH SENIOR HIGH SCHOOL', 'birifoh senior high school', 'shs', NULL),
  ('BISEASE SENIOR HIGH/COMM. SCHOOL', 'bisease senior high/comm school', 'shs', NULL),
  ('BOA-AMPONSEM SENIOR HIGH SCHOOL', 'boa-amponsem senior high school', 'shs', NULL),
  ('BOAKYE TROMO SENIOR HIGH/TECH SCHOOL', 'boakye tromo senior high/tech school', 'technical', NULL),
  ('BODI SENIOR HIGH SCHOOL', 'bodi senior high school', 'shs', NULL),
  ('BODOMASE SENIOR HIGH/TECH SCHOOL', 'bodomase senior high/tech school', 'technical', NULL),
  ('BODWESANGO SENIOR HIGH SCHOOL', 'bodwesango senior high school', 'shs', NULL),
  ('BOLE SENIOR HIGH SCHOOL', 'bole senior high school', 'shs', NULL),
  ('BOLGA GIRLS SENIOR HIGH SCHOOL', 'bolga girls senior high school', 'shs', NULL),
  ('BOLGA SHERIGU COMM. SENIOR HIGH SCHOOL', 'bolga sherigu comm senior high school', 'shs', NULL),
  ('BOLGATANGA SENIOR HIGH SCHOOL', 'bolgatanga senior high school', 'shs', NULL),
  ('BOMAA COMM. SENIOR HIGH SCHOOL', 'bomaa comm senior high school', 'shs', NULL),
  ('BOMPATA PRESBY SENIOR HIGH SCHOOL', 'bompata presby senior high school', 'shs', NULL),
  ('BOMPEH SENIOR HIGH./TECH SCHOOL', 'bompeh senior high/tech school', 'technical', NULL),
  ('BONGO SENIOR HIGH SCHOOL', 'bongo senior high school', 'shs', NULL),
  ('BONTRASE SENIOR HIGH TECH. SCHOOL', 'bontrase senior high tech school', 'technical', NULL),
  ('BONWIRE SENIOR HIGH/TECH SCHOOL', 'bonwire senior high/tech school', 'technical', NULL),
  ('BONZO-KAKU SENIOR HIGH SCHOOL', 'bonzo-kaku senior high school', 'shs', NULL)
ON CONFLICT (name_norm) DO NOTHING;

INSERT INTO senior_high_schools (name, name_norm, school_type, region)
VALUES
  ('BOSO SENIOR HIGH TECHNICAL SCHOOL', 'boso senior high technical school', 'technical', NULL),
  ('BOSOME SENIOR HIGH/TECH. SCHOOL', 'bosome senior high/tech school', 'technical', NULL),
  ('BOSOMTWE OYOKO COMM. SENIOR HIGH SCHOOL', 'bosomtwe oyoko comm senior high school', 'shs', NULL),
  ('BOWIRI COMM. DAY SCHOOL', 'bowiri comm day school', 'shs', NULL),
  ('BRAKWA SENIOR HIGH/TECH SCHOOL', 'brakwa senior high/tech school', 'technical', NULL),
  ('BREMAN ASIKUMA SENIOR HIGH SCHOOL', 'breman asikuma senior high school', 'shs', NULL),
  ('BUEMAN SENIOR HIGH SCHOOL', 'bueman senior high school', 'shs', NULL),
  ('BUIPE SENIOR HIGH SCHOOL', 'buipe senior high school', 'shs', NULL),
  ('BUNKPURUGU SENIOR HIGH/TECH SCHOOL', 'bunkpurugu senior high/tech school', 'technical', NULL),
  ('BUSINESS SENIOR HIGH SCHOOL, TAMALE', 'business senior high school, tamale', 'shs', NULL),
  ('BUSUNYA SENIOR HIGH SCHOOL', 'busunya senior high school', 'shs', NULL),
  ('CHEMU SENIOR HIGH/TECH SCHOOL', 'chemu senior high/tech school', 'technical', NULL),
  ('CHEREPONI SENIOR HIGH/TECH SCHOOL', 'chereponi senior high/tech school', 'technical', NULL),
  ('CHIANA SENIOR HIGH SCHOOL', 'chiana senior high school', 'shs', NULL),
  ('CHIRAA SENIOR HIGH SCHOOL', 'chiraa senior high school', 'shs', NULL),
  ('CHIRANO COMM. DAY SENIOR HIGH SCHOOL', 'chirano comm day senior high school', 'shs', NULL),
  ('CHRISTIAN METHODIST SENIOR HIGH SCHOOL', 'christian methodist senior high school', 'shs', NULL),
  ('CHURCH OF CHRIST SENIOR HIGH SCHOOL', 'church of christ senior high school', 'shs', NULL),
  ('COLLEGE OF MUSIC SENIOR HIGH SCHOOL, MOZANO', 'college of music senior high school, mozano', 'shs', NULL),
  ('COLLINS SENIOR HIGH/COMMERCIAL SCHOOL, AGOGO', 'collins senior high/commercial school, agogo', 'shs', NULL),
  ('DABOASE SENIOR HIGH/TECH SCHOOL', 'daboase senior high/tech school', 'technical', NULL),
  ('DABOYA COMM. DAY SCHOOL', 'daboya comm day school', 'shs', NULL),
  ('DADEASE AGRIC SENIOR HIGH SCHOOL', 'dadease agric senior high school', 'shs', NULL),
  ('DADIESO SENIOR HIGH SCHOOL', 'dadieso senior high school', 'shs', NULL),
  ('DAFFIAMAH SENIOR HIGH SCHOOL', 'daffiamah senior high school', 'shs', NULL),
  ('DAGBON STATE SENIOR HIGH/TECH SCHOOL', 'dagbon state senior high/tech school', 'technical', NULL),
  ('DAMONGO SENIOR HIGH SCHOOL', 'damongo senior high school', 'shs', NULL),
  ('DENYASEMAN CATH.SENIOR HIGH SCHOOL', 'denyaseman cathsenior high school', 'shs', NULL),
  ('DERMA COMM. DAY SENIOR HIGH SCHOOL', 'derma comm day senior high school', 'shs', NULL),
  ('DIABENE SENIOR HIGH/TECH SCHOOL', 'diabene senior high/tech school', 'technical', NULL),
  ('DIAMONO SENIOR HIGH SCHOOL', 'diamono senior high school', 'shs', NULL),
  ('DIASO SENIOR HIGH SCHOOL', 'diaso senior high school', 'shs', NULL),
  ('DIASPORA GIRLS'' SENIOR HIGH SCHOOL', 'diaspora girls senior high school', 'shs', NULL),
  ('DODI-PAPASE SENIOR HIGH/TECH SCHOOL', 'dodi-papase senior high/tech school', 'technical', NULL),
  ('DOFOR SENIOR HIGH SCHOOL', 'dofor senior high school', 'shs', NULL),
  ('DOMPOASE SENIOR HIGH SCHOOL', 'dompoase senior high school', 'shs', NULL),
  ('DONKORKROM AGRIC SENIOR HIGH SCHOOL', 'donkorkrom agric senior high school', 'shs', NULL),
  ('DORMAA SENIOR HIGH SCHOOL', 'dormaa senior high school', 'shs', NULL),
  ('DR. HILA LIMAN SENIOR HIGH SCHOOL', 'dr hila liman senior high school', 'shs', NULL),
  ('DROBO SENIOR HIGH SCHOOL', 'drobo senior high school', 'shs', NULL),
  ('DUADASO NO. 1 SENIOR HIGH/TECH SCHOOL', 'duadaso no 1 senior high/tech school', 'technical', NULL),
  ('DUNKWA SENIOR HIGH/TECH SCHOOL', 'dunkwa senior high/tech school', 'technical', NULL),
  ('DWAMENA AKENTEN SENIOR HIGH SCHOOL', 'dwamena akenten senior high school', 'shs', NULL),
  ('DZODZE PENYI SENIOR HIGH SCHOOL', 'dzodze penyi senior high school', 'shs', NULL),
  ('DZOLO SENIOR HIGH SCHOOL', 'dzolo senior high school', 'shs', NULL),
  ('E. P. AGRIC SENIOR HIGH/TECH SCHOOL', 'e p agric senior high/tech school', 'technical', NULL),
  ('E. P. SENIOR HIGH SCHOOL', 'e p senior high school', 'shs', NULL),
  ('EBENEZER SENIOR HIGH SCHOOL', 'ebenezer senior high school', 'shs', NULL),
  ('EDINAMAN SENIOR HIGH SCHOOL', 'edinaman senior high school', 'shs', NULL),
  ('EFFIDUASE SENIOR HIGH/COM SCHOOL', 'effiduase senior high/com school', 'shs', NULL),
  ('EFFIDUASE SENIOR HIGH/TECH SCHOOL', 'effiduase senior high/tech school', 'technical', NULL),
  ('EFFUTU SENIOR HIGH/TECH SCHOOL', 'effutu senior high/tech school', 'technical', NULL),
  ('EGUAFO-ABREM SENIOR HIGH SCHOOL', 'eguafo-abrem senior high school', 'shs', NULL),
  ('EJISU SENIOR HIGH/TECH SCHOOL', 'ejisu senior high/tech school', 'technical', NULL),
  ('EJISUMAN SENIOR HIGH SCHOOL', 'ejisuman senior high school', 'shs', NULL),
  ('EJURAMAN ANGLICAN SENIOR HIGH SCHOOL', 'ejuraman anglican senior high school', 'shs', NULL),
  ('EKUMFI T. I. AHMADIIYYA SENIOR HIGH SCHOOL', 'ekumfi t i ahmadiiyya senior high school', 'shs', NULL),
  ('ENYAN DENKYIRA SENIOR HIGH SCHOOL', 'enyan denkyira senior high school', 'shs', NULL),
  ('ENYAN MAIM COMM. DAY SENIOR HIGH SCHOOL', 'enyan maim comm day senior high school', 'shs', NULL),
  ('E.P.C. MAWUKO GIRLS SENIOR HIGH SCHOOL', 'epc mawuko girls senior high school', 'shs', NULL),
  ('EREMON SENIOR HIGH/TECH SCHOOL', 'eremon senior high/tech school', 'technical', NULL),
  ('ESAASE BONTEFUFUO SNR. HIGH/TECH. SCHOOL', 'esaase bontefufuo snr high/tech school', 'technical', NULL),
  ('ESIAMA SENIOR HIGH/TECH SCHOOL', 'esiama senior high/tech school', 'technical', NULL),
  ('FETTEHMAN SENIOR HIGH SCHOOL', 'fettehman senior high school', 'shs', NULL),
  ('FIASEMAN SENIOR HIGH SCHOOL', 'fiaseman senior high school', 'shs', NULL),
  ('FIJAI SENIOR HIGH SCHOOL', 'fijai senior high school', 'shs', NULL),
  ('FODOA COMM. SENIOR HIGH SCHOOL', 'fodoa comm senior high school', 'shs', NULL),
  ('FOMENA T.I. AHMAD SENIOR HIGH SCHOOL', 'fomena ti ahmad senior high school', 'shs', NULL),
  ('FORCES SENIOR HIGH/TECH SCHOOL, BURMA CAMP', 'forces senior high/tech school, burma camp', 'technical', NULL),
  ('FRAFRAHA COMM. SENIOR HIGH SCHOOL', 'frafraha comm senior high school', 'shs', NULL),
  ('FUMBISI SENIOR HIGH SCHOOL', 'fumbisi senior high school', 'shs', NULL),
  ('FUNSI SENIOR HIGH SCHOOL', 'funsi senior high school', 'shs', NULL),
  ('GAMBAGA GIRLS SENIOR HIGH SCHOOL', 'gambaga girls senior high school', 'shs', NULL),
  ('GAMBIGO COMM. DAY SENIOR HIGH SCHOOL', 'gambigo comm day senior high school', 'shs', NULL),
  ('GARU COMM. DAY SENIOR HIGH SCHOOL', 'garu comm day senior high school', 'shs', NULL),
  ('GHANA MUSLIM MISSION SENIOR HIGH SCHOOL', 'ghana muslim mission senior high school', 'shs', NULL),
  ('GHANA SENIOR HIGH SCHOOL, KOFORIDUA', 'ghana senior high school, koforidua', 'shs', NULL),
  ('GHANA SENIOR HIGH SCHOOL, TAMALE', 'ghana senior high school, tamale', 'shs', NULL),
  ('GHANA SENIOR HIGH/TECH SCHOOL', 'ghana senior high/tech school', 'technical', NULL),
  ('GHANATA SENIOR HIGH SCHOOL', 'ghanata senior high school', 'shs', NULL)
ON CONFLICT (name_norm) DO NOTHING;

INSERT INTO senior_high_schools (name, name_norm, school_type, region)
VALUES
  ('GOKA SENIOR HIGH/TECH SCHOOL', 'goka senior high/tech school', 'technical', NULL),
  ('GOMOA GYAMAN SENIOR HIGH SCHOOL', 'gomoa gyaman senior high school', 'shs', NULL),
  ('GOMOA SENIOR HIGH/TECH SCHOOL', 'gomoa senior high/tech school', 'technical', NULL),
  ('GOWRIE SENIOR HIGH/TECH SCHOOL', 'gowrie senior high/tech school', 'technical', NULL),
  ('GUAKRO EFFAH SENIOR HIGH SCHOOL', 'guakro effah senior high school', 'shs', NULL),
  ('GUSHEGU SENIOR HIGH SCHOOL', 'gushegu senior high school', 'shs', NULL),
  ('GWIRAMAN COMM.SENIOR HIGH SCHOOL', 'gwiraman commsenior high school', 'shs', NULL),
  ('GYAAMA PENSAN SENIOR HIGH/TECH SCHOOL', 'gyaama pensan senior high/tech school', 'technical', NULL),
  ('GYAASE COMMUNITY SENIOR HIGH SCHOOL', 'gyaase community senior high school', 'shs', NULL),
  ('GYAMFI KUMANINI SENIOR HIGH/TECH SCHOOL', 'gyamfi kumanini senior high/tech school', 'technical', NULL),
  ('GYARKO COMM. DAY SENIOR HIGH SCHOOL', 'gyarko comm day senior high school', 'shs', NULL),
  ('HALF ASSINI SENIOR HIGH SCHOOL', 'half assini senior high school', 'shs', NULL),
  ('HAN SENIOR HIGH SCHOOL', 'han senior high school', 'shs', NULL),
  ('H''MOUNT SINAI SENIOR HIGH SCHOOL', 'hmount sinai senior high school', 'shs', NULL),
  ('HOLY CHILD SCHOOL, CAPE COAST', 'holy child school, cape coast', 'shs', NULL),
  ('HOLY FAMILY SENIOR HIGH SCHOOL', 'holy family senior high school', 'shs', NULL),
  ('HOLY TRINITY SENIOR HIGH SCHOOL', 'holy trinity senior high school', 'shs', NULL),
  ('HUNI VALLEY SENIOR HIGH SCHOOL', 'huni valley senior high school', 'shs', NULL),
  ('HWIDIEM SENIOR HIGH SCHOOL', 'hwidiem senior high school', 'shs', NULL),
  ('ISLAMIC GIRLS SENIOR HIGH SCHOOL,SUHUM', 'islamic girls senior high school,suhum', 'shs', NULL),
  ('ISLAMIC SCIENCE SENIOR HIGH SCHOOL, TAMALE', 'islamic science senior high school, tamale', 'shs', NULL),
  ('ISLAMIC SENIOR HIGH SCHOOL, AMPABAME', 'islamic senior high school, ampabame', 'shs', NULL),
  ('ISLAMIC SENIOR HIGH SCHOOL, WA', 'islamic senior high school, wa', 'shs', NULL),
  ('ISTIQUAAMA SENIOR HIGH SCHOOL', 'istiquaama senior high school', 'shs', NULL),
  ('JACHIE PRAMSO SENIOR HIGH SCHOOL', 'jachie pramso senior high school', 'shs', NULL),
  ('JACOBU SENIOR HIGH/TECH. SCHOOL', 'jacobu senior high/tech school', 'technical', NULL),
  ('JAMIAT AL-HIDAYA ISLAMIC GIRLS SENIOR HIGH SCHOOL', 'jamiat al-hidaya islamic girls senior high school', 'shs', NULL),
  ('JANGA SENIOR HIGH/TECH SCHOOL', 'janga senior high/tech school', 'technical', NULL),
  ('J.E.A. MILLS SENIOR HIGH SCHOOL', 'jea mills senior high school', 'shs', NULL),
  ('JEMA SENIOR HIGH SCHOOL', 'jema senior high school', 'shs', NULL),
  ('JIM BOURTON MEM AGRIC. SENIOR HIGH SCHOOL', 'jim bourton mem agric senior high school', 'shs', NULL),
  ('JINIJINI SENIOR HIGH SCHOOL', 'jinijini senior high school', 'shs', NULL),
  ('JIRAPA SENIOR HIGH SCHOOL', 'jirapa senior high school', 'shs', NULL),
  ('JUABEN SENIOR HIGH SCHOOL', 'juaben senior high school', 'shs', NULL),
  ('JUABOSO SENIOR HIGH SCHOOL', 'juaboso senior high school', 'shs', NULL),
  ('JUASO SENIOR HIGH/TECH SCHOOL', 'juaso senior high/tech school', 'technical', NULL),
  ('JUBILEE SENIOR HIGH SCHOOL', 'jubilee senior high school', 'shs', NULL),
  ('JUKWA SENIOR HIGH SCHOOL', 'jukwa senior high school', 'shs', NULL),
  ('KADE SENIOR HIGH/TECH SCHOOL', 'kade senior high/tech school', 'technical', NULL),
  ('KADJEBI-ASATO SENIOR HIGH SCHOOL', 'kadjebi-asato senior high school', 'shs', NULL),
  ('KAJAJI SENIOR HIGH SCHOOL', 'kajaji senior high school', 'shs', NULL),
  ('KALEO SENIOR HIGH/TECH SCHOOL', 'kaleo senior high/tech school', 'technical', NULL),
  ('KALPOHIN SENIOR HIGH SCHOOL', 'kalpohin senior high school', 'shs', NULL),
  ('KANESHIE SENIOR HIGH/TECH SCHOOL', 'kaneshie senior high/tech school', 'technical', NULL),
  ('KANJAGA COMM. SENIOR HIGH SCHOOL', 'kanjaga comm senior high school', 'shs', NULL),
  ('KANTON SENIOR HIGH SCHOOL', 'kanton senior high school', 'shs', NULL),
  ('KARAGA SENIOR HIGH SCHOOL', 'karaga senior high school', 'shs', NULL),
  ('KASULIYILI SENIOR HIGH SCHOOL', 'kasuliyili senior high school', 'shs', NULL),
  ('KESSE BASAHYIA SENIOR HIGH SCHOOL', 'kesse basahyia senior high school', 'shs', NULL),
  ('KETA BUSINESS SENIOR HIGH SCHOOL', 'keta business senior high school', 'shs', NULL),
  ('KETA SENIOR HIGH/TECH SCHOOL', 'keta senior high/tech school', 'technical', NULL),
  ('KETE KRACHI SENIOR HIGH/TECH SCHOOL', 'kete krachi senior high/tech school', 'technical', NULL),
  ('KIBI SENIOR HIGH/TECH SCHOOL', 'kibi senior high/tech school', 'technical', NULL),
  ('KINBU SENIOR HIGH/TECH SCHOOL', 'kinbu senior high/tech school', 'technical', NULL),
  ('KINTAMPO SENIOR HIGH SCHOOL', 'kintampo senior high school', 'shs', NULL),
  ('KLIKOR SENIOR HIGH/TECH SCHOOL', 'klikor senior high/tech school', 'technical', NULL),
  ('KLO-AGOGO SENIOR HIGH SCHOOL', 'klo-agogo senior high school', 'shs', NULL),
  ('KNUST SENIOR HIGH SCHOOL', 'knust senior high school', 'shs', NULL),
  ('KO SENIOR HIGH SCHOOL', 'ko senior high school', 'shs', NULL),
  ('KOASE SENIOR HIGH/TECH SCHOOL', 'koase senior high/tech school', 'technical', NULL),
  ('KOFI ADJEI SENIOR HIGH/TECH SCHOOL', 'kofi adjei senior high/tech school', 'technical', NULL),
  ('KOFIASE ADVENTIST SENIOR HIGH/TECH. SCHOOL', 'kofiase adventist senior high/tech school', 'technical', NULL),
  ('KOFORIDUA SENIOR HIGH/TECH SCHOOL', 'koforidua senior high/tech school', 'technical', NULL),
  ('KOMENDA SENIOR HIGH/TECH SCHOOL', 'komenda senior high/tech school', 'technical', NULL),
  ('KONADU YIADOM CATHOLIC SENIOR HIGH SCHOOL', 'konadu yiadom catholic senior high school', 'shs', NULL),
  ('KONGO SENIOR HIGH SCHOOL', 'kongo senior high school', 'shs', NULL),
  ('KONONGO ODUMASE SENIOR HIGH SCHOOL', 'konongo odumase senior high school', 'shs', NULL),
  ('KPANDAI SENIOR HIGH SCHOOL', 'kpandai senior high school', 'shs', NULL),
  ('KPANDO SENIOR HIGH SCHOOL', 'kpando senior high school', 'shs', NULL),
  ('KPASSA SENIOR HIGH/TECH SCHOOL', 'kpassa senior high/tech school', 'technical', NULL),
  ('KPEDZE SENIOR HIGH SCHOOL', 'kpedze senior high school', 'shs', NULL),
  ('KPEVE SENIOR HIGH SCHOOL', 'kpeve senior high school', 'shs', NULL),
  ('KPONE COMM. SENIOR HIGH SCHOOL', 'kpone comm senior high school', 'shs', NULL),
  ('KRABOA-COALTAR PRESBY SENIOR HIGH SCHOOL HIGH/TECH.', 'kraboa-coaltar presby senior high school high/tech', 'technical', NULL),
  ('KRACHI SENIOR HIGH SCHOOL', 'krachi senior high school', 'shs', NULL),
  ('KROBEA ASANTE TECH/VOC SCHOOL', 'krobea asante tech/voc school', 'technical', NULL),
  ('KROBO COMM.SENIOR HIGH SCHOOL', 'krobo commsenior high school', 'shs', NULL),
  ('KROBO GIRLS SENIOR HIGH SCHOOL', 'krobo girls senior high school', 'shs', NULL),
  ('KUKUOM AGRIC SENIOR HIGH SCHOOL', 'kukuom agric senior high school', 'shs', NULL),
  ('KUMASI GIRLS SENIOR HIGH SCHOOL', 'kumasi girls senior high school', 'shs', NULL)
ON CONFLICT (name_norm) DO NOTHING;

INSERT INTO senior_high_schools (name, name_norm, school_type, region)
VALUES
  ('KUMASI SENIOR HIGH SCHOOL', 'kumasi senior high school', 'shs', NULL),
  ('KUMASI SENIOR HIGH/TECH SCHOOL', 'kumasi senior high/tech school', 'technical', NULL),
  ('KUMASI WESLEY GIRLS HIGH SCHOOL', 'kumasi wesley girls high school', 'shs', NULL),
  ('KUMBUNGU SENIOR HIGH SCHOOL', 'kumbungu senior high school', 'shs', NULL),
  ('KUROFA METHODIST SENIOR HIGH SCHOOL', 'kurofa methodist senior high school', 'shs', NULL),
  ('KUSANABA SENIOR HIGH SCHOOL', 'kusanaba senior high school', 'shs', NULL),
  ('KWABENG ANGLICAN SENIOR HIGH/TECH SCHOOL', 'kwabeng anglican senior high/tech school', 'technical', NULL),
  ('KWABENYA COMM. SENIOR HIGH SCHOOL', 'kwabenya comm senior high school', 'shs', NULL),
  ('KWABRE SENIOR HIGH SCHOOL', 'kwabre senior high school', 'shs', NULL),
  ('KWAHU RIDGE SENIOR HIGH SCHOOL', 'kwahu ridge senior high school', 'shs', NULL),
  ('KWAHU TAFO SENIOR HIGH SCHOOL', 'kwahu tafo senior high school', 'shs', NULL),
  ('KWAME DANSO SENIOR HIGH/TECH SCHOOL', 'kwame danso senior high/tech school', 'technical', NULL),
  ('KWANWOMA SENIOR HIGH SCHOOL', 'kwanwoma senior high school', 'shs', NULL),
  ('KWANYAKO SENIOR HIGH SCHOOL', 'kwanyako senior high school', 'shs', NULL),
  ('KWAOBAAH NYANOA COMM. SENIOR HIGH SCHOOL', 'kwaobaah nyanoa comm senior high school', 'shs', NULL),
  ('KWARTENG ANKOMAH SENIOR HIGH SCHOOL', 'kwarteng ankomah senior high school', 'shs', NULL),
  ('KWEGYIR AGGREY SENIOR HIGH SCHOOL', 'kwegyir aggrey senior high school', 'shs', NULL),
  ('KYABOBO GIRLS SENIOR HIGH SCHOOL', 'kyabobo girls senior high school', 'shs', NULL),
  ('LA PRESBY SENIOR HIGH SCHOOL', 'la presby senior high school', 'shs', NULL),
  ('LABONE SENIOR HIGH SCHOOL', 'labone senior high school', 'shs', NULL),
  ('LAMBUSSIE COMM SENIOR HIGH SCHOOL', 'lambussie comm senior high school', 'shs', NULL),
  ('LANGBINSI SENIOR HIGH TECHNICAL SCHOOL', 'langbinsi senior high technical school', 'technical', NULL),
  ('LASHIBI COMMUNITY SENIOR HIGH SCHOOL', 'lashibi community senior high school', 'shs', NULL),
  ('LASSIE-TUOLU SENIOR HIGH SCHOOL', 'lassie-tuolu senior high school', 'shs', NULL),
  ('LAWRA SENIOR HIGH SCHOOL', 'lawra senior high school', 'shs', NULL),
  ('LEKLEBI SENIOR HIGH SCHOOL', 'leklebi senior high school', 'shs', NULL),
  ('LIKPE SENIOR HIGH SCHOOL', 'likpe senior high school', 'shs', NULL),
  ('LOGGU COMM. DAY SCHOOL', 'loggu comm day school', 'shs', NULL),
  ('MAABANG SENIOR HIGH/TECH SCHOOL', 'maabang senior high/tech school', 'technical', NULL),
  ('MAAME KROBO COMM. SENIOR HIGH SCHOOL', 'maame krobo comm senior high school', 'shs', NULL),
  ('MAFI-KUMASI SENIOR HIGH/TECH SCHOOL', 'mafi-kumasi senior high/tech school', 'technical', NULL),
  ('MAMPONG/AKW SENIOR HIGH/TECH SCHOOL FOR THE DEAF', 'mampong/akw senior high/tech school for the deaf', 'technical', NULL),
  ('MANDO SENIOR HIGH/TECH SCHOOL', 'mando senior high/tech school', 'technical', NULL),
  ('MANGOASE SENIOR HIGH SCHOOL', 'mangoase senior high school', 'shs', NULL),
  ('MANKESSIM SENIOR HIGH/TECH SCHOOL', 'mankessim senior high/tech school', 'technical', NULL),
  ('MANKRANSO SENIOR HIGH SCHOOL', 'mankranso senior high school', 'shs', NULL),
  ('MANSEN SENIOR HIGH SCHOOL', 'mansen senior high school', 'shs', NULL),
  ('MANSO-ADUBIA SENIOR HIGH SCHOOL', 'manso-adubia senior high school', 'shs', NULL),
  ('MANSO-AMENFI COMM. DAY SENIOR HIGH SCHOOL', 'manso-amenfi comm day senior high school', 'shs', NULL),
  ('MANSOMAN SENIOR HIGH SCHOOL', 'mansoman senior high school', 'shs', NULL),
  ('MANYA KROBO SENIOR HIGH SCHOOL', 'manya krobo senior high school', 'shs', NULL),
  ('MAWULI SCHOOL, HO', 'mawuli school, ho', 'shs', NULL),
  ('MEM-CHEMFRE COMM. SENIOR HIGH SCHOOL', 'mem-chemfre comm senior high school', 'shs', NULL),
  ('MENJI SENIOR HIGH SCHOOL', 'menji senior high school', 'shs', NULL),
  ('MEPE ST. KIZITO SENIOR HIGH/TECH SCHOOL', 'mepe st kizito senior high/tech school', 'technical', NULL),
  ('METHODIST GIRLS SENIOR HIGH SCHOOL, MAMFE', 'methodist girls senior high school, mamfe', 'shs', NULL),
  ('METHODIST HIGH SCHOOL,SALTPOND', 'methodist high school,saltpond', 'shs', NULL),
  ('METHODIST SENIOR HIGH SCHOOL, SEKONDI', 'methodist senior high school, sekondi', 'shs', NULL),
  ('METHODIST SENIOR HIGH/TECH SCHOOL,BIADAN', 'methodist senior high/tech school,biadan', 'technical', NULL),
  ('MFANTSIMAN GIRLS SENIOR HIGH SCHOOL', 'mfantsiman girls senior high school', 'shs', NULL),
  ('MFANTSIPIM SCHOOL', 'mfantsipim school', 'shs', NULL),
  ('MIM SENIOR HIGH SCHOOL', 'mim senior high school', 'shs', NULL),
  ('MIRIGU COMMUNITY DAY SENIOR HIGH SCHOOL', 'mirigu community day senior high school', 'shs', NULL),
  ('MOKWAA SENIOR HIGH SCHOOL', 'mokwaa senior high school', 'shs', NULL),
  ('MOREE COMM. SENIOR HIGH SCHOOL', 'moree comm senior high school', 'shs', NULL),
  ('MOZANO SENIOR HIGH SCHOOL', 'mozano senior high school', 'shs', NULL),
  ('MPAHA COMMUNITY DAY SENIOR HIGH SCHOOL', 'mpaha community day senior high school', 'shs', NULL),
  ('MPASATIA SENIOR HIGH/TECH SCHOOL', 'mpasatia senior high/tech school', 'technical', NULL),
  ('MPOHOR SENIOR HIGH SCHOOL', 'mpohor senior high school', 'shs', NULL),
  ('MPRAESO SENIOR HIGH SCHOOL', 'mpraeso senior high school', 'shs', NULL),
  ('NABANGO SENIOR HIGH SCHOOL', 'nabango senior high school', 'shs', NULL),
  ('NAFANA SENIOR HIGH SCHOOL', 'nafana senior high school', 'shs', NULL),
  ('NAKPANDURI SENIOR HIGH SCHOOL', 'nakpanduri senior high school', 'shs', NULL),
  ('NALERIGU SENIOR HIGH SCHOOL', 'nalerigu senior high school', 'shs', NULL),
  ('NAMONG SENIOR HIGH/TECH SCHOOL', 'namong senior high/tech school', 'technical', NULL),
  ('NANA BRENTU SENIOR HIGH/TECH SCHOOL', 'nana brentu senior high/tech school', 'technical', NULL),
  ('NANDOM SENIOR HIGH SCHOOL', 'nandom senior high school', 'shs', NULL),
  ('NAVRONGO SENIOR HIGH SCHOOL', 'navrongo senior high school', 'shs', NULL),
  ('NCHUMURUMAN COMM. DAY SENIOR HIGH SCHOOL', 'nchumuruman comm day senior high school', 'shs', NULL),
  ('NDEWURA JAKPA SENIOR HIGH/TECH SCHOOL', 'ndewura jakpa senior high/tech school', 'technical', NULL),
  ('NEW ABIREM/AFOSU SENIOR HIGH SCHOOL', 'new abirem/afosu senior high school', 'shs', NULL),
  ('NEW EDUBIASE SENIOR HIGH SCHOOL', 'new edubiase senior high school', 'shs', NULL),
  ('NEW JUABEN SENIOR HIGH/COMM SCHOOL', 'new juaben senior high/comm school', 'shs', NULL),
  ('NEW KROKOMPE COMM. SENIOR HIGH SCHOOL', 'new krokompe comm senior high school', 'shs', NULL),
  ('NEW LONGORO COMM SENIOR HIGH SCHOOL (DEGA)', 'new longoro comm senior high school (dega)', 'shs', NULL),
  ('NEW NSUTAM SENIOR HIGH/TECH SCHOOL', 'new nsutam senior high/tech school', 'technical', NULL),
  ('NGLESHIE AMANFRO SENIOR HIGH SCHOOL', 'ngleshie amanfro senior high school', 'shs', NULL),
  ('NIFA SENIOR HIGH SCHOOL', 'nifa senior high school', 'shs', NULL),
  ('NINGO SENIOR HIGH SCHOOL', 'ningo senior high school', 'shs', NULL),
  ('NKAWIE SENIOR HIGH/TECH SCHOOL', 'nkawie senior high/tech school', 'technical', NULL)
ON CONFLICT (name_norm) DO NOTHING;

INSERT INTO senior_high_schools (name, name_norm, school_type, region)
VALUES
  ('NKAWKAW SENIOR HIGH SCHOOL', 'nkawkaw senior high school', 'shs', NULL),
  ('NKENKANSU COMMUNITY SENIOR HIGH SCHOOL', 'nkenkansu community senior high school', 'shs', NULL),
  ('NKONYA SENIOR HIGH SCHOOL', 'nkonya senior high school', 'shs', NULL),
  ('NKORANMAN SENIOR HIGH SCHOOL', 'nkoranman senior high school', 'shs', NULL),
  ('NKORANZA SENIOR HIGH/TECH SCHOOL', 'nkoranza senior high/tech school', 'technical', NULL),
  ('NKRANKWANTA COMM SENIOR HIGH SCHOOL', 'nkrankwanta comm senior high school', 'shs', NULL),
  ('NKROFUL AGRIC. SENIOR HIGH SCHOOL', 'nkroful agric senior high school', 'shs', NULL),
  ('NKWANTA COMM SENIOR HIGH SCHOOL', 'nkwanta comm senior high school', 'shs', NULL),
  ('NKWANTA SENIOR HIGH SCHOOL', 'nkwanta senior high school', 'shs', NULL),
  ('NKWATIA PRESBY SENIOR HIGH/COMM SCHOOL', 'nkwatia presby senior high/comm school', 'shs', NULL),
  ('NKYERAA SENIOR HIGH SCHOOL', 'nkyeraa senior high school', 'shs', NULL),
  ('NORTHERN SCHOOL OF BUSINESS', 'northern school of business', 'shs', NULL),
  ('NORTHERN STAR SENIOR HIGH SCHOOL', 'northern star senior high school', 'shs', NULL),
  ('NOTRE DAME GIRLS SENIOR HIGH SCHOOL, SUNYANI', 'notre dame girls senior high school, sunyani', 'shs', NULL),
  ('NOTRE DAME SEM/ SENIOR HIGH SCHOOL NAVRONGO', 'notre dame sem/ senior high school navrongo', 'shs', NULL),
  ('NSABA PRESBY SENIOR HIGH SCHOOL', 'nsaba presby senior high school', 'shs', NULL),
  ('NSAWAM SENIOR HIGH SCHOOL', 'nsawam senior high school', 'shs', NULL),
  ('NSAWKAW STATE SENIOR HIGH SCHOOL', 'nsawkaw state senior high school', 'shs', NULL),
  ('NSAWORA EDUMAFA COMM. SENIOR HIGH SCHOOL', 'nsawora edumafa comm senior high school', 'shs', NULL),
  ('NSEIN SENIOR HIGH SCHOOL', 'nsein senior high school', 'shs', NULL),
  ('NSUTAMAN CATH. SENIOR HIGH SCHOOL', 'nsutaman cath senior high school', 'shs', NULL),
  ('NTRUBOMAN SENIOR HIGH SCHOOL', 'ntruboman senior high school', 'shs', NULL),
  ('NUNGUA SENIOR HIGH SCHOOL', 'nungua senior high school', 'shs', NULL),
  ('NURU-AMEEN ISLAMIC SENIOR HIGH SCHOOL, ASEWASE', 'nuru-ameen islamic senior high school, asewase', 'shs', NULL),
  ('NYAKROM SENIOR HIGH TECH SCHOOL', 'nyakrom senior high tech school', 'technical', NULL),
  ('NYANKUMASE AHENKRO SENIOR HIGH SCHOOL', 'nyankumase ahenkro senior high school', 'shs', NULL),
  ('NYINAHIN CATH. SENIOR HIGH SCHOOL', 'nyinahin cath senior high school', 'shs', NULL),
  ('OBIRI YEBOAH SENIOR HIGH/TECHNICAL SCHOOL', 'obiri yeboah senior high/technical school', 'technical', NULL),
  ('OBRACHIRE SENIOR HIGH/TECH SCHOOL', 'obrachire senior high/tech school', 'technical', NULL),
  ('OBUASI SENIOR HIGH/TECH SCHOOL', 'obuasi senior high/tech school', 'technical', NULL),
  ('ODA SENIOR HIGH SCHOOL', 'oda senior high school', 'shs', NULL),
  ('ODOBEN SENIOR HIGH SCHOOL', 'odoben senior high school', 'shs', NULL),
  ('ODOMASEMAN SENIOR HIGH SCHOOL', 'odomaseman senior high school', 'shs', NULL),
  ('ODORGONNO SENIOR HIGH SCHOOL', 'odorgonno senior high school', 'shs', NULL),
  ('ODUPONG COMM. DAY SCHOOL', 'odupong comm day school', 'shs', NULL),
  ('OFOASE KOKOBEN SENIOR HIGH SCHOOL', 'ofoase kokoben senior high school', 'shs', NULL),
  ('OFOASE SENIOR HIGH/TECH SCHOOL', 'ofoase senior high/tech school', 'technical', NULL),
  ('OFORI PANIN SENIOR HIGH SCHOOL', 'ofori panin senior high school', 'shs', NULL),
  ('OGUAA SENIOR HIGH/TECH SCHOOL', 'oguaa senior high/tech school', 'technical', NULL),
  ('OGYEEDOM COMM SENIOR HIGH/TECH SCHOOL', 'ogyeedom comm senior high/tech school', 'technical', NULL),
  ('OKADJAKROM SENIOR HIGH/TECH SCHOOL', 'okadjakrom senior high/tech school', 'technical', NULL),
  ('OKOMFO ANOKYE SENIOR HIGH SCHOOL', 'okomfo anokye senior high school', 'shs', NULL),
  ('OKUAPEMAN SENIOR HIGH SCHOOL', 'okuapeman senior high school', 'shs', NULL),
  ('OLA GIRLS SENIOR HIGH SCHOOL, HO', 'ola girls senior high school, ho', 'shs', NULL),
  ('OLA GIRLS SENIOR HIGH SCHOOL, KENYASI', 'ola girls senior high school, kenyasi', 'shs', NULL),
  ('O.L.L. GIRLS SENIOR HIGH SCHOOL', 'oll girls senior high school', 'shs', NULL),
  ('ONWE SENIOR HIGH SCHOOL', 'onwe senior high school', 'shs', NULL),
  ('OPOKU AGYEMAN SENIOR HIGH/TECH SCHOOL', 'opoku agyeman senior high/tech school', 'technical', NULL),
  ('OPOKU WARE SENIOR HIGH SCHOOL', 'opoku ware senior high school', 'shs', NULL),
  ('OPPONG MEM. SENIOR HIGH SCHOOL', 'oppong mem senior high school', 'shs', NULL),
  ('O''REILLY SENIOR HIGH SCHOOL', 'oreilly senior high school', 'shs', NULL),
  ('OSEI ADUTWUM SENIOR HIGH SCHOOL', 'osei adutwum senior high school', 'shs', NULL),
  ('OSEI BONSU SENIOR HIGH SCHOOL', 'osei bonsu senior high school', 'shs', NULL),
  ('OSEI KYERETWIE SENIOR HIGH SCHOOL', 'osei kyeretwie senior high school', 'shs', NULL),
  ('OSEI TUTU SENIOR HIGH SCHOOL, AKROPONG', 'osei tutu senior high school, akropong', 'shs', NULL),
  ('OSINO PRESBY SENIOR HIGH/TECH SCHOOL', 'osino presby senior high/tech school', 'technical', NULL),
  ('OSUDOKU SENIOR HIGH/TECH SCHOOL', 'osudoku senior high/tech school', 'technical', NULL),
  ('OTI BOATENG SENIOR HIGH SCHOOL', 'oti boateng senior high school', 'shs', NULL),
  ('OTI SENIOR HIGH/TECH SCHOOL', 'oti senior high/tech school', 'technical', NULL),
  ('OUR LADY OF MERCY SENIOR HIGH SCHOOL', 'our lady of mercy senior high school', 'shs', NULL),
  ('OUR LADY OF MOUNT CARMEL GIRLS SENIOR HIGH SCHOOL, TECHIMAN', 'our lady of mount carmel girls senior high school, techiman', 'shs', NULL),
  ('OUR LADY OF PROVIDENCE SENIOR HIGH SCHOOL', 'our lady of providence senior high school', 'shs', NULL),
  ('OWERRIMAN SENIOR HIGH SCHOOL', 'owerriman senior high school', 'shs', NULL),
  ('OYOKO METHODIST SENIOR HIGH SCHOOL', 'oyoko methodist senior high school', 'shs', NULL),
  ('PAGA SENIOR HIGH SCHOOL', 'paga senior high school', 'shs', NULL),
  ('PARKOSO COMM. SENIOR HIGH SCHOOL', 'parkoso comm senior high school', 'shs', NULL),
  ('PEKI SENIOR HIGH SCHOOL', 'peki senior high school', 'shs', NULL),
  ('PEKI SENIOR HIGH/TECHNICAL SCHOOL', 'peki senior high/technical school', 'technical', NULL),
  ('PENTECOST SENIOR HIGH SCHOOL, KUMASI', 'pentecost senior high school, kumasi', 'shs', NULL),
  ('PENTECOST SENIOR HIGH SCHOOL,KOFORIDUA', 'pentecost senior high school,koforidua', 'shs', NULL),
  ('PIINA SENIOR HIGH SCHOOL', 'piina senior high school', 'shs', NULL),
  ('PONG-TAMALE SENIOR HIGH SCHOOL', 'pong-tamale senior high school', 'shs', NULL),
  ('POPE JOHN SENIOR HIGH & MIN. SEM. SCHOOL, KOFORIDUA', 'pope john senior high & min sem school, koforidua', 'shs', NULL),
  ('POTSIN T.I. AHM. SENIOR HIGH SCHOOL', 'potsin ti ahm senior high school', 'shs', NULL),
  ('PRAMPRAM SENIOR HIGH SCHOOL', 'prampram senior high school', 'shs', NULL),
  ('PRESBY BOYS SENIOR HIGH SCHOOL, LEGON', 'presby boys senior high school, legon', 'shs', NULL),
  ('PRESBY SENIOR HIGH SCHOOL, BEGORO', 'presby senior high school, begoro', 'shs', NULL),
  ('PRESBY SENIOR HIGH SCHOOL, MAMPONG AKWAPIM', 'presby senior high school, mampong akwapim', 'shs', NULL),
  ('PRESBY SENIOR HIGH SCHOOL, OSU', 'presby senior high school, osu', 'shs', NULL),
  ('PRESBY SENIOR HIGH SCHOOL, SUHUM', 'presby senior high school, suhum', 'shs', NULL)
ON CONFLICT (name_norm) DO NOTHING;

INSERT INTO senior_high_schools (name, name_norm, school_type, region)
VALUES
  ('PRESBY SENIOR HIGH SCHOOL, TAMALE', 'presby senior high school, tamale', 'shs', NULL),
  ('PRESBY SENIOR HIGH SCHOOL, TEMA', 'presby senior high school, tema', 'shs', NULL),
  ('PRESBY SENIOR HIGH SCHOOL, TESHIE', 'presby senior high school, teshie', 'shs', NULL),
  ('PRESBY SENIOR HIGH/TECH SCHOOL, ABURI', 'presby senior high/tech school, aburi', 'technical', NULL),
  ('PRESBY SENIOR HIGH/TECH SCHOOL, ADUKROM', 'presby senior high/tech school, adukrom', 'technical', NULL),
  ('PRESBY SENIOR HIGH/TECH SCHOOL, KWAMANG', 'presby senior high/tech school, kwamang', 'technical', NULL),
  ('PRESBY SENIOR HIGH/TECH SCHOOL, LARTEH', 'presby senior high/tech school, larteh', 'technical', NULL),
  ('PRESTEA SENIOR HIGH/TECH SCHOOL', 'prestea senior high/tech school', 'technical', NULL),
  ('QUEEN OF PEACE SENIOR HIGH SCHOOL, NADOWLI', 'queen of peace senior high school, nadowli', 'shs', NULL),
  ('QUEENS GIRLS'' SENIOR HIGH SCHOOL, SEFWI AWHIASO', 'queens girls senior high school, sefwi awhiaso', 'shs', NULL),
  ('SABOBA E.P. SENIOR HIGH SCHOOL', 'saboba ep senior high school', 'shs', NULL),
  ('SABRONUM METHODIST SENIOR HIGH/TECH SCHOOL', 'sabronum methodist senior high/tech school', 'technical', NULL),
  ('SACRED HEART SENIOR HIGH SCHOOL, NSOATRE', 'sacred heart senior high school, nsoatre', 'shs', NULL),
  ('SAKAFIA ISLAMIC SENIOR HIGH SCHOOL', 'sakafia islamic senior high school', 'shs', NULL),
  ('SAKOGU SENIOR HIGH/TECH SCHOOL', 'sakogu senior high/tech school', 'technical', NULL),
  ('SALAGA SENIOR HIGH SCHOOL', 'salaga senior high school', 'shs', NULL),
  ('SALAGA T.I. AHMAD SENIOR HIGH SCHOOL', 'salaga ti ahmad senior high school', 'shs', NULL),
  ('SALVATION ARMY SENIOR HIGH SCHOOL, ABOABO DORMAA', 'salvation army senior high school, aboabo dormaa', 'shs', NULL),
  ('SALVATION ARMY SENIOR HIGH SCHOOL, AKIM WENCHI', 'salvation army senior high school, akim wenchi', 'shs', NULL),
  ('SAMUEL OTU PRESBY SENIOR HIGH SCHOOL', 'samuel otu presby senior high school', 'shs', NULL),
  ('SANDEMA SENIOR HIGH SCHOOL', 'sandema senior high school', 'shs', NULL),
  ('SANDEMA SENIOR HIGH/TECH SCHOOL', 'sandema senior high/tech school', 'technical', NULL),
  ('SANG COMM. DAY SCHOOL', 'sang comm day school', 'shs', NULL),
  ('SANKOR COMM. DAY SENIOR HIGH SCHOOL', 'sankor comm day senior high school', 'shs', NULL),
  ('SANKORE SENIOR HIGH SCHOOL', 'sankore senior high school', 'shs', NULL),
  ('SAVELUGU SENIOR HIGH SCHOOL', 'savelugu senior high school', 'shs', NULL),
  ('SAVIOUR SENIOR HIGH SCHOOL, OSIEM', 'saviour senior high school, osiem', 'shs', NULL),
  ('SAWLA SENIOR HIGH SCHOOL', 'sawla senior high school', 'shs', NULL),
  ('S.D.A. SENIOR HIGH SCHOOL, AGONA', 'sda senior high school, agona', 'shs', NULL),
  ('S.D.A. SENIOR HIGH SCHOOL, BEKWAI', 'sda senior high school, bekwai', 'shs', NULL),
  ('S.D.A SENIOR HIGH SCHOOL, KOFORIDUA', 'sda senior high school, koforidua', 'shs', NULL),
  ('S.D.A SENIOR HIGH SCHOOL, SUNYANI', 'sda senior high school, sunyani', 'shs', NULL),
  ('S.D.A. SENIOR HIGHSCHOOL, AKIM SEKYERE', 'sda senior highschool, akim sekyere', 'shs', NULL),
  ('SEFWI BEKWAI SENIOR HIGH SCHOOL', 'sefwi bekwai senior high school', 'shs', NULL),
  ('SEFWI-WIAWSO SENIOR HIGH SCHOOL', 'sefwi-wiawso senior high school', 'shs', NULL),
  ('SEFWI-WIAWSO SENIOR HIGH/TECH SCHOOL', 'sefwi-wiawso senior high/tech school', 'technical', NULL),
  ('SEKYEDUMASE SENIOR HIGH/TECH SCHOOL', 'sekyedumase senior high/tech school', 'technical', NULL),
  ('SENYA SENIOR HIGH SCHOOL', 'senya senior high school', 'shs', NULL),
  ('SERWAA KESSE GIRLS SENIOR HIGH SCHOOL', 'serwaa kesse girls senior high school', 'shs', NULL),
  ('SERWAAH NYARKO GIRLS'' SENIOR HIGH SCHOOL', 'serwaah nyarko girls senior high school', 'shs', NULL),
  ('SHAMA SENIOR HIGH SCHOOL', 'shama senior high school', 'shs', NULL),
  ('SHIA SENIOR HIGHTECHNICAL SCHOOL', 'shia senior hightechnical school', 'technical', NULL),
  ('SIDDIQ SENIOR HIGH SCHOOL', 'siddiq senior high school', 'shs', NULL),
  ('SIMMS SENIOR HIGH/COM. SCHOOL', 'simms senior high/com school', 'shs', NULL),
  ('SIRIGU INTEGRATED SENIOR HIGH SCHOOL', 'sirigu integrated senior high school', 'shs', NULL),
  ('SOGAKOPE SENIOR HIGH SCHOOL', 'sogakope senior high school', 'shs', NULL),
  ('SOKODE SENIOR HIGH/TECH SCHOOL', 'sokode senior high/tech school', 'technical', NULL),
  ('SOMBO SENIOR HIGH SCHOOL', 'sombo senior high school', 'shs', NULL),
  ('SOME SENIOR HIGH SCHOOL', 'some senior high school', 'shs', NULL),
  ('SPIRITAN SENIOR HIGH SCHOOL', 'spiritan senior high school', 'shs', NULL),
  ('ST. ANN''S GIRLS SENIOR HIGH SCHOOL, SAMPA', 'st anns girls senior high school, sampa', 'shs', NULL),
  ('ST. ANTHONY OF PADUA SENIOR HIGH/TECH SCHOOL', 'st anthony of padua senior high/tech school', 'technical', NULL),
  ('ST. AUGUSTINE SENIOR HIGH SCHOOL, NSAPOR- BEREKUM', 'st augustine senior high school, nsapor- berekum', 'shs', NULL),
  ('ST. AUGUSTINE SENIOR HIGH/TECH SCHOOL, SAAN CHARIKPONG', 'st augustine senior high/tech school, saan charikpong', 'technical', NULL),
  ('ST. AUGUSTINE''S SENIOR HIGH SCHOOL, BOGOSO', 'st augustines senior high school, bogoso', 'shs', NULL),
  ('ST. CATHERINE GIRLS SENIOR HIGH SCHOOL', 'st catherine girls senior high school', 'shs', NULL),
  ('ST. CHARLES SENIOR HIGH SCHOOL, TAMALE', 'st charles senior high school, tamale', 'shs', NULL),
  ('ST. DOMINIC''S SENIOR HIGH/TECH SCHOOL, PEPEASE', 'st dominics senior high/tech school, pepease', 'technical', NULL),
  ('ST. FIDELIS SENIOR HIGH/TECH SCHOOL', 'st fidelis senior high/tech school', 'technical', NULL),
  ('ST. FRANCIS GIRLS SENIOR HIGH SCHOOL, JIRAPA', 'st francis girls senior high school, jirapa', 'shs', NULL),
  ('ST. FRANCIS SEMINARY/SENIOR HIGH SCHOOL, BUOYEM', 'st francis seminary/senior high school, buoyem', 'shs', NULL),
  ('ST. FRANCIS SENIOR HIGH/TECH SCHOOL, AKIM ODA', 'st francis senior high/tech school, akim oda', 'technical', NULL),
  ('ST. GEORGE''S SENIOR HIGH TECH SCHOOL', 'st georges senior high tech school', 'technical', NULL),
  ('ST. GREGORY CATHOLIC SENIOR HIGH SCHOOL', 'st gregory catholic senior high school', 'shs', NULL),
  ('ST. HUBERT SEM/SENIOR HIGH SCHOOL, KUMASI', 'st hubert sem/senior high school, kumasi', 'shs', NULL),
  ('ST. JAMES SEM & SENIOR HIGH SCHOOL, ABESIM', 'st james sem & senior high school, abesim', 'shs', NULL),
  ('ST. JEROME SENIOR HIGH SCHOOL, ABOFOUR', 'st jerome senior high school, abofour', 'shs', NULL),
  ('ST. JOHN''S GRAMMAR SENIOR HIGH SCHOOL', 'st johns grammar senior high school', 'shs', NULL),
  ('ST. JOHN''S INTEGRATED SENIOR HIGH/TECH SCHOOL', 'st johns integrated senior high/tech school', 'technical', NULL),
  ('ST. JOHN''S SENIOR HIGH SCHOOL, SEKONDI', 'st johns senior high school, sekondi', 'shs', NULL),
  ('ST. JOSEPH SEM/SENIOR HIGH SCHOOL, MAMPONG', 'st joseph sem/senior high school, mampong', 'shs', NULL),
  ('ST. JOSEPH SENIOR HIGH SCHOOL, SEFWI WIAWSO', 'st joseph senior high school, sefwi wiawso', 'shs', NULL),
  ('ST. JOSEPH SENIOR HIGH/TECH SCHOOL, AHWIREN', 'st joseph senior high/tech school, ahwiren', 'technical', NULL),
  ('ST. LOUIS SENIOR HIGH SCHOOL, KUMASI', 'st louis senior high school, kumasi', 'shs', NULL),
  ('ST. MARGARET MARY SENIOR HIGH/TECH SCHOOL', 'st margaret mary senior high/tech school', 'technical', NULL),
  ('ST. MARTIN''S SENIOR HIGH SCHOOL, NSAWAM', 'st martins senior high school, nsawam', 'shs', NULL),
  ('ST. MARY''S BOYS'' SENIOR HIGH SCHOOL, APOWA', 'st marys boys senior high school, apowa', 'shs', NULL),
  ('ST. MARY''S SEM.& SENIOR HIGH SCHOOL, LOLOBI', 'st marys sem& senior high school, lolobi', 'shs', NULL),
  ('ST. MARY''S SENIOR HIGH SCHOOL, KORLE GONNO', 'st marys senior high school, korle gonno', 'shs', NULL),
  ('ST. MICHAEL''S SENIOR HIGH SCHOOL, AHENKRO', 'st michaels senior high school, ahenkro', 'shs', NULL)
ON CONFLICT (name_norm) DO NOTHING;

INSERT INTO senior_high_schools (name, name_norm, school_type, region)
VALUES
  ('ST. MICHAEL''S SENIOR HIGH SCHOOL, AKOASE (NKAWKAW)', 'st michaels senior high school, akoase (nkawkaw)', 'shs', NULL),
  ('ST. MONICA''S SENIOR HIGH SCHOOL, MAMPONG', 'st monicas senior high school, mampong', 'shs', NULL),
  ('ST. PAUL''S SENIOR HIGH SCHOOL, ASAKRAKA KWAHU', 'st pauls senior high school, asakraka kwahu', 'shs', NULL),
  ('ST. PAUL''S SENIOR HIGH SCHOOL, DENU', 'st pauls senior high school, denu', 'shs', NULL),
  ('ST. PAUL''S TECH. SCHOOL', 'st pauls tech school', 'technical', NULL),
  ('ST. PETER''S SENIOR HIGH SCHOOL, NKWATIA', 'st peters senior high school, nkwatia', 'shs', NULL),
  ('ST. ROSE''S SENIOR HIGH SCHOOL, AKWATIA', 'st roses senior high school, akwatia', 'shs', NULL),
  ('ST. SEBASTIAN CATH. SENIOR HIGH SCHOOL', 'st sebastian cath senior high school', 'shs', NULL),
  ('ST. STEPHEN''S PRESBY SENIOR HIGH/TECH SCHOOL, ASIAKWA', 'st stephens presby senior high/tech school, asiakwa', 'technical', NULL),
  ('ST. THOMAS AQUINAS SENIOR HIGH SCHOOL, CANTOMENTS', 'st thomas aquinas senior high school, cantoments', 'shs', NULL),
  ('ST. THOMAS SENIOR HIGH/TECH SCHOOL', 'st thomas senior high/tech school', 'technical', NULL),
  ('SUHUM SENIOR HIGH/TECH SCHOOL', 'suhum senior high/tech school', 'technical', NULL),
  ('SUMAMAN SENIOR HIGH SCHOOL', 'sumaman senior high school', 'shs', NULL),
  ('SUNYANI SENIOR HIGH SCHOOL', 'sunyani senior high school', 'shs', NULL),
  ('SWEDRU SENIOR HIGH SCHOOL', 'swedru senior high school', 'shs', NULL),
  ('T. I. AHMADIYYA GIRL''S SENIOR HIGH SCHOOL, ASOKORE', 't i ahmadiyya girls senior high school, asokore', 'shs', NULL),
  ('T. I. AHMADIYYA SENIOR HIGH SCHOOL, KUMASI', 't i ahmadiyya senior high school, kumasi', 'shs', NULL),
  ('T. I. AHMADIYYA SENIOR HIGH SCHOOL, WA', 't i ahmadiyya senior high school, wa', 'shs', NULL),
  ('TAKORADI SENIOR HIGH SCHOOL', 'takoradi senior high school', 'shs', NULL),
  ('TAKPO SENIOR HIGH SCHOOL', 'takpo senior high school', 'shs', NULL),
  ('TAMALE GIRLS SENIOR HIGH SCHOOL', 'tamale girls senior high school', 'shs', NULL),
  ('TAMALE SENIOR HIGH SCHOOL', 'tamale senior high school', 'shs', NULL),
  ('TANYIGBE SENIOR HIGH SCHOOL', 'tanyigbe senior high school', 'shs', NULL),
  ('TAPAMAN SENIOR HIGH/TECH SCHOOL', 'tapaman senior high/tech school', 'technical', NULL),
  ('TARKROSI COMM. SENIOR HIGH SCHOOL', 'tarkrosi comm senior high school', 'shs', NULL),
  ('TARKWA SENIOR HIGH SCHOOL', 'tarkwa senior high school', 'shs', NULL),
  ('TAVIEFE COMM. SENIOR HIGH SCHOOL', 'taviefe comm senior high school', 'shs', NULL),
  ('TAWHEED SENIOR HIGH SCHOOL', 'tawheed senior high school', 'shs', NULL),
  ('TECHIMAN SENIOR HIGH SCHOOL', 'techiman senior high school', 'shs', NULL),
  ('TEMA MANHEAN SENIOR HIGH/TECH SCHOOL', 'tema manhean senior high/tech school', 'technical', NULL),
  ('TEMA METH. DAY SENIOR HIGH SCHOOL', 'tema meth day senior high school', 'shs', NULL),
  ('TEMA SENIOR HIGH SCHOOL', 'tema senior high school', 'shs', NULL),
  ('TEMPANE SENIOR HIGH SCHOOL', 'tempane senior high school', 'shs', NULL),
  ('TEPA SENIOR HIGH SCHOOL', 'tepa senior high school', 'shs', NULL),
  ('TERCHIRE SENIOR HIGH SCHOOL', 'terchire senior high school', 'shs', NULL),
  ('THREE TOWN SENIOR HIGH SCHOOL', 'three town senior high school', 'shs', NULL),
  ('TIJJANIYA SENIOR HIGH SCHOOL', 'tijjaniya senior high school', 'shs', NULL),
  ('TOASE SENIOR HIGH SCHOOL', 'toase senior high school', 'shs', NULL),
  ('TOLON SENIOR HIGH SCHOOL', 'tolon senior high school', 'shs', NULL),
  ('TONGO SENIOR HIGH/TECH SCHOOL', 'tongo senior high/tech school', 'technical', NULL),
  ('TONGOR SENIOR HIGH TECH SCHOOL', 'tongor senior high tech school', 'technical', NULL),
  ('TSIAME SENIOR HIGH SCHOOL', 'tsiame senior high school', 'shs', NULL),
  ('TSITO SENIOR HIGH/TECH SCHOOL', 'tsito senior high/tech school', 'technical', NULL),
  ('TUMU SENIOR HIGH/TECH SCHOOL', 'tumu senior high/tech school', 'technical', NULL),
  ('TUNA SENIOR HIGH/TECH SCHOOL', 'tuna senior high/tech school', 'technical', NULL),
  ('TUOBODOM SENIOR HIGH/TECH SCHOOL', 'tuobodom senior high/tech school', 'technical', NULL),
  ('TWEAPEASE SENIOR HIGH SCHOOL', 'tweapease senior high school', 'shs', NULL),
  ('TWENE AMANFO SENIOR HIGH/TECH SCHOOL', 'twene amanfo senior high/tech school', 'technical', NULL),
  ('TWENEBOA KODUA SENIOR HIGH SCHOOL', 'tweneboa kodua senior high school', 'shs', NULL),
  ('TWIFO HEMANG SENIOR HIGH/TECH SCHOOL', 'twifo hemang senior high/tech school', 'technical', NULL),
  ('TWIFO PRASO SENIOR HIGH SCHOOL', 'twifo praso senior high school', 'shs', NULL),
  ('ULLO SENIOR HIGH SCHOOL', 'ullo senior high school', 'shs', NULL),
  ('UNIVERSITY PRACTICE SENIOR HIGH SCHOOL', 'university practice senior high school', 'shs', NULL),
  ('UTHMAN BIN AFAM SENIOR HIGH SCHOOL', 'uthman bin afam senior high school', 'shs', NULL),
  ('UTHMANIYA SENIOR HIGH SCHOOL, TAFO', 'uthmaniya senior high school, tafo', 'shs', NULL),
  ('VAKPO SENIOR HIGH SCHOOL', 'vakpo senior high school', 'shs', NULL),
  ('VAKPO SENIOR HIGH/TECH SCHOOL', 'vakpo senior high/tech school', 'technical', NULL),
  ('VE COMM. SENIOR HIGH SCHOOL', 've comm senior high school', 'shs', NULL),
  ('VOLO COMM. SENIOR HIGH SCHOOL', 'volo comm senior high school', 'shs', NULL),
  ('VOLTA SENIOR HIGH SCHOOL', 'volta senior high school', 'shs', NULL),
  ('WA SENIOR HIGH SCHOOL', 'wa senior high school', 'shs', NULL),
  ('WA SENIOR HIGH/TECH SCHOOL', 'wa senior high/tech school', 'technical', NULL),
  ('WALEWALE SENIOR HIGH SCHOOL', 'walewale senior high school', 'shs', NULL),
  ('WAMANAFO SENIOR HIGH/TECH SCHOOL', 'wamanafo senior high/tech school', 'technical', NULL),
  ('WAPULI COMM. SENIOR HIGH SCHOOL', 'wapuli comm senior high school', 'shs', NULL),
  ('W.B.M. ZION SENIOR HIGH SCHOOL, OLD TAFO', 'wbm zion senior high school, old tafo', 'shs', NULL),
  ('WENCHI METH. SENIOR HIGH SCHOOL', 'wenchi meth senior high school', 'shs', NULL),
  ('WESLEY GIRLS SENIOR HIGH SCHOOL, CAPE COAST', 'wesley girls senior high school, cape coast', 'shs', NULL),
  ('WESLEY GRAMMAR SENIOR HIGH SCHOOL', 'wesley grammar senior high school', 'shs', NULL),
  ('WESLEY HIGH SCHOOL, BEKWAI', 'wesley high school, bekwai', 'shs', NULL),
  ('WESLEY SENIOR HIGH SCHOOL, KONONGO', 'wesley senior high school, konongo', 'shs', NULL),
  ('WEST AFRICA SENIOR HIGH SCHOOL', 'west africa senior high school', 'shs', NULL),
  ('WETA SENIOR HIGH/TECH SCHOOL', 'weta senior high/tech school', 'technical', NULL),
  ('WIAFE AKENTEN PRESBY SENIOR HIGH SCHOOL', 'wiafe akenten presby senior high school', 'shs', NULL),
  ('WIAGA COMM. SENIOR HIGH SCHOOL', 'wiaga comm senior high school', 'shs', NULL),
  ('WINNEBA SENIOR HIGH SCHOOL', 'winneba senior high school', 'shs', NULL),
  ('WORAWORA SENIOR HIGH SCHOOL', 'worawora senior high school', 'shs', NULL),
  ('WOVENU SENIOR HIGH TECHNICAL SCHOOL', 'wovenu senior high technical school', 'technical', NULL),
  ('WULENSI SENIOR HIGH SCHOOL', 'wulensi senior high school', 'shs', NULL),
  ('WULUGU SENIOR HIGH SCHOOL', 'wulugu senior high school', 'shs', NULL)
ON CONFLICT (name_norm) DO NOTHING;

INSERT INTO senior_high_schools (name, name_norm, school_type, region)
VALUES
  ('YAA ASANTEWAA GIRLS SENIOR HIGH SCHOOL', 'yaa asantewaa girls senior high school', 'shs', NULL),
  ('YABRAM COMM. DAY SCHOOL', 'yabram comm day school', 'shs', NULL),
  ('YAGABA SENIOR HIGH SCHOOL', 'yagaba senior high school', 'shs', NULL),
  ('YAMFO ANGLICAN SENIOR HIGH SCHOOL', 'yamfo anglican senior high school', 'shs', NULL),
  ('YEBOAH ASUAMAH SENIOR HIGH SCHOOL', 'yeboah asuamah senior high school', 'shs', NULL),
  ('YEJI SENIOR HIGH/TECH SCHOOL', 'yeji senior high/tech school', 'technical', NULL),
  ('YENDI SENIOR HIGH SCHOOL', 'yendi senior high school', 'shs', NULL),
  ('YILO KROBO SENIOR HIGH/COMM SCHOOL', 'yilo krobo senior high/comm school', 'shs', NULL),
  ('ZABZUGU SENIOR HIGH SCHOOL', 'zabzugu senior high school', 'shs', NULL),
  ('ZAMSE SENIOR HIGH/TECH SCHOOL', 'zamse senior high/tech school', 'technical', NULL),
  ('ZEBILLA SENIOR HIGH/TECH SCHOOL', 'zebilla senior high/tech school', 'technical', NULL),
  ('ZION SENIOR HIGH SCHOOL', 'zion senior high school', 'shs', NULL),
  ('ZIOPE SENIOR HIGH SCHOOL', 'ziope senior high school', 'shs', NULL),
  ('ZORKOR SENIOR HIGH SCHOOL', 'zorkor senior high school', 'shs', NULL),
  ('ZUARUNGU SENIOR HIGH SCHOOL', 'zuarungu senior high school', 'shs', NULL)
ON CONFLICT (name_norm) DO NOTHING;

-- Migration: 034_application_portal_auth_link.sql

-- Allow applicants to read their application (and related rows) via portal login email
-- when auth_user_id was not yet backfilled.

DROP POLICY IF EXISTS applications_select_own ON applications;
CREATE POLICY applications_select_own ON applications
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = auth_user_id
    OR internal_email = (auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS invoices_select_own ON invoices;
CREATE POLICY invoices_select_own ON invoices
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = invoices.application_id
        AND (
          a.auth_user_id = auth.uid()
          OR a.internal_email = (auth.jwt() ->> 'email')
        )
    )
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = invoices.student_id AND s.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS documents_select_own ON documents;
CREATE POLICY documents_select_own ON documents
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = documents.application_id
        AND (
          a.auth_user_id = auth.uid()
          OR a.internal_email = (auth.jwt() ->> 'email')
        )
    )
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = documents.student_id AND s.auth_user_id = auth.uid()
    )
  );

-- Migration: 035_normalize_r2_object_keys.sql

-- Convert legacy full public R2 URLs stored in key columns to bare object keys.

CREATE OR REPLACE FUNCTION public.strip_r2_public_url(val text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN val IS NULL OR btrim(val) = '' THEN val
    WHEN val NOT LIKE 'http://%' AND val NOT LIKE 'https://%' THEN val
    ELSE regexp_replace(val, '^https?://[^/]+/', '')
  END;
$$;

UPDATE public.documents
SET r2_key = public.strip_r2_public_url(r2_key)
WHERE r2_key LIKE 'http%';

UPDATE public.certificates
SET r2_key = public.strip_r2_public_url(r2_key)
WHERE r2_key LIKE 'http%';

UPDATE public.invoices
SET r2_key = public.strip_r2_public_url(r2_key)
WHERE r2_key IS NOT NULL AND r2_key LIKE 'http%';

UPDATE public.applications
SET admission_letter_r2_key = public.strip_r2_public_url(admission_letter_r2_key)
WHERE admission_letter_r2_key IS NOT NULL AND admission_letter_r2_key LIKE 'http%';

UPDATE public.students
SET profile_photo_r2_key = public.strip_r2_public_url(profile_photo_r2_key)
WHERE profile_photo_r2_key IS NOT NULL AND profile_photo_r2_key LIKE 'http%';

UPDATE public.resources
SET file_r2_key = public.strip_r2_public_url(file_r2_key)
WHERE file_r2_key LIKE 'http%';

UPDATE public.courses
SET thumbnail_r2_key = public.strip_r2_public_url(thumbnail_r2_key)
WHERE thumbnail_r2_key IS NOT NULL AND thumbnail_r2_key LIKE 'http%';

DROP FUNCTION public.strip_r2_public_url(text);

-- Migration: 036_accounts_admin_role.sql

-- Add accounts role; finance-scoped RLS for payments/reports/comm logs.

ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_check;
ALTER TABLE admins
  ADD CONSTRAINT admins_role_check
  CHECK (role IN ('admin', 'superadmin', 'accounts'));

ALTER TABLE admin_invites DROP CONSTRAINT IF EXISTS admin_invites_role_check;
ALTER TABLE admin_invites
  ADD CONSTRAINT admin_invites_role_check
  CHECK (role IN ('admin', 'superadmin', 'accounts'));

CREATE OR REPLACE FUNCTION public.has_finance_access()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() IN ('admin', 'superadmin', 'accounts');
$$;

CREATE OR REPLACE FUNCTION public.can_view_communication_logs()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() IN ('admin', 'superadmin', 'accounts');
$$;

-- Invoices & installments: accounts may view and record payments.
DROP POLICY IF EXISTS invoices_select_own ON invoices;
CREATE POLICY invoices_select_own ON invoices
  FOR SELECT TO authenticated
  USING (
    public.has_finance_access()
    OR EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = invoices.application_id AND a.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = invoices.student_id AND s.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS invoices_admin_write ON invoices;
CREATE POLICY invoices_admin_write ON invoices
  FOR ALL TO authenticated
  USING (public.has_finance_access())
  WITH CHECK (public.has_finance_access());

DROP POLICY IF EXISTS installments_select_own ON installments;
CREATE POLICY installments_select_own ON installments
  FOR SELECT TO authenticated
  USING (
    public.has_finance_access()
    OR EXISTS (
      SELECT 1
      FROM invoices i
      JOIN applications a ON a.id = i.application_id
      WHERE i.id = installments.invoice_id AND a.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM invoices i
      JOIN students s ON s.id = i.student_id
      WHERE i.id = installments.invoice_id AND s.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS installments_admin_write ON installments;
CREATE POLICY installments_admin_write ON installments
  FOR ALL TO authenticated
  USING (public.has_finance_access())
  WITH CHECK (public.has_finance_access());

-- Communication logs: read-only for accounts (no campaign write).
DROP POLICY IF EXISTS communication_logs_admin_select ON communication_logs;
CREATE POLICY communication_logs_admin_select ON communication_logs
  FOR SELECT TO authenticated
  USING (public.can_view_communication_logs());

-- Migration: 037_returning_student_applications.sql

-- Link repeat applications to an existing enrolled student record.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS returning_student_id uuid REFERENCES students(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS applications_returning_student_id_idx
  ON applications(returning_student_id)
  WHERE returning_student_id IS NOT NULL;

-- Migration: 038_students_application_id_unique.sql

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

-- Migration: 039_application_waitlist.sql

-- Waitlist: status, position, notification timestamp; intake-full applications skip app fee at submit.

ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'pending',
    'under_review',
    'shortlisted',
    'accepted',
    'rejected',
    'deferred',
    'waitlisted'
  ));

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS waitlist_position integer,
  ADD COLUMN IF NOT EXISTS waitlist_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS applications_waitlisted_intake_idx
  ON applications(intake_id)
  WHERE status = 'waitlisted';

CREATE OR REPLACE FUNCTION public.create_application(
  p_real_email text,
  p_phone text,
  p_full_name text,
  p_date_of_birth date,
  p_gender text,
  p_country text,
  p_address text,
  p_state_region text,
  p_city text,
  p_qualification text,
  p_institution text,
  p_year_completed int,
  p_prior_experience text,
  p_course_id uuid,
  p_intake_id uuid,
  p_hybrid_attendance_confirmed boolean,
  p_internal_email_domain text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_stored_year text;
  v_seq bigint;
  v_reference text;
  v_internal_email text;
  v_app_id uuid;
  v_invoice_ref text;
  v_apf_seq bigint;
  v_fee_ghs numeric(10,2);
  v_invoice_id uuid;
  v_payment_type_id uuid;
  v_intake_full boolean := false;
  v_waitlist_position integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM applications
    WHERE (real_email = p_real_email OR phone = p_phone)
      AND intake_id = p_intake_id
      AND status NOT IN ('rejected', 'deferred')
    LIMIT 1
  ) THEN
    RETURN json_build_object('error', 'duplicate');
  END IF;

  SELECT
    i.max_slots IS NOT NULL
    AND i.enrolled_count >= i.max_slots
    AND NOT i.is_closed
  INTO v_intake_full
  FROM intakes i
  WHERE i.id = p_intake_id;

  IF v_intake_full IS NULL THEN
    RETURN json_build_object('error', 'intake_not_found');
  END IF;

  -- Resolve payment type for the application fee invoice.
  SELECT id INTO v_payment_type_id
  FROM payment_types
  WHERE is_active = true
    AND (
      slug = 'application_fee'
      OR lower(label) = 'application fee'
    )
  ORDER BY (slug = 'application_fee') DESC, sort_order ASC, created_at ASC
  LIMIT 1;

  IF v_payment_type_id IS NULL THEN
    -- Fallback: first active payment type (keeps system usable even if renamed/misconfigured).
    SELECT id INTO v_payment_type_id
    FROM payment_types
    WHERE is_active = true
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1;
  END IF;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'application_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE application_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'application_seq_year';
  END IF;

  v_seq := nextval('application_seq');
  v_reference := 'REVAPP' || v_year || lpad(v_seq::text, 5, '0');
  v_internal_email := v_reference || '@' || p_internal_email_domain;

  IF v_intake_full THEN
    SELECT COUNT(*) + 1
    INTO v_waitlist_position
    FROM applications
    WHERE intake_id = p_intake_id
      AND status = 'waitlisted';

    INSERT INTO applications (
      reference,
      internal_email,
      real_email,
      phone,
      full_name,
      date_of_birth,
      gender,
      country,
      address,
      state_region,
      city,
      qualification,
      institution,
      year_completed,
      prior_experience,
      course_id,
      intake_id,
      hybrid_attendance_confirmed,
      status,
      waitlist_position
    ) VALUES (
      v_reference,
      v_internal_email,
      p_real_email,
      p_phone,
      p_full_name,
      p_date_of_birth,
      p_gender,
      p_country,
      p_address,
      p_state_region,
      p_city,
      p_qualification,
      p_institution,
      p_year_completed,
      p_prior_experience,
      p_course_id,
      p_intake_id,
      p_hybrid_attendance_confirmed,
      'waitlisted',
      v_waitlist_position
    )
    RETURNING id INTO v_app_id;

    RETURN json_build_object(
      'reference', v_reference,
      'application_id', v_app_id,
      'waitlisted', true,
      'waitlist_position', v_waitlist_position
    );
  END IF;

  INSERT INTO applications (
    reference,
    internal_email,
    real_email,
    phone,
    full_name,
    date_of_birth,
    gender,
    country,
    address,
    state_region,
    city,
    qualification,
    institution,
    year_completed,
    prior_experience,
    course_id,
    intake_id,
    hybrid_attendance_confirmed
  ) VALUES (
    v_reference,
    v_internal_email,
    p_real_email,
    p_phone,
    p_full_name,
    p_date_of_birth,
    p_gender,
    p_country,
    p_address,
    p_state_region,
    p_city,
    p_qualification,
    p_institution,
    p_year_completed,
    p_prior_experience,
    p_course_id,
    p_intake_id,
    p_hybrid_attendance_confirmed
  )
  RETURNING id INTO v_app_id;

  SELECT value::numeric INTO v_fee_ghs
  FROM system_settings
  WHERE key = 'application_fee_ghs';

  IF v_fee_ghs IS NULL THEN
    v_fee_ghs := 0;
  END IF;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'invoice_apf_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE invoice_apf_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'invoice_apf_seq_year';
  END IF;

  v_apf_seq := nextval('invoice_apf_seq');
  v_invoice_ref := 'REVAPF' || v_year || lpad(v_apf_seq::text, 5, '0');

  IF v_payment_type_id IS NULL THEN
    RAISE EXCEPTION 'Application fee payment type not configured. Please contact the administrator.';
  END IF;

  INSERT INTO invoices (
    reference,
    type,
    application_id,
    amount_ghs,
    discount_ghs,
    total_ghs,
    status,
    payment_type_id
  ) VALUES (
    v_invoice_ref,
    'application_fee',
    v_app_id,
    v_fee_ghs,
    0,
    v_fee_ghs,
    'unpaid',
    v_payment_type_id
  )
  RETURNING id INTO v_invoice_id;

  RETURN json_build_object(
    'reference', v_reference,
    'application_id', v_app_id,
    'invoice_reference', v_invoice_ref,
    'invoice_id', v_invoice_id,
    'waitlisted', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_application(
  text, text, text, date, text, text, text, text, text, text, text, int, text, uuid, uuid, boolean, text
) TO authenticated, service_role;

-- Migration: 040_create_application_payment_type_id.sql

-- Restore payment_type_id on application-fee invoices (regression from 039 waitlist migration).

CREATE OR REPLACE FUNCTION public.create_application(
  p_real_email text,
  p_phone text,
  p_full_name text,
  p_date_of_birth date,
  p_gender text,
  p_country text,
  p_address text,
  p_state_region text,
  p_city text,
  p_qualification text,
  p_institution text,
  p_year_completed int,
  p_prior_experience text,
  p_course_id uuid,
  p_intake_id uuid,
  p_hybrid_attendance_confirmed boolean,
  p_internal_email_domain text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_stored_year text;
  v_seq bigint;
  v_reference text;
  v_internal_email text;
  v_app_id uuid;
  v_invoice_ref text;
  v_apf_seq bigint;
  v_fee_ghs numeric(10,2);
  v_invoice_id uuid;
  v_payment_type_id uuid;
  v_intake_full boolean := false;
  v_waitlist_position integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM applications
    WHERE (real_email = p_real_email OR phone = p_phone)
      AND intake_id = p_intake_id
      AND status NOT IN ('rejected', 'deferred')
    LIMIT 1
  ) THEN
    RETURN json_build_object('error', 'duplicate');
  END IF;

  SELECT
    i.max_slots IS NOT NULL
    AND i.enrolled_count >= i.max_slots
    AND NOT i.is_closed
  INTO v_intake_full
  FROM intakes i
  WHERE i.id = p_intake_id;

  IF v_intake_full IS NULL THEN
    RETURN json_build_object('error', 'intake_not_found');
  END IF;

  -- Resolve payment type for the application fee invoice.
  SELECT id INTO v_payment_type_id
  FROM payment_types
  WHERE is_active = true
    AND (
      slug = 'application_fee'
      OR lower(label) = 'application fee'
    )
  ORDER BY (slug = 'application_fee') DESC, sort_order ASC, created_at ASC
  LIMIT 1;

  IF v_payment_type_id IS NULL THEN
    -- Fallback: first active payment type (keeps system usable even if renamed/misconfigured).
    SELECT id INTO v_payment_type_id
    FROM payment_types
    WHERE is_active = true
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1;
  END IF;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'application_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE application_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'application_seq_year';
  END IF;

  v_seq := nextval('application_seq');
  v_reference := 'REVAPP' || v_year || lpad(v_seq::text, 5, '0');
  v_internal_email := v_reference || '@' || p_internal_email_domain;

  IF v_intake_full THEN
    SELECT COUNT(*) + 1
    INTO v_waitlist_position
    FROM applications
    WHERE intake_id = p_intake_id
      AND status = 'waitlisted';

    INSERT INTO applications (
      reference,
      internal_email,
      real_email,
      phone,
      full_name,
      date_of_birth,
      gender,
      country,
      address,
      state_region,
      city,
      qualification,
      institution,
      year_completed,
      prior_experience,
      course_id,
      intake_id,
      hybrid_attendance_confirmed,
      status,
      waitlist_position
    ) VALUES (
      v_reference,
      v_internal_email,
      p_real_email,
      p_phone,
      p_full_name,
      p_date_of_birth,
      p_gender,
      p_country,
      p_address,
      p_state_region,
      p_city,
      p_qualification,
      p_institution,
      p_year_completed,
      p_prior_experience,
      p_course_id,
      p_intake_id,
      p_hybrid_attendance_confirmed,
      'waitlisted',
      v_waitlist_position
    )
    RETURNING id INTO v_app_id;

    RETURN json_build_object(
      'reference', v_reference,
      'application_id', v_app_id,
      'waitlisted', true,
      'waitlist_position', v_waitlist_position
    );
  END IF;

  INSERT INTO applications (
    reference,
    internal_email,
    real_email,
    phone,
    full_name,
    date_of_birth,
    gender,
    country,
    address,
    state_region,
    city,
    qualification,
    institution,
    year_completed,
    prior_experience,
    course_id,
    intake_id,
    hybrid_attendance_confirmed
  ) VALUES (
    v_reference,
    v_internal_email,
    p_real_email,
    p_phone,
    p_full_name,
    p_date_of_birth,
    p_gender,
    p_country,
    p_address,
    p_state_region,
    p_city,
    p_qualification,
    p_institution,
    p_year_completed,
    p_prior_experience,
    p_course_id,
    p_intake_id,
    p_hybrid_attendance_confirmed
  )
  RETURNING id INTO v_app_id;

  SELECT value::numeric INTO v_fee_ghs
  FROM system_settings
  WHERE key = 'application_fee_ghs';

  IF v_fee_ghs IS NULL THEN
    v_fee_ghs := 0;
  END IF;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'invoice_apf_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE invoice_apf_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'invoice_apf_seq_year';
  END IF;

  v_apf_seq := nextval('invoice_apf_seq');
  v_invoice_ref := 'REVAPF' || v_year || lpad(v_apf_seq::text, 5, '0');

  IF v_payment_type_id IS NULL THEN
    RAISE EXCEPTION 'Application fee payment type not configured. Please contact the administrator.';
  END IF;

  INSERT INTO invoices (
    reference,
    type,
    application_id,
    amount_ghs,
    discount_ghs,
    total_ghs,
    status,
    payment_type_id
  ) VALUES (
    v_invoice_ref,
    'application_fee',
    v_app_id,
    v_fee_ghs,
    0,
    v_fee_ghs,
    'unpaid',
    v_payment_type_id
  )
  RETURNING id INTO v_invoice_id;

  RETURN json_build_object(
    'reference', v_reference,
    'application_id', v_app_id,
    'invoice_reference', v_invoice_ref,
    'invoice_id', v_invoice_id,
    'waitlisted', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_application(
  text, text, text, date, text, text, text, text, text, text, text, int, text, uuid, uuid, boolean, text
) TO authenticated, service_role;

-- Migration: 041_invoice_reference_sequence.sql

-- Atomic invoice references via a single sequence (concurrency-safe).

DROP SEQUENCE IF EXISTS invoice_ref_seq;
CREATE SEQUENCE invoice_ref_seq START WITH 1 MINVALUE 1;
ALTER SEQUENCE invoice_ref_seq RESTART WITH 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_reference(prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val bigint;
BEGIN
  IF prefix NOT IN ('REVINV', 'REVAPF') THEN
    RAISE EXCEPTION 'Invalid invoice reference prefix: %', prefix;
  END IF;

  SELECT nextval('invoice_ref_seq') INTO next_val;
  RETURN prefix || to_char(CURRENT_DATE, 'YYYY') || lpad(next_val::text, 5, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_invoice_reference(text) TO authenticated, service_role;

-- Backward-compatible wrapper for callers still using generate_invoice_ref(p_type).
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invoices_reference_unique'
      AND conrelid = 'public.invoices'::regclass
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_reference_unique UNIQUE (reference);
  END IF;
END
$$;

-- create_application: use generate_invoice_reference for app-fee invoice refs.
CREATE OR REPLACE FUNCTION public.create_application(
  p_real_email text,
  p_phone text,
  p_full_name text,
  p_date_of_birth date,
  p_gender text,
  p_country text,
  p_address text,
  p_state_region text,
  p_city text,
  p_qualification text,
  p_institution text,
  p_year_completed int,
  p_prior_experience text,
  p_course_id uuid,
  p_intake_id uuid,
  p_hybrid_attendance_confirmed boolean,
  p_internal_email_domain text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_stored_year text;
  v_seq bigint;
  v_reference text;
  v_internal_email text;
  v_app_id uuid;
  v_invoice_ref text;
  v_fee_ghs numeric(10,2);
  v_invoice_id uuid;
  v_payment_type_id uuid;
  v_intake_full boolean := false;
  v_waitlist_position integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM applications
    WHERE (real_email = p_real_email OR phone = p_phone)
      AND intake_id = p_intake_id
      AND status NOT IN ('rejected', 'deferred')
    LIMIT 1
  ) THEN
    RETURN json_build_object('error', 'duplicate');
  END IF;

  SELECT
    i.max_slots IS NOT NULL
    AND i.enrolled_count >= i.max_slots
    AND NOT i.is_closed
  INTO v_intake_full
  FROM intakes i
  WHERE i.id = p_intake_id;

  IF v_intake_full IS NULL THEN
    RETURN json_build_object('error', 'intake_not_found');
  END IF;

  SELECT id INTO v_payment_type_id
  FROM payment_types
  WHERE is_active = true
    AND (
      slug = 'application_fee'
      OR lower(label) = 'application fee'
    )
  ORDER BY (slug = 'application_fee') DESC, sort_order ASC, created_at ASC
  LIMIT 1;

  IF v_payment_type_id IS NULL THEN
    SELECT id INTO v_payment_type_id
    FROM payment_types
    WHERE is_active = true
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1;
  END IF;

  SELECT value INTO v_stored_year
  FROM system_settings
  WHERE key = 'application_seq_year';

  IF v_stored_year IS DISTINCT FROM v_year THEN
    ALTER SEQUENCE application_seq RESTART WITH 1;
    UPDATE system_settings
    SET value = v_year, updated_at = now()
    WHERE key = 'application_seq_year';
  END IF;

  v_seq := nextval('application_seq');
  v_reference := 'REVAPP' || v_year || lpad(v_seq::text, 5, '0');
  v_internal_email := v_reference || '@' || p_internal_email_domain;

  IF v_intake_full THEN
    SELECT COUNT(*) + 1
    INTO v_waitlist_position
    FROM applications
    WHERE intake_id = p_intake_id
      AND status = 'waitlisted';

    INSERT INTO applications (
      reference,
      internal_email,
      real_email,
      phone,
      full_name,
      date_of_birth,
      gender,
      country,
      address,
      state_region,
      city,
      qualification,
      institution,
      year_completed,
      prior_experience,
      course_id,
      intake_id,
      hybrid_attendance_confirmed,
      status,
      waitlist_position
    ) VALUES (
      v_reference,
      v_internal_email,
      p_real_email,
      p_phone,
      p_full_name,
      p_date_of_birth,
      p_gender,
      p_country,
      p_address,
      p_state_region,
      p_city,
      p_qualification,
      p_institution,
      p_year_completed,
      p_prior_experience,
      p_course_id,
      p_intake_id,
      p_hybrid_attendance_confirmed,
      'waitlisted',
      v_waitlist_position
    )
    RETURNING id INTO v_app_id;

    RETURN json_build_object(
      'reference', v_reference,
      'application_id', v_app_id,
      'waitlisted', true,
      'waitlist_position', v_waitlist_position
    );
  END IF;

  INSERT INTO applications (
    reference,
    internal_email,
    real_email,
    phone,
    full_name,
    date_of_birth,
    gender,
    country,
    address,
    state_region,
    city,
    qualification,
    institution,
    year_completed,
    prior_experience,
    course_id,
    intake_id,
    hybrid_attendance_confirmed
  ) VALUES (
    v_reference,
    v_internal_email,
    p_real_email,
    p_phone,
    p_full_name,
    p_date_of_birth,
    p_gender,
    p_country,
    p_address,
    p_state_region,
    p_city,
    p_qualification,
    p_institution,
    p_year_completed,
    p_prior_experience,
    p_course_id,
    p_intake_id,
    p_hybrid_attendance_confirmed
  )
  RETURNING id INTO v_app_id;

  SELECT value::numeric INTO v_fee_ghs
  FROM system_settings
  WHERE key = 'application_fee_ghs';

  IF v_fee_ghs IS NULL THEN
    v_fee_ghs := 0;
  END IF;

  v_invoice_ref := generate_invoice_reference('REVAPF');

  IF v_payment_type_id IS NULL THEN
    RAISE EXCEPTION 'Application fee payment type not configured. Please contact the administrator.';
  END IF;

  INSERT INTO invoices (
    reference,
    type,
    application_id,
    amount_ghs,
    discount_ghs,
    total_ghs,
    status,
    payment_type_id
  ) VALUES (
    v_invoice_ref,
    'application_fee',
    v_app_id,
    v_fee_ghs,
    0,
    v_fee_ghs,
    'unpaid',
    v_payment_type_id
  )
  RETURNING id INTO v_invoice_id;

  RETURN json_build_object(
    'reference', v_reference,
    'application_id', v_app_id,
    'invoice_reference', v_invoice_ref,
    'invoice_id', v_invoice_id,
    'waitlisted', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_application(
  text, text, text, date, text, text, text, text, text, text, text, int, text, uuid, uuid, boolean, text
) TO authenticated, service_role;

-- Migration: 042_atomic_id_generation.sql

-- Atomic application references and student IDs (concurrency-safe sequences).

DROP SEQUENCE IF EXISTS app_ref_seq;
CREATE SEQUENCE app_ref_seq START WITH 1 MINVALUE 1;

DROP SEQUENCE IF EXISTS student_id_seq;
CREATE SEQUENCE student_id_seq START WITH 1 MINVALUE 1;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applications_reference_unique'
      AND conrelid = 'public.applications'::regclass
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_reference_unique UNIQUE (reference);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'students_student_id_unique'
      AND conrelid = 'public.students'::regclass
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_student_id_unique UNIQUE (student_id);
  END IF;
END
$$;

-- create_application: generate application reference via generate_app_reference().
CREATE OR REPLACE FUNCTION public.create_application(
  p_real_email text,
  p_phone text,
  p_full_name text,
  p_date_of_birth date,
  p_gender text,
  p_country text,
  p_address text,
  p_state_region text,
  p_city text,
  p_qualification text,
  p_institution text,
  p_year_completed int,
  p_prior_experience text,
  p_course_id uuid,
  p_intake_id uuid,
  p_hybrid_attendance_confirmed boolean,
  p_internal_email_domain text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reference text;
  v_internal_email text;
  v_app_id uuid;
  v_invoice_ref text;
  v_fee_ghs numeric(10,2);
  v_invoice_id uuid;
  v_payment_type_id uuid;
  v_intake_full boolean := false;
  v_waitlist_position integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM applications
    WHERE (real_email = p_real_email OR phone = p_phone)
      AND intake_id = p_intake_id
      AND status NOT IN ('rejected', 'deferred')
    LIMIT 1
  ) THEN
    RETURN json_build_object('error', 'duplicate');
  END IF;

  SELECT
    i.max_slots IS NOT NULL
    AND i.enrolled_count >= i.max_slots
    AND NOT i.is_closed
  INTO v_intake_full
  FROM intakes i
  WHERE i.id = p_intake_id;

  IF v_intake_full IS NULL THEN
    RETURN json_build_object('error', 'intake_not_found');
  END IF;

  SELECT id INTO v_payment_type_id
  FROM payment_types
  WHERE is_active = true
    AND (
      slug = 'application_fee'
      OR lower(label) = 'application fee'
    )
  ORDER BY (slug = 'application_fee') DESC, sort_order ASC, created_at ASC
  LIMIT 1;

  IF v_payment_type_id IS NULL THEN
    SELECT id INTO v_payment_type_id
    FROM payment_types
    WHERE is_active = true
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1;
  END IF;

  v_reference := generate_app_reference();
  v_internal_email := v_reference || '@' || p_internal_email_domain;

  IF v_intake_full THEN
    SELECT COUNT(*) + 1
    INTO v_waitlist_position
    FROM applications
    WHERE intake_id = p_intake_id
      AND status = 'waitlisted';

    INSERT INTO applications (
      reference,
      internal_email,
      real_email,
      phone,
      full_name,
      date_of_birth,
      gender,
      country,
      address,
      state_region,
      city,
      qualification,
      institution,
      year_completed,
      prior_experience,
      course_id,
      intake_id,
      hybrid_attendance_confirmed,
      status,
      waitlist_position
    ) VALUES (
      v_reference,
      v_internal_email,
      p_real_email,
      p_phone,
      p_full_name,
      p_date_of_birth,
      p_gender,
      p_country,
      p_address,
      p_state_region,
      p_city,
      p_qualification,
      p_institution,
      p_year_completed,
      p_prior_experience,
      p_course_id,
      p_intake_id,
      p_hybrid_attendance_confirmed,
      'waitlisted',
      v_waitlist_position
    )
    RETURNING id INTO v_app_id;

    RETURN json_build_object(
      'reference', v_reference,
      'application_id', v_app_id,
      'waitlisted', true,
      'waitlist_position', v_waitlist_position
    );
  END IF;

  INSERT INTO applications (
    reference,
    internal_email,
    real_email,
    phone,
    full_name,
    date_of_birth,
    gender,
    country,
    address,
    state_region,
    city,
    qualification,
    institution,
    year_completed,
    prior_experience,
    course_id,
    intake_id,
    hybrid_attendance_confirmed
  ) VALUES (
    v_reference,
    v_internal_email,
    p_real_email,
    p_phone,
    p_full_name,
    p_date_of_birth,
    p_gender,
    p_country,
    p_address,
    p_state_region,
    p_city,
    p_qualification,
    p_institution,
    p_year_completed,
    p_prior_experience,
    p_course_id,
    p_intake_id,
    p_hybrid_attendance_confirmed
  )
  RETURNING id INTO v_app_id;

  SELECT value::numeric INTO v_fee_ghs
  FROM system_settings
  WHERE key = 'application_fee_ghs';

  IF v_fee_ghs IS NULL THEN
    v_fee_ghs := 0;
  END IF;

  v_invoice_ref := generate_invoice_reference('REVAPF');

  IF v_payment_type_id IS NULL THEN
    RAISE EXCEPTION 'Application fee payment type not configured. Please contact the administrator.';
  END IF;

  INSERT INTO invoices (
    reference,
    type,
    application_id,
    amount_ghs,
    discount_ghs,
    total_ghs,
    status,
    payment_type_id
  ) VALUES (
    v_invoice_ref,
    'application_fee',
    v_app_id,
    v_fee_ghs,
    0,
    v_fee_ghs,
    'unpaid',
    v_payment_type_id
  )
  RETURNING id INTO v_invoice_id;

  RETURN json_build_object(
    'reference', v_reference,
    'application_id', v_app_id,
    'invoice_reference', v_invoice_ref,
    'invoice_id', v_invoice_id,
    'waitlisted', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_application(
  text, text, text, date, text, text, text, text, text, text, text, int, text, uuid, uuid, boolean, text
) TO authenticated, service_role;

-- Migration: 043_student_id_six_digit_padding.sql

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

-- Migration: 044_split_invoice_sequences.sql

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

-- Migration: 045_course_instructors_and_maintenance.sql

-- Course instructor fields
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS instructor_name text,
  ADD COLUMN IF NOT EXISTS instructor_title text,
  ADD COLUMN IF NOT EXISTS instructor_bio text,
  ADD COLUMN IF NOT EXISTS instructor_photo_r2_key text;

-- Maintenance mode settings (system_settings key/value)
INSERT INTO system_settings (key, value, description)
VALUES
  (
    'maintenance_full',
    'false',
    'When true, public site redirects to maintenance (admin and login exempt).'
  ),
  (
    'maintenance_portal',
    'false',
    'When true, portal and apply routes redirect to maintenance.'
  ),
  (
    'maintenance_message',
    '',
    'Message shown on the maintenance page.'
  ),
  (
    'maintenance_deadline',
    '',
    'ISO datetime when service is expected back online.'
  )
ON CONFLICT (key) DO NOTHING;

-- Migration: 046_momo_provider_setting.sql

INSERT INTO system_settings (key, value, description)
VALUES ('momo_provider', 'MTN MoMo', 'Primary mobile money provider name shown on invoices and portal')
ON CONFLICT (key) DO NOTHING;

-- Migration: 047_application_drafts.sql

-- Server-issued application draft IDs and upload tokens for pre-auth document uploads.

CREATE TABLE application_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX application_drafts_created_at_idx ON application_drafts (created_at);

ALTER TABLE application_drafts ENABLE ROW LEVEL SECURITY;

-- Migration: 048_deletion_requests.sql

-- GDPR / Data Protection Act: student account deletion requests (processed by superadmin).

CREATE TABLE deletion_requests (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_auth_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name           text NOT NULL,
  student_email          text NOT NULL,
  requested_at           timestamptz NOT NULL DEFAULT now(),
  status                 text NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'completed', 'rejected')),
  completed_at           timestamptz,
  rejected_reason        text
);

CREATE INDEX deletion_requests_status_requested_idx
  ON deletion_requests (status, requested_at DESC);

CREATE INDEX deletion_requests_auth_user_idx
  ON deletion_requests (student_auth_user_id);

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY deletion_requests_admin_select ON deletion_requests
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY deletion_requests_student_select_own ON deletion_requests
  FOR SELECT TO authenticated
  USING (student_auth_user_id = auth.uid());

-- Migration: 049_audit_logs_actor_metadata.sql

-- Extend audit_logs for student actors, IP, and structured metadata (entity_type/entity_id remain target fields).

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS actor_id uuid,
  ADD COLUMN IF NOT EXISTS actor_type text CHECK (actor_type IS NULL OR actor_type IN ('admin', 'student')),
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_type_idx ON audit_logs (actor_type);

