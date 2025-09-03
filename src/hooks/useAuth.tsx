import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email || 'No user');
            
            // 세션 상태 업데이트
            setSession(session);
            setUser(session?.user ?? null);
            
            // 로그인 이벤트 처리
            if (event === 'SIGNED_IN' && session) {
              console.log('User signed in successfully:', session.user.email);
            }
            
            // 로딩 상태 해제는 약간 지연
            setTimeout(() => {
              setLoading(false);
            }, 100);
          }
        );

        // THEN check for existing session
        try {
          console.log('Checking existing session...');
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Auth session error:', error.message);
            // 에러가 있어도 계속 진행
          }
          console.log('Session found:', session?.user?.email || 'No session');
          
          // 초기 세션 설정
          setSession(session);
          setUser(session?.user ?? null);
        } catch (sessionError) {
          console.warn('Failed to get session:', sessionError);
          // 세션을 가져올 수 없어도 계속 진행
          setSession(null);
          setUser(null);
        }
        
        // 초기 로딩 완료
        setLoading(false);

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth initialization error:', error);
        // 에러가 발생해도 앱이 작동하도록 함
        setLoading(false);
        setSession(null);
        setUser(null);
      }
    };

    initAuth();
  }, []);

  const signOut = async () => {
    try {
      console.log('로그아웃 시작...');
      
      // Supabase 로그아웃
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase 로그아웃 오류:', error);
      } else {
        console.log('Supabase 로그아웃 성공');
      }
      
      // 상태 강제 초기화 (로그아웃 성공/실패 상관없이)
      setSession(null);
      setUser(null);
      
      // 로컬 스토리지 정리
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('kakaoAuthCode');
      localStorage.removeItem('kakaoRedirectUri');
      localStorage.removeItem('forcePasswordReset');
      
      console.log('로그아웃 완료 - 상태 초기화됨');
      
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      
      // 오류가 발생해도 상태 강제 초기화
      setSession(null);
      setUser(null);
      
      // 로컬 스토리지 정리
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('kakaoAuthCode');
      localStorage.removeItem('kakaoRedirectUri');
      localStorage.removeItem('forcePasswordReset');
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};