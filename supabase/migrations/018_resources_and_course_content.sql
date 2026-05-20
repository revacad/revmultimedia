-- Resources for admin upload / student download
CREATE TABLE resources (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  file_r2_key  text NOT NULL,
  file_name    text NOT NULL,
  file_type    text NOT NULL CHECK (file_type IN ('pdf', 'image')),
  file_size    bigint,
  course_id    uuid REFERENCES courses(id) ON DELETE SET NULL,
  intake_id    uuid REFERENCES intakes(id) ON DELETE SET NULL,
  visibility   text NOT NULL DEFAULT 'all_students'
                 CHECK (visibility IN ('all_students', 'course_specific', 'intake_specific')),
  is_active    boolean NOT NULL DEFAULT true,
  uploaded_by  uuid NOT NULL REFERENCES admins(id),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_resources_course_id ON resources(course_id);
CREATE INDEX idx_resources_intake_id ON resources(intake_id);
CREATE INDEX idx_resources_visibility ON resources(visibility);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_resources_all"
  ON resources FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "student_resources_select"
  ON resources FOR SELECT TO authenticated
  USING (
    is_active = true AND (
      visibility = 'all_students'
      OR (
        visibility = 'course_specific'
        AND course_id IN (
          SELECT e.course_id FROM enrollments e
          JOIN students s ON s.id = e.student_id
          WHERE s.auth_user_id = auth.uid()
          AND e.status = 'active'
        )
      )
      OR (
        visibility = 'intake_specific'
        AND intake_id IN (
          SELECT e.intake_id FROM enrollments e
          JOIN students s ON s.id = e.student_id
          WHERE s.auth_user_id = auth.uid()
          AND e.status = 'active'
        )
      )
    )
  );

ALTER TABLE courses
  ALTER COLUMN curriculum SET DEFAULT '{}'::jsonb;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS video_intro_url text;

-- Student activity for resource downloads
CREATE TABLE student_activity_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  action     text NOT NULL,
  metadata   jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_student_activity_student_id ON student_activity_logs(student_id);
CREATE INDEX idx_student_activity_created_at ON student_activity_logs(created_at DESC);

ALTER TABLE student_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_activity_insert_own"
  ON student_activity_logs FOR INSERT TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "admin_student_activity_select"
  ON student_activity_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_user_id = auth.uid()
      AND is_active = true
    )
  );
