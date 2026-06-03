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
