import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PawPrint, Sparkles } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import CategoryGrid from "@/components/CategoryGrid";
import BeachStatus from "@/components/BeachStatus";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      {/* Header */}
      <header className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white p-6 rounded-b-3xl shadow-xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/20"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-white/10"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <PawPrint className="w-6 h-6" />
                <h1 className="text-xl font-bold">펫패스</h1>
              </div>
              <p className="text-blue-100 text-sm font-medium">반려견과 함께하는 스마트한 여행</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-blue-700 backdrop-blur-sm font-medium"
            >
              로그인
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
                반려견의 성격에 맞는 완벽한 여행지를<br />AI가 추천해드려요
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PawPrint className="w-4 h-4 mr-2" />
                멍BTI 테스트 시작하기
              </Button>
            </div>
          </Card>
        </div>

        {/* Category Section */}
        <CategoryGrid />

        {/* Beach Status Section */}
        <BeachStatus />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;