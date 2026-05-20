ALTER TABLE courses
ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(category, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_courses_search_vector
  ON courses USING gin(search_vector);

ALTER TABLE students
ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(full_name, '') || ' ' ||
      coalesce(real_email, '') || ' ' ||
      coalesce(student_id, '') || ' ' ||
      coalesce(phone, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_students_search_vector
  ON students USING gin(search_vector);

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(full_name, '') || ' ' ||
      coalesce(real_email, '') || ' ' ||
      coalesce(reference, '') || ' ' ||
      coalesce(phone, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_applications_search_vector
  ON applications USING gin(search_vector);
