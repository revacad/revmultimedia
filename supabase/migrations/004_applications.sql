CREATE TABLE applications (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference                    text NOT NULL UNIQUE,
  auth_user_id                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_email               text NOT NULL UNIQUE,
  real_email                   text NOT NULL,
  phone                        text NOT NULL,
  full_name                    text NOT NULL,
  date_of_birth                date NOT NULL,
  gender                       text NOT NULL CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
  country                      text NOT NULL DEFAULT 'Ghana',
  address                      text NOT NULL,
  state_region                 text,
  city                         text,
  qualification                text NOT NULL CHECK (qualification IN ('wassce', 'hnd', 'degree', 'masters', 'other')),
  institution                  text NOT NULL,
  year_completed               int NOT NULL,
  prior_experience             text,
  course_id                    uuid NOT NULL REFERENCES courses(id),
  intake_id                    uuid NOT NULL REFERENCES intakes(id),
  hybrid_attendance_confirmed  boolean NOT NULL DEFAULT false,
  status                       text NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','under_review','shortlisted','accepted','rejected','deferred')),
  app_fee_paid                 boolean NOT NULL DEFAULT false,
  created_at                   timestamptz DEFAULT now(),
  updated_at                   timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX applications_real_email_idx ON applications(real_email);
CREATE INDEX applications_phone_idx ON applications(phone);
CREATE INDEX applications_course_id_idx ON applications(course_id);
CREATE INDEX applications_intake_id_idx ON applications(intake_id);
CREATE INDEX applications_status_idx ON applications(status);
