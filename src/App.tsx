import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import BottomNavigation from "@/components/BottomNavigation";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MbtiTest from "./pages/MbtiTest";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Travel from "./pages/Travel";
import Admin from "./pages/Admin";
import Records from "./pages/Records";
import AnimalHospitalsPage from "./pages/AnimalHospitals";
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
      case "/records":
        return "record";
      default:
        return "home";
    }
  };

  const activeTab = getActiveTab();


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
      case "record":
        navigate("/records");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/animal-hospitals" element={<AnimalHospitalsPage />} />
          <Route path="/mbti" element={<MbtiTest />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/records" element={<Records />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Footer - 페이지 하단에 고정 */}
      <Footer />
      
      {/* 하단 네비게이션 - 모든 화면 크기에서 표시 */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onMbtiClick={() => navigate("/mbti")}
      />
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
