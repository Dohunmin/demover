-- 관리자 권한 다시 부여
INSERT INTO public.user_roles (user_id, role) 
VALUES ('2013bab1-a796-4e05-9dc4-97de77d1179c', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;