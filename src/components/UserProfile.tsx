import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Heart, Calendar, Dog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  pet_name: string | null;
  pet_age: number | null;
  pet_gender: string | null;
  pet_breed: string | null;
  created_at: string;
  updated_at: string;
}

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('프로필 로드 에러:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGenderText = (gender: string | null) => {
    if (gender === 'male') return '남아';
    if (gender === 'female') return '여아';
    return '미설정';
  };

  const getAgeText = (age: number | null) => {
    return age ? `${age}살` : '미설정';
  };

  if (loading) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-blue-700 backdrop-blur-sm font-medium"
          >
            <User className="w-4 h-4 mr-1" />
            프로필
          </Button>
        </DialogTrigger>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-blue-700 backdrop-blur-sm font-medium"
        >
          <User className="w-4 h-4 mr-1" />
          프로필
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">내 프로필</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 사용자 정보 */}
          <div className="text-center">
            <Avatar className="w-20 h-20 mx-auto mb-4">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-lg text-gray-900">{user?.email}</h3>
          </div>

          {/* 반려견 정보 */}
          <Card className="border-pink-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-pink-700">
                <Heart className="w-4 h-4" />
                반려견 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile?.pet_name ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">이름</span>
                    <div className="flex items-center gap-2">
                      <Dog className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{profile.pet_name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">나이</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{getAgeText(profile.pet_age)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">성별</span>
                    <Badge variant={profile.pet_gender === 'male' ? 'default' : 'secondary'}>
                      {getGenderText(profile.pet_gender)}
                    </Badge>
                  </div>
                  
                  {profile.pet_breed && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">견종</span>
                      <span className="font-medium">{profile.pet_breed}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Dog className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">반려견 정보가 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 가입일 */}
          <div className="text-center text-xs text-gray-500">
            가입일: {new Date(profile?.created_at || '').toLocaleDateString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;