ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS requires_admin_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_review_reason text;

CREATE INDEX IF NOT EXISTS applications_requires_admin_review_idx
  ON applications(requires_admin_review)
  WHERE requires_admin_review = true;
