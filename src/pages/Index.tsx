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
    try {
      console.log('로그아웃 버튼 클릭됨');
      await signOut();
      toast.success("로그아웃되었습니다.");
      
      // 약간의 지연 후 페이지 새로고침 (상태 완전 초기화)
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      console.error('로그아웃 처리 오류:', error);
      toast.error("로그아웃 중 오류가 발생했습니다.");
      
      // 오류가 발생해도 페이지 새로고침
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
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
        <div className="px-5 py-6 mb-6">
          <div className="card">
            {/* Section Title */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">
                우리 강아지는 어떤 여행 스타일?
              </h2>
              <p className="text-muted-foreground text-sm">
                반려견의 성격에 맞는 완벽한 여행지를 추천해드려요
              </p>
            </div>

            {/* Hero Carousel */}
            <div className="mb-6">
              <HeroCarousel />
            </div>

            {/* MBTI Test Button */}
            <div className="text-center">
              <Button 
                onClick={() => navigate('/mbti')}
                className="button-primary w-full"
              >
                멍BTI 테스트 하러가기
              </Button>
            </div>
          </div>
        </div>

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