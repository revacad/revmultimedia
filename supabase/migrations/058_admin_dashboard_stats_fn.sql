CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_applications', (SELECT COUNT(*) FROM applications),
    'pending_applications', (
      SELECT COUNT(*) FROM applications WHERE status = 'pending'
    ),
    'total_students', (SELECT COUNT(*) FROM students),
    'total_revenue_ghs', (
      SELECT COALESCE(SUM(collected.paid_amount), 0)
      FROM (
        SELECT
          CASE
            WHEN i.status = 'paid'
              AND i.payment_method = 'paystack'
              AND i.paystack_reference IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM installments inst WHERE inst.invoice_id = i.id
              )
            THEN i.total_ghs
            ELSE COALESCE((
              SELECT SUM(inst.amount_ghs)
              FROM installments inst
              WHERE inst.invoice_id = i.id
            ), 0)
          END AS paid_amount
        FROM invoices i
      ) collected
    ),
    'outstanding_tuition_ghs', (
      SELECT COALESCE(SUM(GREATEST(0, tuition.remaining)), 0)
      FROM (
        SELECT
          i.total_ghs - CASE
            WHEN i.status = 'paid'
              AND i.payment_method = 'paystack'
              AND i.paystack_reference IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM installments inst WHERE inst.invoice_id = i.id
              )
            THEN i.total_ghs
            ELSE COALESCE((
              SELECT SUM(inst.amount_ghs)
              FROM installments inst
              WHERE inst.invoice_id = i.id
            ), 0)
          END AS remaining
        FROM invoices i
        WHERE i.type = 'tuition'
          AND i.status IN ('unpaid', 'partially_paid')
      ) tuition
    ),
    'pending_payments_count', (
      SELECT COUNT(*)
      FROM invoices
      WHERE status IN ('unpaid', 'partially_paid')
    ),
    'recent_applications', (
      SELECT COALESCE(jsonb_agg(r ORDER BY r.created_at DESC), '[]'::jsonb)
      FROM (
        SELECT
          a.id,
          a.reference,
          a.status,
          a.created_at,
          COALESCE(s.full_name, a.full_name) AS student_name,
          c.title AS course_title
        FROM applications a
        LEFT JOIN students s ON s.application_id = a.id
        LEFT JOIN courses c ON c.id = a.course_id
        ORDER BY a.created_at DESC
        LIMIT 5
      ) r
    ),
    'revenue_by_month', (
      SELECT COALESCE(jsonb_agg(r ORDER BY r.month_sort), '[]'::jsonb)
      FROM (
        SELECT
          TO_CHAR(month_bucket, 'Mon YYYY') AS month,
          month_bucket AS month_sort,
          SUM(total_ghs) AS total_ghs
        FROM (
          SELECT
            DATE_TRUNC('month', inst.paid_at) AS month_bucket,
            inst.amount_ghs AS total_ghs
          FROM installments inst
          WHERE inst.paid_at >= NOW() - INTERVAL '6 months'
          UNION ALL
          SELECT
            DATE_TRUNC('month', i.updated_at) AS month_bucket,
            i.total_ghs AS total_ghs
          FROM invoices i
          WHERE i.status = 'paid'
            AND i.payment_method = 'paystack'
            AND i.paystack_reference IS NOT NULL
            AND i.updated_at >= NOW() - INTERVAL '6 months'
            AND NOT EXISTS (
              SELECT 1 FROM installments inst WHERE inst.invoice_id = i.id
            )
        ) payments
        GROUP BY month_bucket
        ORDER BY month_bucket
      ) r
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated, service_role;
