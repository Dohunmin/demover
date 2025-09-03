import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PawPrint, Mail, Lock, ArrowLeft, User, Phone, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import KakaoLogin from "@/components/KakaoLogin";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isNewPasswordMode, setIsNewPasswordMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 일반 회원가입 추가 정보
  const [userName, setUserName] = useState("");
  const [userAccount, setUserAccount] = useState("");
  const [userGender, setUserGender] = useState("");
  const [userAgeGroup, setUserAgeGroup] = useState("");
  const [userBirthYear, setUserBirthYear] = useState("");
  
  // 회원가입 단계 관리
  const [signUpStep, setSignUpStep] = useState(1); // 1: 개인정보, 2: 계정정보
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check URL parameters FIRST for password reset
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const tokenHashParam = urlParams.get('token_hash');
    
    // If this is a recovery URL, immediately set to password change mode
    if (typeParam === 'recovery' && tokenHashParam) {
      // Mark this as a forced password reset in localStorage
      localStorage.setItem('forcePasswordReset', 'true');
      setIsNewPasswordMode(true);
      setIsPasswordReset(false);
      setIsSignUp(false);
      toast.info("보안을 위해 새 비밀번호를 설정해주세요.");
      return; // Don't continue with other logic
    }

    // Check if we should force password reset from localStorage
    if (localStorage.getItem('forcePasswordReset') === 'true') {
      setIsNewPasswordMode(true);
      setIsPasswordReset(false);
      setIsSignUp(false);
      return;
    }

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          localStorage.setItem('forcePasswordReset', 'true');
          setIsNewPasswordMode(true);
          setIsPasswordReset(false);
          setIsSignUp(false);
          toast.info("새 비밀번호를 설정해주세요.");
        } else if (event === 'SIGNED_IN' && session) {
          // If we have forcePasswordReset flag, don't redirect to home
          if (localStorage.getItem('forcePasswordReset') === 'true') {
            setIsNewPasswordMode(true);
            setIsPasswordReset(false);
            setIsSignUp(false);
            toast.info("보안을 위해 새 비밀번호를 설정해주세요.");
          } else {
            // Check if this is a first-time login after email confirmation
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email_confirmed_at) {
              // Check if profile exists
              const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
              
              if (!profile) {
                // This is a new user who just confirmed their email
                toast.success("회원가입이 완료되었습니다!");
              }
            }
            
            // Normal login, redirect to home
            navigate("/");
          }
        }
      }
    );

    // Check if user is already logged in (but not during password reset)
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && localStorage.getItem('forcePasswordReset') !== 'true') {
        navigate("/");
      }
    };
    
    if (typeParam !== 'recovery') {
      checkUser();
    }

    return () => subscription.unsubscribe();
  }, [navigate]);


  const handlePersonalInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    
    if (!userAccount.trim()) {
      toast.error("카카오 계정을 입력해주세요.");
      return;
    }
    
    // 1단계 완료, 2단계로 진행
    setSignUpStep(2);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("사용자 생성에 실패했습니다.");
      }

      toast.info("이메일을 확인해주세요.");
      setIsSignUp(false);
      setSignUpStep(1); // 단계 초기화
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message.includes("already registered")) {
        toast.error("이미 가입된 이메일입니다.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("이메일 또는 비밀번호가 잘못되었습니다.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("로그인 성공!");
      navigate("/");
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("이메일을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.");
        setIsPasswordReset(false);
      }
    } catch (error) {
      toast.error("오류가 발생했습니다. 다시 시도해주세요.");
    }

    setLoading(false);
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      toast.error("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      // Check if user has a valid session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("세션이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.");
        setIsNewPasswordMode(false);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(error.message);
      } else {
        // Clear the forced password reset flag
        localStorage.removeItem('forcePasswordReset');
        
        toast.success("비밀번호가 성공적으로 변경되었습니다!");
        // Clear URL parameters and reset to login mode
        window.history.replaceState({}, document.title, "/auth");
        setIsNewPasswordMode(false);
        setIsPasswordReset(false);
        setIsSignUp(false);
        setNewPassword("");
        setConfirmNewPassword("");
        setPassword("");
        
        // Sign out and redirect to login
        await supabase.auth.signOut();
        toast.info("새 비밀번호로 다시 로그인해주세요.");
      }
    } catch (error) {
      toast.error("비밀번호 변경에 실패했습니다. 다시 시도해주세요.");
    }

    setLoading(false);
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setUserName("");
    setUserAccount("");
    setUserGender("");
    setUserAgeGroup("");
    setUserBirthYear("");
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsPasswordReset(false);
    setIsNewPasswordMode(false);
    setSignUpStep(1); // 단계 초기화
    resetForm();
  };

  const togglePasswordReset = () => {
    setIsPasswordReset(!isPasswordReset);
    setIsSignUp(false);
    setIsNewPasswordMode(false);
    resetForm();
  };

  // 카카오 로그인 성공 핸들러
  const handleKakaoSuccess = () => {
    console.log('카카오 로그인 성공 콜백 호출됨');
    // Supabase OAuth는 자동으로 리다이렉트하므로 별도 처리 불필요
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">멍멍! 일단 출발해!</h1>
          </div>
          <p className="text-gray-600">반려견과 함께하는 스마트한 여행</p>
        </div>

        {/* Auth Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-gray-900">
              {isNewPasswordMode ? "새 비밀번호 설정" : 
               isPasswordReset ? "비밀번호 재설정" : 
               isSignUp ? (signUpStep === 1 ? "회원가입 - 개인정보" : "회원가입 - 계정정보") : 
               "로그인"}
            </CardTitle>
            {isSignUp && (
              <div className="flex justify-center mt-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${signUpStep === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                  <div className={`w-3 h-3 rounded-full ${signUpStep === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 1단계: 개인정보 입력 */}
            {isSignUp && signUpStep === 1 && (
              <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
                {/* 필수 입력 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">필수 입력 정보</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="userName" className="text-sm font-medium text-gray-700">
                        이름 *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="userName"
                          type="text"
                          placeholder="실명을 입력하세요"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                       <Label htmlFor="userAccount" className="text-sm font-medium text-gray-700">
                        카카오 계정 (전화번호) *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="userAccount"
                          type="text"
                          placeholder="카카오 계정을 입력하세요"
                          value={userAccount}
                          onChange={(e) => setUserAccount(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 선택 입력 정보 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">선택 입력 정보</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="userGender" className="text-sm font-medium text-gray-700">
                        성별
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <select
                          id="userGender"
                          value={userGender}
                          onChange={(e) => setUserGender(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">선택하세요</option>
                          <option value="male">남성</option>
                          <option value="female">여성</option>
                          <option value="other">기타</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="userAgeGroup" className="text-sm font-medium text-gray-700">
                        연령대
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <select
                          id="userAgeGroup"
                          value={userAgeGroup}
                          onChange={(e) => setUserAgeGroup(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">선택하세요</option>
                          <option value="10s">10대</option>
                          <option value="20s">20대</option>
                          <option value="30s">30대</option>
                          <option value="40s">40대</option>
                          <option value="50s">50대</option>
                          <option value="60plus">60대 이상</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="userBirthYear" className="text-sm font-medium text-gray-700">
                        출생 연도
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="userBirthYear"
                          type="number"
                          placeholder="예: 1990"
                          value={userBirthYear}
                          onChange={(e) => setUserBirthYear(e.target.value)}
                          className="pl-10"
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  다음 단계
                </Button>
              </form>
            )}

            {/* 2단계: 계정정보 입력 또는 일반 로그인/비밀번호 재설정 */}
            {(!isSignUp || signUpStep === 2) && (
              <form onSubmit={isNewPasswordMode ? handleNewPasswordSubmit : isPasswordReset ? handlePasswordReset : isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {signUpStep === 2 && (
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSignUpStep(1)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      이전 단계
                    </Button>
                  </div>
                )}

                {!isNewPasswordMode && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      이메일
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="이메일을 입력하세요"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                {isNewPasswordMode && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                        새 비밀번호
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="새 비밀번호를 입력하세요 (6자 이상)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword" className="text-sm font-medium text-gray-700">
                        새 비밀번호 확인
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmNewPassword"
                          type="password"
                          placeholder="새 비밀번호를 다시 입력하세요"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {!isPasswordReset && !isNewPasswordMode && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      비밀번호
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                {isSignUp && signUpStep === 2 && !isNewPasswordMode && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      비밀번호 확인
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "처리중..." : isNewPasswordMode ? "비밀번호 변경" : isPasswordReset ? "재설정 이메일 발송" : isSignUp ? "회원가입 완료" : "로그인"}
                </Button>
              </form>
            )}

            {/* 카카오 로그인 섹션 */}
            {!isPasswordReset && !isNewPasswordMode && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">또는</p>
                </div>
                <KakaoLogin 
                  onSuccess={handleKakaoSuccess}
                />
              </div>
            )}

            <div className="text-center space-y-2">
              {!isPasswordReset && !isNewPasswordMode && (
                <button
                  onClick={toggleMode}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium block w-full"
                >
                  {isSignUp ? "이미 계정이 있나요? 로그인" : "계정이 없나요? 회원가입"}
                </button>
              )}
              
              {!isSignUp && !isNewPasswordMode && (
                <button
                  onClick={togglePasswordReset}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  {isPasswordReset ? "로그인으로 돌아가기" : "비밀번호를 잊으셨나요?"}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;