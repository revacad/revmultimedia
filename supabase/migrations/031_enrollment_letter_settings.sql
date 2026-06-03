INSERT INTO system_settings (key, value)
VALUES
  ('enrollment_letter_signatory_name', 'Godfred Ferdinand Appiah'),
  ('enrollment_letter_signatory_title', 'President')
ON CONFLICT (key) DO NOTHING;
