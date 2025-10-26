import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint, MapPin, Search, Heart, Sparkles, ArrowLeft } from "lucide-react";
import TourPlaces from "@/components/TourPlaces";
import KakaoMap from "@/components/KakaoMap";
import AdBanner from "@/components/AdBanner";

import { useAuth } from "@/hooks/useAuth";

const Travel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<'places' | 'map'>('places');
  const [activeTab, setActiveTab] = useState<"general" | "pet">("general");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [petTourismData, setPetTourismData] = useState<any[]>([]);
  const [isBackFromMap, setIsBackFromMap] = useState(false);

  // URL 파라미터에서 카테고리 확인하고 데이터 로드 후 지도로 이동
  useEffect(() => {
    const category = searchParams.get('category');
    if (category && user && !isBackFromMap) {
      setSelectedCategory(category);
      setActiveTab('pet'); // 카테고리 선택시 pet 탭으로 설정
      
      // 데이터가 로드되지 않았다면 먼저 로드
      if (petTourismData.length === 0) {
        console.log('🔄 카테고리 진입 - 데이터 로드 필요');
        // TourPlaces 컴포넌트가 마운트되어 데이터를 로드할 때까지 대기
        setTimeout(() => {
          if (petTourismData.length > 0) {
            console.log('✅ 데이터 로드 완료 - 지도로 이동');
            setCurrentView('map');
          }
        }, 2000); // 2초 후 데이터 확인
      } else {
        console.log('✅ 데이터 이미 존재 - 바로 지도로 이동');
        setCurrentView('map');
      }
    }

    // 브라우저 뒤로가기 처리
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state?.view === 'map') {
        // 지도 뷰로 복원
        setCurrentView('map');
      } else {
        // 목록 뷰로 복원
        setCurrentView('places');
        setIsBackFromMap(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [searchParams, user, petTourismData.length, isBackFromMap]);

  const showMap = (tab: "general" | "pet") => {
    setActiveTab('pet'); // 항상 반려동물 동반 지도 표시
    setCurrentView('map');
    setIsBackFromMap(false); // 직접 지도로 갈 때는 뒤로가기 플래그 리셋
    // 히스토리에 상태 추가
    window.history.pushState({ view: 'map' }, '', window.location.pathname);
  };
  const showPlaces = () => {
    setCurrentView('places');
    setIsBackFromMap(true); // 지도에서 뒤로갈 때 플래그 설정
    
    // URL 파라미터 제거하여 자동 지도 이동 방지
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.has('category')) {
      navigate('/travel', { replace: true });
      setSelectedCategory(null);
    }
  };

  const handlePetDataLoaded = (data: any[]) => {
    console.log('🔄 Pet 데이터 로드됨:', data.length);
    setPetTourismData(data);
    
    // 카테고리가 설정되어 있고 지도 화면이 아니라면 지도로 이동
    const category = searchParams.get('category');
    if (category && currentView !== 'map' && data.length > 0) {
      console.log('✅ 카테고리 데이터 로드 완료 - 지도로 이동');
      setCurrentView('map');
    }
  };

  // 로그인하지 않은 사용자를 위한 안내
  if (!user) {
    return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-20">
        {/* Header */}
        <header className="header p-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-foreground hover:bg-muted p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="header-title">여행지 정보</h1>
              <p className="header-subtitle">반려견과 함께하는 완벽한 여행지를 찾아보세요</p>
            </div>
          </div>
        </header>

        <main className="p-5">
          <div className="card text-center p-8">
            <div className="w-16 h-16 bg-foreground rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-background" />
            </div>
            <h2 className="card-title text-lg mb-2">
              로그인이 필요합니다
            </h2>
            <p className="card-subtitle text-sm mb-5 leading-relaxed">
              여행지 정보를 확인하려면<br />먼저 로그인해주세요
            </p>
            <Button 
              onClick={() => navigate("/auth")}
              className="button-primary w-full"
            >
              <PawPrint className="w-4 h-4 mr-2" />
              로그인하러 가기
            </Button>
          </div>
        </main>

      {/* Ad Banner */}
      <AdBanner />
      
      </div>
    );
  }

  if (currentView === 'map') {
    return <KakaoMap 
      onBack={showPlaces} 
      showPetFilter={activeTab === 'pet'} 
      initialCategory={selectedCategory}
      selectedCategory={selectedCategory}
      petTourismData={petTourismData}
    />;
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-20">
      {/* Header */}
      <header className="header p-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-foreground hover:bg-muted p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="header-title">여행지 정보</h1>
            <p className="header-subtitle">반려견과 함께하는 완벽한 여행지를 찾아보세요</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-4">
        <TourPlaces onShowMap={showMap} onPetDataLoaded={handlePetDataLoaded} />
      </main>

      {/* Ad Banner */}
      <AdBanner />
      
    </div>
  );
};

export default Travel;