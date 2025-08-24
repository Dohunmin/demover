import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint, MapPin, Search, Heart, Sparkles, ArrowLeft } from "lucide-react";
import TourPlaces from "@/components/TourPlaces";
import KakaoMap from "@/components/KakaoMap";
import { useAuth } from "@/hooks/useAuth";

const Travel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'places' | 'map'>('places');

  const showMap = () => setCurrentView('map');
  const showPlaces = () => setCurrentView('places');

  // 로그인하지 않은 사용자를 위한 안내
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-20">
        {/* Header */}
        <header className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-700 text-white p-6 rounded-b-3xl shadow-xl relative overflow-hidden">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">여행지 정보</h1>
              <p className="text-green-100 text-sm">반려견과 함께하는 완벽한 여행지를 찾아보세요</p>
            </div>
          </div>
        </header>

        <main className="p-5">
          <Card className="p-8 text-center bg-white border-0 shadow-lg rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 opacity-60"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                로그인이 필요합니다
              </h2>
              <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                여행지 정보를 확인하려면<br />먼저 로그인해주세요
              </p>
              <button 
                onClick={() => navigate("/auth")}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PawPrint className="w-4 h-4 mr-2 inline" />
                로그인하러 가기
              </button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (currentView === 'map') {
    return <KakaoMap onBack={showPlaces} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-700 text-white p-6 rounded-b-3xl shadow-xl relative overflow-hidden">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">여행지 정보</h1>
            <p className="text-green-100 text-sm">반려견과 함께하는 완벽한 여행지를 찾아보세요</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-4">
        <TourPlaces onShowMap={showMap} />
      </main>
    </div>
  );
};

export default Travel;