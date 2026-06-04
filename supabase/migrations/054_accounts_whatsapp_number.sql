INSERT INTO system_settings (key, value, description)
VALUES (
  'accounts_whatsapp_number',
  '',
  'WhatsApp number for the accounts team. Students contact this number to notify of manual payments.'
)
ON CONFLICT (key) DO NOTHING;
