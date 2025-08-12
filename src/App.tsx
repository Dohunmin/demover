import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import BottomNavigation from "@/components/BottomNavigation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MbtiTest from "./pages/MbtiTest";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Travel from "./pages/Travel";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppWithNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 현재 경로에 따라 활성 탭 설정
  const getActiveTab = () => {
    switch (location.pathname) {
      case "/":
        return "home";
      case "/travel":
        return "travel";
      case "/mbti":
        return "mbti";
      case "/news":
        return "news";
      default:
        return "home";
    }
  };

  const activeTab = getActiveTab();

  // Auth 페이지와 NewsDetail 페이지에서는 하단 네비게이션을 숨김
  const hideNavigation = location.pathname === "/auth" || location.pathname.startsWith("/news/");

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case "home":
        navigate("/");
        break;
      case "travel":
        navigate("/travel");
        break;
      case "news":
        navigate("/news");
        break;
      case "mbti":
        navigate("/mbti");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/travel" element={<Travel />} />
        <Route path="/mbti" element={<MbtiTest />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/admin" element={<Admin />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* 하단 네비게이션 - Auth 페이지 제외하고 모든 페이지에서 표시 */}
      {!hideNavigation && (
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onMbtiClick={() => navigate("/mbti")}
        />
      )}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppWithNavigation />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
