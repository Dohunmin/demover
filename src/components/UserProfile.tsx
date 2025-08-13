import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera, Edit, Save, X, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id?: string;
  user_id?: string;
  pet_name?: string;
  pet_age?: number;
  pet_gender?: string;
  pet_breed?: string;
  pet_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Profile>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) {
      console.log('No user - skipping profile fetch');
      return;
    }

    console.log('Fetching profile for user:', user.id);
    
    try {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

      console.log('Profile fetch result:', { data, error });

      if (error) {
        console.error('프로필 로드 에러:', error);
        if (error.code !== 'PGRST116') { // PGRST116 is "not found" which is expected for new users
          toast.error(`프로필 로드 실패: ${error.message}`);
        }
      } else {
        setProfile(data as Profile);
        console.log('Profile loaded successfully:', data);
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      toast.error('프로필 로드 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = () => {
    setEditData(profile || {});
    setImagePreview(profile?.pet_image_url || null);
    setIsEditMode(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      console.log('Uploading image to bucket: pet-profiles');
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      console.log('File path:', fileName);
      
      const { error: uploadError } = await (supabase as any).storage
        .from('pet-profiles')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = (supabase as any).storage
        .from('pet-profiles')
        .getPublicUrl(fileName);

      console.log('Public URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`이미지 업로드 실패: ${error.message || 'Unknown error'}`);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user) {
      console.error('No user found!');
      toast.error('로그인이 필요합니다.');
      return;
    }
    
    console.log('Current user:', user);
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
    
    setLoading(true);

    try {
      let imageUrl = editData.pet_image_url;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // If image upload fails, don't save the profile
          return;
        }
      }

      const saveData = {
        user_id: user.id,
        pet_name: editData.pet_name || null,
        pet_age: editData.pet_age || null,
        pet_gender: editData.pet_gender || null,
        pet_breed: editData.pet_breed || null,
        pet_image_url: imageUrl || null,
        updated_at: new Date().toISOString()
      };

      // Check if profile exists
      const { data: existingProfile } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await (supabase as any)
          .from('profiles')
          .update(saveData)
          .eq('user_id', user.id);
      } else {
        // Create new profile
        result = await (supabase as any)
          .from('profiles')
          .insert({
            id: user.id,
            ...saveData,
            created_at: new Date().toISOString()
          });
      }

      if (result.error) throw result.error;

      setProfile({ ...editData, pet_image_url: imageUrl, user_id: user.id });
      setIsEditMode(false);
      setImageFile(null);
      setImagePreview(null);
      toast.success('프로필이 저장되었습니다.');
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error(`프로필 저장 실패: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.error("비밀번호를 입력해주세요.");
      return;
    }

    setIsDeleting(true);
    
    try {
      // First verify the password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: deletePassword
      });

      if (signInError) {
        toast.error("비밀번호가 올바르지 않습니다.");
        setIsDeleting(false);
        return;
      }

      // Delete profile first
      if (profile?.id) {
        const { error: profileError } = await (supabase as any)
          .from('profiles')
          .delete()
          .eq('user_id', user?.id);

        if (profileError) {
          console.error('Profile deletion error:', profileError);
        }
      }

      // Delete user roles
      const { error: rolesError } = await (supabase as any)
        .from('user_roles')
        .delete()
        .eq('user_id', user?.id);

      if (rolesError) {
        console.error('Roles deletion error:', rolesError);
      }

      // Delete storage files
      if (profile?.pet_image_url) {
        try {
          const { error: storageError } = await (supabase as any).storage
            .from('pet-profiles')
            .remove([`${user?.id}/`]);
          
          if (storageError) {
            console.error('Storage deletion error:', storageError);
          }
        } catch (error) {
          console.error('Storage cleanup error:', error);
        }
      }

      // Delete the actual user account
      const { error: deleteUserError } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (deleteUserError) {
        console.error('User deletion error:', deleteUserError);
        toast.error("계정 삭제 중 오류가 발생했습니다.");
        return;
      }

      toast.success("회원 탈퇴가 완료되었습니다.");
      
      // Redirect to home or login page
      window.location.href = '/auth';
      
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error("회원 탈퇴 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setDeletePassword("");
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCancel = () => {
    setEditData({});
    setImageFile(null);
    setImagePreview(null);
    setIsEditMode(false);
  };

  const getGenderText = (gender?: string) => {
    return gender === 'male' ? '남아' : gender === 'female' ? '여아' : '미설정';
  };

  const getAgeText = (age?: number) => {
    return age ? `${age}살` : '미설정';
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <div className="bg-white/10 border border-white/30 rounded-xl p-3 hover:bg-white/20 transition-all duration-200 cursor-pointer backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10 border-2 border-white/30 flex-shrink-0">
                <AvatarImage 
                  src={profile?.pet_image_url} 
                  alt="반려견 프로필" 
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/10 text-white">
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0 overflow-hidden">
                <div className="text-white font-semibold text-sm truncate">
                  {profile?.pet_name || '프로필 설정'}
                </div>
                <div className="text-blue-100 text-xs truncate">
                  {user?.email ? (
                    user.email.length > 20 ? 
                      `${user.email.substring(0, 18)}...` : 
                      user.email
                  ) : '이메일 정보 없음'}
                </div>
              </div>
              <div className="text-white/70 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-lg p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 text-center">
              프로필 정보
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <Avatar 
                  className="w-24 h-24 cursor-pointer transition-transform hover:scale-105" 
                  onClick={() => !isEditMode && (imagePreview || profile?.pet_image_url) && setIsImageDialogOpen(true)}
                >
                  <AvatarImage 
                    src={imagePreview || profile?.pet_image_url} 
                    alt="반려견 프로필" 
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                {isEditMode && (
                  <label className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {!isEditMode && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleEdit}
                  className="px-4 py-2 h-10"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  프로필 수정
                </Button>
              )}
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              <div className="pb-2 border-b">
                <Label className="text-sm font-medium text-gray-600">이메일</Label>
                <p className="text-gray-900 mt-1">{user?.email}</p>
              </div>

              {isEditMode ? (
                // Edit Mode
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pet_name" className="text-sm font-medium text-gray-700">반려견 이름</Label>
                      <Input
                        id="pet_name"
                        value={editData.pet_name || ''}
                        onChange={(e) => setEditData({...editData, pet_name: e.target.value})}
                        placeholder="반려견 이름을 입력하세요"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pet_age" className="text-sm font-medium text-gray-700">나이</Label>
                      <Input
                        id="pet_age"
                        type="number"
                        value={editData.pet_age || ''}
                        onChange={(e) => setEditData({...editData, pet_age: parseInt(e.target.value) || undefined})}
                        placeholder="나이를 입력하세요"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pet_gender" className="text-sm font-medium text-gray-700">성별</Label>
                      <Select
                        value={editData.pet_gender || ''}
                        onValueChange={(value: 'male' | 'female') => setEditData({...editData, pet_gender: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="성별을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">남아</SelectItem>
                          <SelectItem value="female">여아</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="pet_breed" className="text-sm font-medium text-gray-700">품종</Label>
                      <Input
                        id="pet_breed"
                        value={editData.pet_breed || ''}
                        onChange={(e) => setEditData({...editData, pet_breed: e.target.value})}
                        placeholder="품종을 입력하세요"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-6">
                    <Button 
                      onClick={handleSave} 
                      disabled={loading}
                      className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? '저장 중...' : '저장'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      className="flex-1 h-11"
                    >
                      <X className="w-4 h-4 mr-2" />
                      취소
                    </Button>
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <Label className="text-sm font-medium text-gray-600">이름</Label>
                        <p className="text-gray-900 mt-1 font-medium">{profile?.pet_name || '미설정'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <Label className="text-sm font-medium text-gray-600">나이</Label>
                        <p className="text-gray-900 mt-1 font-medium">{getAgeText(profile?.pet_age)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <Label className="text-sm font-medium text-gray-600">성별</Label>
                        <p className="text-gray-900 mt-1 font-medium">{getGenderText(profile?.pet_gender)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <Label className="text-sm font-medium text-gray-600">품종</Label>
                        <p className="text-gray-900 mt-1 font-medium">{profile?.pet_breed || '미설정'}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600">가입일</Label>
                      <p className="text-gray-900 mt-1 font-medium">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '정보 없음'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Delete Account Button - positioned at bottom right */}
          {!isEditMode && (
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-3 right-3 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  회원 탈퇴
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600">회원 탈퇴</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <div className="text-gray-700">
                      <p className="font-semibold mb-2">⚠️ 경고</p>
                      <p className="mb-4">정말로 탈퇴하시겠습니까?</p>
                      <ul className="text-sm text-gray-600 space-y-1 mb-4">
                        <li>• 모든 프로필 정보가 삭제됩니다</li>
                        <li>• 업로드한 사진들이 모두 삭제됩니다</li>
                        <li>• 이 작업은 되돌릴 수 없습니다</li>
                      </ul>
                      <div className="space-y-2">
                        <Label htmlFor="deletePassword" className="text-sm font-medium">
                          비밀번호를 한번 더 입력해주세요
                        </Label>
                        <Input
                          id="deletePassword"
                          type="password"
                          placeholder="현재 비밀번호"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setDeletePassword("");
                    setIsDeleteDialogOpen(false);
                  }}>
                    취소
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || !deletePassword.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? "탈퇴 처리 중..." : "회원 탈퇴"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Enlargement Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
          <div className="relative">
            <img
              src={profile?.pet_image_url}
              alt="반려견 프로필 확대"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsImageDialogOpen(false)}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserProfile;