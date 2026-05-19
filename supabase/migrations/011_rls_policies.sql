CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() IN ('admin', 'superadmin');
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() = 'superadmin';
$$;

-- courses (public read for published)
CREATE POLICY courses_anon_select ON courses
  FOR SELECT TO anon
  USING (is_published = true);

CREATE POLICY courses_authenticated_select ON courses
  FOR SELECT TO authenticated
  USING (is_published = true OR public.is_admin());

CREATE POLICY courses_admin_insert ON courses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY courses_admin_update ON courses
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY courses_admin_delete ON courses
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- intakes (public read when course published)
CREATE POLICY intakes_anon_select ON intakes
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = intakes.course_id AND c.is_published = true
    )
  );

CREATE POLICY intakes_authenticated_select ON intakes
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = intakes.course_id AND c.is_published = true
    )
  );

CREATE POLICY intakes_admin_insert ON intakes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY intakes_admin_update ON intakes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY intakes_admin_delete ON intakes
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- applications
CREATE POLICY applications_select_own ON applications
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id OR public.is_admin());

CREATE POLICY applications_admin_write ON applications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- students
CREATE POLICY students_select_own ON students
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id OR public.is_admin());

CREATE POLICY students_admin_write ON students
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- enrollments
CREATE POLICY enrollments_select_own ON enrollments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = enrollments.student_id AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY enrollments_admin_write ON enrollments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- invoices
CREATE POLICY invoices_select_own ON invoices
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = invoices.application_id AND a.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = invoices.student_id AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY invoices_admin_write ON invoices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- installments
CREATE POLICY installments_select_own ON installments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM invoices i
      JOIN applications a ON a.id = i.application_id
      WHERE i.id = installments.invoice_id AND a.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM invoices i
      JOIN students s ON s.id = i.student_id
      WHERE i.id = installments.invoice_id AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY installments_admin_write ON installments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- documents
CREATE POLICY documents_select_own ON documents
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = documents.application_id AND a.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = documents.student_id AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY documents_admin_write ON documents
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- certificates
CREATE POLICY certificates_select_own ON certificates
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = certificates.student_id AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY certificates_admin_write ON certificates
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- admins
CREATE POLICY admins_select ON admins
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY admins_superadmin_insert ON admins
  FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin());

CREATE POLICY admins_superadmin_update ON admins
  FOR UPDATE TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- admin_notes
CREATE POLICY admin_notes_select ON admin_notes
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY admin_notes_insert ON admin_notes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY admin_notes_update ON admin_notes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- promo_codes
CREATE POLICY promo_codes_select ON promo_codes
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY promo_codes_insert ON promo_codes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY promo_codes_update ON promo_codes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- system_settings
CREATE POLICY system_settings_anon_select ON system_settings
  FOR SELECT TO anon
  USING (true);

CREATE POLICY system_settings_admin_select ON system_settings
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY system_settings_admin_insert ON system_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY system_settings_admin_update ON system_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- notifications_log
CREATE POLICY notifications_log_select ON notifications_log
  FOR SELECT TO authenticated
  USING (public.is_admin());
