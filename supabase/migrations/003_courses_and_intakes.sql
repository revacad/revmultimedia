CREATE TABLE courses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  slug             text NOT NULL UNIQUE,
  category         text NOT NULL CHECK (category IN ('graphic_design', 'motion_graphics', 'video_editing')),
  description      text,
  curriculum       jsonb,
  mode             text NOT NULL CHECK (mode IN ('online', 'in_person', 'hybrid')),
  tuition_fee_ghs  numeric(10,2) NOT NULL,
  max_slots        int NOT NULL DEFAULT 20,
  is_published     boolean NOT NULL DEFAULT false,
  thumbnail_r2_key text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE TABLE intakes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id            uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  start_date           date NOT NULL,
  end_date             date NOT NULL,
  application_deadline date,
  max_slots            int,
  enrolled_count       int NOT NULL DEFAULT 0,
  is_closed            boolean NOT NULL DEFAULT false,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE intakes ENABLE ROW LEVEL SECURITY;
