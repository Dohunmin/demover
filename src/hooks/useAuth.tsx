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
      
      // 상태를 먼저 초기화하여 UI가 즉시 반응하도록 함
      setSession(null);
      setUser(null);
      
      // Supabase 로그아웃을 먼저 수행 (scope: 'global'로 모든 세션 종료)
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        
        if (error) {
          // 403이나 session not found 오류는 이미 로그아웃된 상태이므로 무시
          if (error.message?.includes('Session not found') || 
              error.message?.includes('session_not_found') ||
              error.status === 403) {
            console.log('이미 로그아웃된 상태입니다.');
          } else {
            console.warn('Supabase 로그아웃 경고:', error.message);
          }
        } else {
          console.log('Supabase 전체 세션 로그아웃 성공');
        }
      } catch (authError) {
        console.warn('Supabase 로그아웃 중 오류:', authError);
      }
      
      // 완전한 로컬 스토리지 정리
      try {
        // 특정 키들 제거
        const specificKeys = [
          'supabase.auth.token',
          'kakaoAuthCode', 
          'kakaoRedirectUri',
          'forcePasswordReset'
        ];
        
        specificKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`키 ${key} 제거 실패:`, e);
          }
        });
        
        // Supabase 관련 모든 키 제거
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('supabase.auth.') || key.startsWith('sb-'))) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
            console.log(`Supabase 키 제거: ${key}`);
          } catch (e) {
            console.warn(`키 ${key} 제거 실패:`, e);
          }
        });
        
        console.log('로컬 스토리지 완전 정리 완료');
      } catch (storageError) {
        console.warn('로컬 스토리지 정리 중 오류:', storageError);
      }
      
      // sessionStorage도 정리
      try {
        const sessionKeys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.startsWith('supabase.auth.') || key.startsWith('sb-'))) {
            sessionKeys.push(key);
          }
        }
        
        sessionKeys.forEach(key => {
          try {
            sessionStorage.removeItem(key);
            console.log(`세션 스토리지 키 제거: ${key}`);
          } catch (e) {
            console.warn(`세션 키 ${key} 제거 실패:`, e);
          }
        });
      } catch (sessionError) {
        console.warn('세션 스토리지 정리 중 오류:', sessionError);
      }
      
      console.log('로그아웃 완료 - 모든 세션 정보 삭제됨');
      
    } catch (error) {
      console.error('로그아웃 중 예상치 못한 오류:', error);
      
      // 어떤 오류가 발생해도 상태는 반드시 초기화
      setSession(null);
      setUser(null);
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