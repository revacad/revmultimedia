CREATE TABLE students (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           text NOT NULL UNIQUE,
  application_id       uuid NOT NULL REFERENCES applications(id),
  auth_user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            text NOT NULL,
  real_email           text NOT NULL,
  phone                text NOT NULL,
  date_of_birth        date NOT NULL,
  gender               text NOT NULL,
  country              text NOT NULL,
  address              text NOT NULL,
  state_region         text,
  city                 text,
  profile_photo_r2_key text,
  is_active            boolean NOT NULL DEFAULT true,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE TABLE enrollments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid NOT NULL REFERENCES students(id),
  course_id      uuid NOT NULL REFERENCES courses(id),
  intake_id      uuid NOT NULL REFERENCES intakes(id),
  application_id uuid NOT NULL REFERENCES applications(id),
  status         text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'completed', 'withdrawn', 'deferred')),
  enrolled_at    timestamptz DEFAULT now(),
  completed_at   timestamptz
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE INDEX enrollments_student_id_idx ON enrollments(student_id);
CREATE INDEX students_student_id_idx ON students(student_id);
