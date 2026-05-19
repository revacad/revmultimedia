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
