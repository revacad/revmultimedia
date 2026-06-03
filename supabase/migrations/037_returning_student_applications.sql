-- Link repeat applications to an existing enrolled student record.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS returning_student_id uuid REFERENCES students(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS applications_returning_student_id_idx
  ON applications(returning_student_id)
  WHERE returning_student_id IS NOT NULL;
