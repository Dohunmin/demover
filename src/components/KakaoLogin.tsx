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

      // Supabase Auth와 연동 (이메일이 있는 경우)
      if (userInfo.email && userInfo.emailVerified) {
        // 먼저 profiles 테이블에서 기존 사용자 확인
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userInfo.email)
          .single();
        
        if (existingProfile && !profileCheckError) {
          // 기존 사용자라면 안내 메시지
          console.log('기존 사용자 발견:', existingProfile.email);
          
          toast({
            title: "이미 가입된 계정",
            description: "해당 이메일로 이미 가입된 계정이 있습니다. 일반 로그인을 이용해주세요.",
            variant: "destructive",
          });
          
          onError?.('이미 가입된 계정입니다. 일반 로그인을 이용해주세요.');
          return;
        }
        
        // 새 사용자인 경우에만 회원가입
        console.log('새 카카오 사용자 생성 시작...');
        const tempPassword = `kakao_${userInfo.kakaoId}_${Date.now()}`;
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: userInfo.email,
          password: tempPassword,
          options: {
            data: {
              nickname: userInfo.nickname,
              profile_image: userInfo.profileImage,
              kakao_id: userInfo.kakaoId,
              provider: 'kakao',
              gender: userInfo.gender,
              birthyear: userInfo.birthyear
            },
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            throw new Error('이미 가입된 이메일입니다. 일반 로그인을 이용해주세요.');
          }
          throw new Error(`회원가입 실패: ${signUpError.message}`);
        }
        
        console.log('카카오 회원가입 성공');
        
        // 회원가입 후 자동 로그인 시도
        if (signUpData.user) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: userInfo.email,
            password: tempPassword
          });
          
          if (loginError) {
            console.warn('자동 로그인 실패:', loginError);
            toast({
              title: "회원가입 완료",
              description: "이메일을 확인하여 계정을 활성화해주세요.",
            });
            return;
          } else {
            console.log('자동 로그인 성공');
          }
        }

        // 세션 확인 후 성공 처리
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          console.log('카카오 로그인 세션 확인됨:', currentSession.user.email);
          
          toast({
            title: "로그인 성공",
            description: `${userInfo.nickname}님, 환영합니다!`,
          });

          // 약간의 지연 후 콜백 실행 (세션이 완전히 설정되도록)
          setTimeout(() => {
            onSuccess?.();
          }, 500);
        } else {
          throw new Error('로그인 후 세션을 확인할 수 없습니다.');
        }
      } else {
        throw new Error('카카오 계정에 인증된 이메일이 등록되어 있지 않습니다. 카카오 계정 설정을 확인해주세요.');
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