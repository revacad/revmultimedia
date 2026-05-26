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
