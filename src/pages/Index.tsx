import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PawPrint, Sparkles, LogOut, Settings } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import CategoryGrid from "@/components/CategoryGrid";
import BeachStatus from "@/components/BeachStatus";
import UserProfile from "@/components/UserProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HeroCarousel from "@/components/HeroCarousel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Check admin role when user changes
  useEffect(() => {
    if (user) {
      checkAdminRole();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (error) {
        setIsAdmin(false);
        return;
      }
      
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  // 로그인하지 않은 사용자도 메인 페이지를 볼 수 있도록 리다이렉트 제거

  const handleSignOut = async () => {
    await signOut();
    toast.success("로그아웃되었습니다.");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자를 위한 페이지
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative overflow-x-hidden">
        {/* Header */}
        <header className="bg-[#DAF4EF] text-foreground p-6 rounded-b-3xl relative overflow-hidden">
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <PawPrint className="w-6 h-6 text-[#222222]" />
                  <h1 className="text-xl font-bold text-[#222222]">멍멍! 일단 출발해!</h1>
                </div>
                <p className="text-[#555555] text-sm font-medium">반려견과 함께하는 스마트한 여행</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/auth")}
                className="bg-[#5EE8E8] border-[#5EE8E8] text-white hover:bg-[#5EE8E8]/90 rounded-xl font-medium"
              >
                로그인
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pb-20 -mt-4">
          {/* Welcome Section */}
          <div className="px-5 py-6">
            <Card className="p-6 text-center bg-white border-0 shadow-lg rounded-2xl relative overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-60"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  반려견과 함께하는 특별한 여행
                </h2>
                <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                  로그인하고 우리 강아지에게 맞는<br />완벽한 여행지를 찾아보세요
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate("/auth")}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <PawPrint className="w-4 h-4 mr-2" />
                    로그인 / 회원가입
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Preview Content */}
          <CategoryGrid />
          <BeachStatus />
        </main>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative overflow-x-hidden">
      {/* Header */}
      <header className="bg-[#DAF4EF] text-foreground p-6 rounded-b-3xl relative overflow-hidden">
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <PawPrint className="w-6 h-6 text-[#222222]" />
                <h1 className="text-xl font-bold text-[#222222]">멍멍! 일단 출발해!</h1>
              </div>
              <p className="text-[#555555] text-sm font-medium">반려견과 함께하는 스마트한 여행</p>
            </div>
            
            {/* Admin Button - Top Right */}
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/admin")}
                className="bg-[#5EE8E8] border-[#5EE8E8] text-white hover:bg-[#5EE8E8]/90 rounded-xl font-medium mb-2"
              >
                <Settings className="w-4 h-4 mr-1" />
                관리자
              </Button>
            )}
          </div>

          {/* Enhanced Profile Section */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-1 min-w-0">
              <UserProfile />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="bg-[#5EE8E8] border-[#5EE8E8] text-white hover:bg-[#5EE8E8]/90 rounded-xl font-medium flex-shrink-0"
            >
              <LogOut className="w-4 h-4 mr-1" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 -mt-4">
        {/* MBTI Test Section */}
        <div className="px-5 py-6">
          <Card className="p-6 text-center bg-white border-0 shadow-lg rounded-2xl relative overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-60"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                우리 강아지는 어떤 여행 스타일?
              </h2>
              <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                반려견의 성격에 맞는 완벽한 여행지를 추천해드려요
              </p>
              <Button 
                onClick={() => navigate("/mbti")}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PawPrint className="w-4 h-4 mr-2" />
                멍BTI 테스트 시작하기
              </Button>
            </div>
          </Card>
        </div>

        {/* Hero Carousel */}
        <HeroCarousel />

        {/* Category Section */}
        <CategoryGrid />

        {/* Beach Status Section */}
        <BeachStatus />
      </main>

    </div>
  );
};

export default Index;