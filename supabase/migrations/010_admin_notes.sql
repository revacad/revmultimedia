CREATE TABLE admin_notes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id),
  student_id     uuid REFERENCES students(id),
  note           text NOT NULL,
  created_by     uuid NOT NULL REFERENCES admins(id),
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
