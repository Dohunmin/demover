import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BottomNavigation from "@/components/BottomNavigation";

const News = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("news");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") {
      navigate("/");
    } else if (tab === "mbti") {
      navigate("/mbti");
    }
  };

  const festivals = [
    "[축제] 부산 바다축제 2024",
    "[이벤트] 부산 해운대 반려견 수영대회",
    "[축제] 부산 국제영화제 반려동물 특별전",
    "[축제] 광안리 해변 강아지 런닝 페스티벌",
    "[이벤트] 부산 시민공원 반려동물 소통 축제"
  ];

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white p-6 rounded-b-3xl shadow-xl relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">소식</h1>
            <p className="text-blue-100 text-sm">최신 행사 및 할인 정보</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-5 space-y-6">
        {/* 축제/이벤트 섹션 */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              축제/이벤트
            </h2>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              더보기
            </Button>
          </div>
          
          <div className="space-y-3">
            {festivals.map((festival, index) => (
              <div 
                key={index}
                className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer border-b border-gray-200 last:border-b-0"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                <span className="text-sm text-gray-700 font-medium flex-1">{festival}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 세일 섹션 */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-red-600" />
              세일
            </h2>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Plus className="w-4 h-4 mr-1" />
              더보기
            </Button>
          </div>
          
          {/* 세일 정보가 없는 경우 */}
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">현재 진행 중인 세일이 없습니다</p>
            <p className="text-gray-400 text-xs mt-1">새로운 할인 정보를 기다려주세요!</p>
          </div>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onMbtiClick={() => navigate("/mbti")}
      />
    </div>
  );
};

export default News;