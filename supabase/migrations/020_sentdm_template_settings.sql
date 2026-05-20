INSERT INTO system_settings (key, value, description) VALUES
  ('sentdm_whatsapp_template_id', '', 'Sent.dm WhatsApp template ID'),
  ('sentdm_sms_template_id', '', 'Sent.dm SMS template ID')
ON CONFLICT (key) DO NOTHING;
