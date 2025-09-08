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

  // URL 파라미터에서 카테고리 확인하고 지도로 이동
  useEffect(() => {
    const category = searchParams.get('category');
    if (category && user) {
      setSelectedCategory(category);
      setCurrentView('map');
      setActiveTab('pet'); // 카테고리 선택시 pet 탭으로 설정
    }
  }, [searchParams, user]);

  const showMap = (tab: "general" | "pet") => {
    setActiveTab(tab);
    setCurrentView('map');
  };
  const showPlaces = () => setCurrentView('places');

  const handlePetDataLoaded = (data: any[]) => {
    setPetTourismData(data);
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