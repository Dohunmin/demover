import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PawPrint, Mail, Lock, User, ArrowLeft, Heart, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isNewPasswordMode, setIsNewPasswordMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [petName, setPetName] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petGender, setPetGender] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petImage, setPetImage] = useState<File | null>(null);
  const [petImagePreview, setPetImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPetImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPetImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPetImage = async (userId: string): Promise<string | null> => {
    if (!petImage) return null;

    try {
      const fileExt = petImage.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-profiles')
        .upload(fileName, petImage, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('pet-profiles')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
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
          emailRedirectTo: redirectUrl,
          data: {
            pet_name: petName,
            pet_age: petAge ? parseInt(petAge) : null,
            pet_gender: petGender,
            pet_breed: petBreed
          }
        }
      });

      if (error) {
        throw error;
      }

      // Upload image first if provided
      let imageUrl = null;
      if (data.user && petImage) {
        console.log('Uploading pet image...');
        imageUrl = await uploadPetImage(data.user.id);
        if (imageUrl) {
          console.log('Image uploaded successfully:', imageUrl);
        }
      }

      // If we have an image, we need to ensure the profile gets updated with it
      if (data.user && imageUrl) {
        // Wait a bit longer for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('Updating profile with image URL...');
        // Try multiple times to update the profile
        let updateAttempts = 0;
        const maxAttempts = 5;
        
        while (updateAttempts < maxAttempts) {
          const { error: updateError } = await (supabase as any)
            .from('profiles')
            .update({ pet_image_url: imageUrl })
            .eq('user_id', data.user.id);
          
          if (!updateError) {
            console.log('Profile updated with image successfully');
            break;
          } else {
            console.error(`Profile update attempt ${updateAttempts + 1} failed:`, updateError);
            updateAttempts++;
            if (updateAttempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      }

      toast.success("회원가입이 완료되었습니다! 이메일을 확인해주세요.");
      setIsSignUp(false);
    } catch (error: any) {
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
    setPetName("");
    setPetAge("");
    setPetGender("");
    setPetBreed("");
    setPetImage(null);
    setPetImagePreview(null);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsPasswordReset(false);
    setIsNewPasswordMode(false);
    resetForm();
  };

  const togglePasswordReset = () => {
    setIsPasswordReset(!isPasswordReset);
    setIsSignUp(false);
    setIsNewPasswordMode(false);
    resetForm();
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
              {isNewPasswordMode ? "새 비밀번호 설정" : isPasswordReset ? "비밀번호 재설정" : isSignUp ? "회원가입" : "로그인"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={isNewPasswordMode ? handleNewPasswordSubmit : isPasswordReset ? handlePasswordReset : isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
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

              {isSignUp && !isNewPasswordMode && (
                <>
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

                  {/* Pet Information Section */}
                  <div className="border-t pt-4 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <Label className="text-sm font-medium text-gray-700">반려견 정보</Label>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="petName" className="text-sm font-medium text-gray-700">
                          반려견 이름
                        </Label>
                        <div className="relative">
                          <PawPrint className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="petName"
                            type="text"
                            placeholder="반려견 이름을 입력하세요"
                            value={petName}
                            onChange={(e) => setPetName(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="petAge" className="text-sm font-medium text-gray-700">
                            나이
                          </Label>
                          <Input
                            id="petAge"
                            type="number"
                            placeholder="나이"
                            value={petAge}
                            onChange={(e) => setPetAge(e.target.value)}
                            min="0"
                            max="30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="petGender" className="text-sm font-medium text-gray-700">
                            성별
                          </Label>
                          <Select value={petGender} onValueChange={setPetGender}>
                            <SelectTrigger>
                              <SelectValue placeholder="성별" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">남아</SelectItem>
                              <SelectItem value="female">여아</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                       <div className="space-y-2">
                         <Label htmlFor="petBreed" className="text-sm font-medium text-gray-700">
                           견종
                         </Label>
                         <Input
                           id="petBreed"
                           type="text"
                           placeholder="견종을 입력하세요 (예: 골든리트리버)"
                           value={petBreed}
                           onChange={(e) => setPetBreed(e.target.value)}
                         />
                       </div>

                       <div className="space-y-2">
                         <Label className="text-sm font-medium text-gray-700">
                           반려견 사진
                         </Label>
                         <div className="flex flex-col items-center gap-3">
                           {petImagePreview ? (
                             <div className="relative">
                               <img
                                 src={petImagePreview}
                                 alt="반려견 미리보기"
                                 className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                               />
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={() => {
                                   setPetImage(null);
                                   setPetImagePreview(null);
                                 }}
                                 className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                               >
                                 ×
                               </Button>
                             </div>
                           ) : (
                             <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center border-2 border-dashed border-secondary/40">
                               <ImageIcon className="w-8 h-8 text-secondary/60" />
                             </div>
                           )}
                           <div className="w-full">
                             <Input
                               type="file"
                               accept="image/*"
                               onChange={handleImageChange}
                               className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                             />
                           </div>
                         </div>
                       </div>
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? "처리중..." : isNewPasswordMode ? "비밀번호 변경" : isPasswordReset ? "재설정 이메일 발송" : isSignUp ? "회원가입" : "로그인"}
              </Button>
            </form>

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