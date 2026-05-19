CREATE SEQUENCE application_seq START 1;
CREATE SEQUENCE invoice_apf_seq START 1;
CREATE SEQUENCE invoice_inv_seq START 1;
CREATE SEQUENCE student_seq START 1;

CREATE TABLE system_settings (
  key          text PRIMARY KEY,
  value        text,
  description  text,
  updated_at   timestamptz DEFAULT now(),
  updated_by   uuid
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO system_settings (key, value, description) VALUES
  ('application_fee_ghs', '', 'Application fee in GHS'),
  ('application_seq_year', to_char(now(), 'YYYY'), 'Year for application reference sequence reset'),
  ('invoice_apf_seq_year', to_char(now(), 'YYYY'), 'Year for REVAPF invoice sequence reset'),
  ('invoice_inv_seq_year', to_char(now(), 'YYYY'), 'Year for REVINV invoice sequence reset'),
  ('student_seq_year', to_char(now(), 'YYYY'), 'Year for student ID sequence reset'),
  ('momo_number_1', '', 'Primary MoMo number'),
  ('momo_name_1', '', 'Primary MoMo account name'),
  ('momo_number_2', '', 'Secondary MoMo number'),
  ('momo_name_2', '', 'Secondary MoMo account name'),
  ('bank_name', '', 'Bank name'),
  ('bank_account_number', '', 'Bank account number'),
  ('bank_account_name', '', 'Bank account name'),
  ('bank_branch', '', 'Bank branch'),
  ('bank_swift_code', '', 'SWIFT/BIC code'),
  ('bank_iban', '', 'IBAN'),
  ('bank_routing_number', '', 'Routing number'),
  ('paystack_public_key', '', 'Paystack public key'),
  ('sentdm_sender_id', '', 'Sent.dm sender ID'),
  ('academy_email', '', 'Academy contact email'),
  ('academy_phone', '', 'Academy contact phone'),
  ('academy_address', '', 'Academy physical address'),
  ('application_deadline_message', '', 'Message shown on application form');
