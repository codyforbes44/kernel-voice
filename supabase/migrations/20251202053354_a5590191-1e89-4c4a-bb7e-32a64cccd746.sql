-- Promote user c@3bi.io to admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('e9d7c670-3168-4080-b764-733e7cddcaad', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;