INSERT INTO system_settings (key, value, description)
VALUES ('momo_provider', 'MTN MoMo', 'Primary mobile money provider name shown on invoices and portal')
ON CONFLICT (key) DO NOTHING;
