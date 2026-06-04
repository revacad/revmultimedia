ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_category_check;

ALTER TABLE courses
ADD CONSTRAINT courses_category_check
CHECK (category = ANY (ARRAY[
  'design'::text,
  'video_motion'::text,
  'technology'::text,
  'marketing'::text
]));
