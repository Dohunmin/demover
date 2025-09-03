import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KakaoLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const KakaoLogin = ({ onSuccess, onError }: KakaoLoginProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleKakaoLogin = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      console.log('카카오 OAuth 로그인 시작...');
      
      // Supabase 공식 카카오 OAuth 사용
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('카카오 OAuth 로그인 실패:', error);
        
        if (error.message.includes('Provider not enabled')) {
          toast({
            title: "설정 오류",
            description: "카카오 로그인이 설정되지 않았습니다. 관리자에게 문의하세요.",
            variant: "destructive",
          });
          onError?.('카카오 로그인이 설정되지 않았습니다.');
        } else {
          toast({
            title: "로그인 실패",
            description: error.message,
            variant: "destructive",
          });
          onError?.(error.message);
        }
      } else {
        console.log('카카오 OAuth 리다이렉트 성공');
        // OAuth 리다이렉트가 성공하면 카카오 페이지로 이동
        // 인증 후 자동으로 돌아와서 onAuthStateChange가 호출됨
      }
    } catch (error) {
      console.error('카카오 로그인 중 예외 발생:', error);
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
    <Button
      type="button"
      onClick={handleKakaoLogin}
      disabled={loading}
      className="w-full bg-[#FEE500] hover:bg-[#FCDD00] text-black font-medium h-12 rounded-xl flex items-center justify-center gap-2 border-none"
    >
      {loading ? (
        "로그인 중..."
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C7.03 3 3 6.14 3 10.02c0 2.44 1.46 4.64 3.71 6.24L5.5 21l4.97-2.47c.51.07 1.03.11 1.53.11 4.97 0 9-3.14 9-7.02S16.97 3 12 3z"/>
          </svg>
          카카오로 로그인
        </>
      )}
    </Button>
  );
};

export default KakaoLogin;
export { type KakaoLoginProps };