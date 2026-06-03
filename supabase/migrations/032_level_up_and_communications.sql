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
