UPDATE system_settings
SET value = '233204543372'
WHERE key = 'accounts_whatsapp_number' AND (value IS NULL OR value = '');
