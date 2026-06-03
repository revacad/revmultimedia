-- Server-issued application draft IDs and upload tokens for pre-auth document uploads.

CREATE TABLE application_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX application_drafts_created_at_idx ON application_drafts (created_at);

ALTER TABLE application_drafts ENABLE ROW LEVEL SECURITY;
