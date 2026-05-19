CREATE TABLE documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid REFERENCES applications(id),
  student_id      uuid REFERENCES students(id),
  document_type   text NOT NULL CHECK (document_type IN
                    ('national_id', 'passport', 'passport_photo', 'certificate', 'other')),
  r2_key          text NOT NULL,
  file_name       text NOT NULL,
  file_size_bytes int,
  mime_type       text,
  uploaded_by     text NOT NULL CHECK (uploaded_by IN ('student', 'admin')),
  uploaded_at     timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE certificates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           uuid NOT NULL REFERENCES students(id),
  enrollment_id        uuid NOT NULL REFERENCES enrollments(id),
  course_id            uuid NOT NULL REFERENCES courses(id),
  r2_key               text NOT NULL,
  file_name            text NOT NULL,
  uploaded_by_admin_id uuid NOT NULL REFERENCES admins(id),
  uploaded_at          timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
