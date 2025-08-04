import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BottomNavigation from "@/components/BottomNavigation";
import CategoryGrid from "@/components/CategoryGrid";
import BeachStatus from "@/components/BeachStatus";
import dogQuestion from "@/assets/dog-question.jpg";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      {/* Header */}
      <header className="bg-gradient-to-r from-pet-blue to-pet-ocean text-white p-4 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold">명랑! 일단 출발해! 🐕</h1>
            <p className="text-blue-100 text-sm">반려견과 함께하는 즐거운 여행</p>
          </div>
          <Button variant="pet-outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-pet-blue">
            로그인
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {/* MBTI Test Section */}
        <div className="px-4 py-6">
          <Card className="p-6 text-center bg-gradient-to-br from-pet-light-blue to-accent border-0 shadow-card">
            <div className="mb-4">
              <img 
                src={dogQuestion} 
                alt="강아지 질문" 
                className="w-20 h-20 mx-auto rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              우리 강아지는 어떤 스타일은?
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              반려견의 성격에 맞는 완벽한 여행지를 찾아드려요
            </p>
            <Button variant="pet" className="w-full shadow-lg">
              멍BTI (여행ver.) 테스트하기
            </Button>
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