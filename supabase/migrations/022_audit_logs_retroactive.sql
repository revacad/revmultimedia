-- Retroactive audit log entries (run once in Supabase SQL Editor if not applied via migration)
TRUNCATE audit_logs;

INSERT INTO audit_logs (action, entity_type, entity_id, new_value, created_at)
SELECT
  'application.submitted',
  'application',
  id,
  json_build_object(
    'reference', reference,
    'full_name', full_name,
    'status', status
  ),
  created_at
FROM applications;

INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, new_value, created_at)
SELECT
  i.confirmed_by_admin_id,
  'payment.confirmed',
  'installment',
  i.id,
  json_build_object(
    'amount_ghs', i.amount_ghs,
    'payment_method', i.payment_method
  ),
  i.paid_at
FROM installments i
WHERE i.confirmed_by_admin_id IS NOT NULL;

INSERT INTO audit_logs (action, entity_type, entity_id, new_value, created_at)
SELECT
  'student.enrolled',
  'student',
  id,
  json_build_object(
    'student_id', student_id,
    'full_name', full_name
  ),
  created_at
FROM students;

INSERT INTO audit_logs (action, entity_type, entity_id, new_value, created_at)
SELECT
  'invoice.generated',
  'invoice',
  id,
  json_build_object(
    'reference', reference,
    'type', type,
    'amount', total_ghs
  ),
  created_at
FROM invoices;
