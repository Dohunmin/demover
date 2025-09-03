-- 기존 카카오 사용자들을 위한 identity 추가
-- 먼저 기존 카카오 사용자 확인
DO $$
DECLARE
    kakao_user_id UUID;
BEGIN
    -- gnsals9262@naver.com 사용자 찾기
    SELECT id INTO kakao_user_id 
    FROM auth.users 
    WHERE email = 'gnsals9262@naver.com';
    
    IF kakao_user_id IS NOT NULL THEN
        -- 카카오 identity가 없다면 추가
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        )
        SELECT 
            gen_random_uuid(),
            kakao_user_id,
            jsonb_build_object(
                'iss', 'https://kauth.kakao.com',
                'sub', '4427394573',
                'email', 'gnsals9262@naver.com',
                'email_verified', true,
                'name', '도훈민',
                'provider_id', '4427394573'
            ),
            'kakao',
            now(),
            now(),
            now()
        WHERE NOT EXISTS (
            SELECT 1 FROM auth.identities 
            WHERE user_id = kakao_user_id AND provider = 'kakao'
        );
    END IF;
END $$;