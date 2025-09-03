import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KakaoLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const KakaoLogin = ({ onSuccess, onError }: KakaoLoginProps) => {
  const [loading, setLoading] = useState(false);
  const [kakaoClientId, setKakaoClientId] = useState<string>('');
  const { toast } = useToast();

  // 카카오 API 키 가져오기 및 콜백 처리
  useEffect(() => {
    const initKakaoAuth = async () => {
      try {
        // localStorage에서 콜백 code 확인
        const savedCode = localStorage.getItem('kakaoAuthCode');
        const savedRedirectUri = localStorage.getItem('kakaoRedirectUri');
        
        if (savedCode && savedRedirectUri) {
          console.log('저장된 카카오 인가 코드 발견:', savedCode);
          // 저장된 정보 정리
          localStorage.removeItem('kakaoAuthCode');
          localStorage.removeItem('kakaoRedirectUri');
          
          // 콜백 처리 실행
          await handleKakaoCallback(savedCode, savedRedirectUri);
          return;
        }

        // 카카오 API 키 가져오기
        const { data, error } = await supabase.functions.invoke('test-api-key');
        
        if (error || !data?.kakaoJsKey) {
          console.error('카카오 API 키를 가져올 수 없습니다:', error);
          setKakaoClientId('');
          return;
        }
        
        setKakaoClientId(data.kakaoJsKey);
        console.log('카카오 클라이언트 ID 설정됨');
        
      } catch (error) {
        console.error('카카오 인증 초기화 실패:', error);
      }
    };

    initKakaoAuth();
  }, []);

  const handleKakaoLogin = () => {
    if (loading || !kakaoClientId) {
      if (!kakaoClientId) {
        toast({
          title: "설정 오류",
          description: "카카오 API 키가 설정되지 않았습니다.",
          variant: "destructive",
        });
      }
      return;
    }
    
    setLoading(true);

    const REDIRECT_URI = `${window.location.origin}/auth`;
    const SCOPES = ['profile_nickname', 'account_email', 'gender'];

    // 카카오 OAuth 인증 URL 생성
    const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
    kakaoAuthUrl.searchParams.append('client_id', kakaoClientId);
    kakaoAuthUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    kakaoAuthUrl.searchParams.append('response_type', 'code');
    kakaoAuthUrl.searchParams.append('scope', SCOPES.join(','));
    kakaoAuthUrl.searchParams.append('state', Math.random().toString(36).substr(2, 11)); // CSRF 보호

    console.log('카카오 로그인 시작:', kakaoAuthUrl.toString());
    
    // 카카오 로그인 페이지로 리다이렉트
    window.location.href = kakaoAuthUrl.toString();
  };

  // URL에서 인가 코드를 처리하는 함수
  const handleKakaoCallback = async (code: string, redirectUri: string) => {
    try {
      setLoading(true);
      console.log('카카오 콜백 처리 시작, code:', code);

      // Edge Function 호출하여 토큰 교환 및 사용자 정보 가져오기
      const { data, error } = await supabase.functions.invoke('kakao-auth', {
        body: {
          code: code,
          redirectUri: redirectUri
        }
      });

      if (error) {
        console.error('카카오 OAuth 처리 실패:', error);
        throw new Error(error.message || '카카오 로그인 처리 중 오류가 발생했습니다.');
      }

      if (!data.success) {
        throw new Error(data.error || '카카오 로그인에 실패했습니다.');
      }

      const userInfo = data.userInfo;
      console.log('카카오 사용자 정보 받음:', userInfo);

      // 카카오 로그인 처리 (일반 로그인과 완전 분리)
      if (userInfo.email && userInfo.emailVerified) {
        console.log('카카오 사용자 로그인 처리 시작');
        
        // 카카오 전용 임시 패스워드 생성 (고정값)
        const kakaoPassword = `KAKAO_USER_${userInfo.kakaoId}`;
        
        try {
          // 1. 먼저 기존 카카오 사용자로 로그인 시도
          console.log('기존 카카오 사용자 로그인 시도');
          const { data: loginResult, error: loginError } = await supabase.auth.signInWithPassword({
            email: userInfo.email,
            password: kakaoPassword
          });

          if (loginResult.user && !loginError) {
            console.log('기존 카카오 사용자 로그인 성공');
            
            // 프로필 정보 업데이트
            await supabase
              .from('profiles')
              .update({
                full_name: userInfo.nickname,
                avatar_url: userInfo.profileImage,
                gender: userInfo.gender,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', loginResult.user.id);

            toast({
              title: "로그인 성공",
              description: `${userInfo.nickname}님, 환영합니다!`,
            });

            setTimeout(() => {
              onSuccess?.();
            }, 1000);
            return;
          }
        } catch (firstLoginError) {
          console.log('기존 사용자 로그인 실패, 새 사용자 생성 시도');
        }

        try {
          // 2. 새 카카오 사용자 회원가입
          console.log('새 카카오 사용자 회원가입 시도');
          const { data: signupResult, error: signupError } = await supabase.auth.signUp({
            email: userInfo.email,
            password: kakaoPassword,
            options: {
              data: {
                nickname: userInfo.nickname,
                profile_image: userInfo.profileImage,
                kakao_id: userInfo.kakaoId.toString(),
                provider: 'kakao',
                gender: userInfo.gender,
                birthyear: userInfo.birthyear
              }
            }
          });

          if (signupError) {
            if (signupError.message.includes('already registered')) {
              // 일반 사용자로 이미 가입된 경우
              throw new Error('해당 이메일로 이미 가입된 계정이 있습니다. 일반 로그인을 이용해주세요.');
            }
            throw new Error(`카카오 회원가입 실패: ${signupError.message}`);
          }

          console.log('카카오 회원가입 성공');

          // 3. 회원가입 후 자동 로그인
          const { data: autoLoginResult, error: autoLoginError } = await supabase.auth.signInWithPassword({
            email: userInfo.email,
            password: kakaoPassword
          });

          if (autoLoginResult.user && !autoLoginError) {
            console.log('카카오 회원가입 후 자동 로그인 성공');
            
            toast({
              title: "가입 및 로그인 성공",
              description: `${userInfo.nickname}님, 환영합니다!`,
            });

            setTimeout(() => {
              onSuccess?.();
            }, 1000);
          } else {
            throw new Error('회원가입은 성공했지만 자동 로그인에 실패했습니다.');
          }

        } catch (signupError) {
          console.error('카카오 회원가입 실패:', signupError);
          throw signupError;
        }

      } else {
        throw new Error('카카오 계정에 인증된 이메일이 등록되어 있지 않습니다.');
      }

    } catch (error) {
      console.error('카카오 로그인 처리 중 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '카카오 로그인 중 오류가 발생했습니다.';
      
      toast({
        title: "로그인 실패",
        description: errorMessage,
        variant: "destructive",
      });

      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleKakaoLogin}
        disabled={loading || !kakaoClientId}
        className="w-full bg-[#FEE500] hover:bg-[#FCDD00] text-black font-medium h-12 rounded-xl flex items-center justify-center gap-2 border-none"
      >
        {loading ? (
          "로그인 중..."
        ) : !kakaoClientId ? (
          "카카오 API 키 로딩 중..."
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C7.03 3 3 6.14 3 10.02c0 2.44 1.46 4.64 3.71 6.24L5.5 21l4.97-2.47c.51.07 1.03.11 1.53.11 4.97 0 9-3.14 9-7.02S16.97 3 12 3z"/>
            </svg>
            카카오로 로그인
          </>
        )}
      </Button>
    </>
  );
};

export default KakaoLogin;
export { type KakaoLoginProps };