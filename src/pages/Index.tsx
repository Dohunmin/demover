import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PawPrint, Sparkles, LogOut, Settings } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import CategoryGrid from "@/components/CategoryGrid";
import BeachStatus from "@/components/BeachStatus";
import UserProfile from "@/components/UserProfile";
import RecommendationSlider from "@/components/RecommendationSlider";
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
      <div className="min-h-screen bg-background max-w-md mx-auto flex items-center justify-center">
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
      <div className="min-h-screen bg-background max-w-md mx-auto relative overflow-x-hidden">
        {/* Header */}
        <header className="header p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <PawPrint className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                <h1 className="header-title">멍멍! 일단 출발해!</h1>
              </div>
              <p className="header-subtitle">반려견과 함께하는 스마트한 여행</p>
            </div>
            <Button 
              onClick={() => navigate("/auth")}
              className="button-primary"
            >
              로그인
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="pb-20 -mt-4">
          {/* Welcome Section */}
          <div className="px-5 py-6">
            <div className="card text-center">
              <div className="w-16 h-16 bg-white border border-gray-100 text-primary p-2 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
                <Sparkles className="w-8 h-8" style={{ color: 'var(--primary-color)' }} />
              </div>
              <h2 className="card-title text-lg mb-2">
                반려견과 함께하는 특별한 여행
              </h2>
              <p className="card-subtitle text-sm mb-5 leading-relaxed">
                로그인하고 우리 강아지에게 맞는<br />완벽한 여행지를 찾아보세요
              </p>
              <Button 
                onClick={() => navigate("/auth")}
                className="button-primary w-full"
              >
                <PawPrint className="w-4 h-4 mr-2" />
                로그인 / 회원가입
              </Button>
            </div>
          </div>

        {/* Preview Content */}
        <CategoryGrid />
        <BeachStatus />
        
        {/* Recommendation Section */}
        <RecommendationSlider />
      </main>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative overflow-x-hidden">
      {/* Header */}
      <header className="header p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <PawPrint className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
              <h1 className="header-title">멍멍! 일단 출발해!</h1>
            </div>
            <p className="header-subtitle">반려견과 함께하는 스마트한 여행</p>
          </div>
          
          {/* Admin Button - Top Right */}
          {isAdmin && (
            <Button 
              size="sm" 
              onClick={() => navigate("/admin")}
              className="button-primary mb-2"
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
            size="sm" 
            onClick={handleSignOut}
            className="button-primary flex-shrink-0"
          >
            <LogOut className="w-4 h-4 mr-1" />
            로그아웃
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 -mt-4">
        {/* MBTI Test Section */}
        <div className="px-5 py-6">
          <div className="card text-center">
            <h2 className="card-title text-lg mb-2">
              우리 강아지는 어떤 여행 스타일?
            </h2>
            <p className="card-subtitle text-sm mb-5 leading-relaxed">
              반려견의 성격에 맞는 완벽한 여행지를 추천해드려요
            </p>
            
            {/* 16 MungBTI Characters Slider */}
            <div className="mb-5">
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#FFE4E1' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/653be78a-fc51-4b6c-8528-9c7b9625be0d.png" 
                    alt="활발한 탐험가"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#E6F3FF' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/596aef9c-00b0-4916-87bd-acce0e9cb626.png" 
                    alt="차분한 힐링러"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#F0F8E6' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/06ff5d07-2090-44bb-a8ac-51a242eafbb3.png" 
                    alt="사교적인 소셜러"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#FFF8E1' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/32bcdc3a-cc67-4912-a010-9fafabb7f736.png" 
                    alt="주인바라기 전용러버"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#F5E6FF' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/a0dc78cb-f620-44cb-8f2f-55a8e53550b9.png" 
                    alt="시각적 풍경러버"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#E8F5E8' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/ce1fcfb5-0d9d-4376-a99f-eaf28ec9709d.png" 
                    alt="후각적 탐험가"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#FFE8F5' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/c05b8912-d2cc-4343-9b8f-4c5846316710.png" 
                    alt="패션 스타일리스트"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#F0F8F0' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/28b87428-54bd-4a64-bd4e-6a42b7a1799b.png" 
                    alt="자연스러운 프리덤러"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#FFE4E1' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/652b14b3-76db-4dc4-a058-74a645b2936b.png" 
                    alt="활발한 소셜러"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#E6F3FF' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/a59b7728-dcb9-4fd5-b34c-ba874cff8499.png" 
                    alt="차분한 전용러버"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#F0F8E6' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/8e94178e-a6d0-495e-a51e-2db8f9649ad0.png" 
                    alt="활발한 풍경러버"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#FFF8E1' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/d8ca4f20-1e83-4629-8b07-84f381d631f2.png" 
                    alt="차분한 탐험가"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#F5E6FF' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/d7bbc895-f98c-41aa-8eaa-c4d442b73b40.png" 
                    alt="활발한 스타일리스트"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#E8F5E8' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/6f0a82a5-520c-4690-ad10-b7a956fe794c.png" 
                    alt="차분한 프리덤러"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#FFE8F5' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/053c625b-da0b-490a-86c2-5c4ae4c71fe1.png" 
                    alt="사교적 풍경러버"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div 
                  className="flex-none w-16 h-16 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: '#F0F8F0' }}
                  onClick={() => navigate("/mbti")}
                >
                  <img 
                    src="/lovable-uploads/13aa0338-6e00-4fe2-a46c-8f0bcf6c50dc.png" 
                    alt="주인바라기 탐험가"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => navigate("/mbti")}
              className="button-primary w-full"
            >
              <PawPrint className="w-4 h-4 mr-2" />
              멍BTI 테스트 시작하기
            </Button>
          </div>
        </div>

        {/* Hero Carousel */}
        <HeroCarousel />

        {/* Category Section */}
        <CategoryGrid />

        {/* Beach Status Section */}
        <BeachStatus />

        {/* Recommendation Section */}
        <RecommendationSlider />
      </main>

    </div>
  );
};

export default Index;