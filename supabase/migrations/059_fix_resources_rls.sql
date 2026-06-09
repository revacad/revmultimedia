-- Align resource RLS with portal download authorization: completed enrollments retain access.
DROP POLICY IF EXISTS "student_resources_select" ON resources;

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
          AND e.status IN ('active', 'completed')
        )
      )
      OR (
        visibility = 'intake_specific'
        AND intake_id IN (
          SELECT e.intake_id FROM enrollments e
          JOIN students s ON s.id = e.student_id
          WHERE s.auth_user_id = auth.uid()
          AND e.status IN ('active', 'completed')
        )
      )
    )
  );
