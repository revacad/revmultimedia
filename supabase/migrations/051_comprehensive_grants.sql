-- Comprehensive role grants for service_role, authenticated, and anon
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.intakes TO anon;
GRANT SELECT ON public.senior_high_schools TO anon;
GRANT SELECT ON public.payment_types TO anon;
GRANT SELECT ON public.system_settings TO anon;
