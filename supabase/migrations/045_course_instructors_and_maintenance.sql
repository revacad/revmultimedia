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
