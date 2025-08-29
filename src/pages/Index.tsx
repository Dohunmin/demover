import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PawPrint, Heart, LogOut, Settings } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import CategoryGrid from "@/components/CategoryGrid";
import BeachStatus from "@/components/BeachStatus";
import UserProfile from "@/components/UserProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const handleSignOut = async () => {
    await signOut();
    toast.success("로그아웃되었습니다.");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
            <PawPrint className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </div>
    );
  };

  // 로그인하지 않은 사용자를 위한 페이지
  if (!user) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto">
        {/* Header */}
        <header className="p-6 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">멍멍!</h1>
                <p className="text-sm text-muted-foreground">일단출발해</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/auth")}
              className="border-border text-foreground hover:bg-muted"
            >
              로그인
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 pb-20">
          {/* Welcome Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              우리 강아지와 함께하는<br />특별한 여행
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              반려견의 성향에 맞는<br />완벽한 여행지를 찾아보세요
            </p>
            
            <Card className="p-8 text-center border-border bg-card">
              <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Heart className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                우리 멍멍이는 어떤 여행러일까?
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                멍BTI 테스트 결과를 바탕으로<br />필터링해보세요
              </p>
              <Button 
                onClick={() => navigate("/auth")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                멍BTI 테스트하기
              </Button>
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
    <div className="min-h-screen bg-background max-w-md mx-auto">
      {/* Header */}
      <header className="p-6 pt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">멍멍!</h1>
              <p className="text-sm text-muted-foreground">일단출발해</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/admin")}
                className="border-border text-foreground hover:bg-muted"
              >
                <Settings className="w-4 h-4 mr-1" />
                Admin
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="border-border text-foreground hover:bg-muted"
            >
              <LogOut className="w-4 h-4 mr-1" />
              로그아웃
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className="mb-6">
          <UserProfile />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-20">
        {/* MBTI Test Section */}
        <div className="mb-12">
          <Card className="p-8 text-center border-border bg-card">
            <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              우리 멍멍이는 어떤 여행러일까?
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              멍BTI 테스트 결과를 바탕으로<br />필터링해보세요
            </p>
            <Button 
              onClick={() => navigate("/mbti")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              멍BTI 테스트하기
            </Button>
          </Card>
        </div>

        {/* Category Section */}
        <CategoryGrid />

        {/* Beach Status Section */}
        <BeachStatus />
      </main>
    </div>
  );
};

export default Index;