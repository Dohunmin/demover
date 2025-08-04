import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, PawPrint, Heart, MapPin, Compass, Mountain } from "lucide-react";

const MbtiTest = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
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
            <h1 className="text-xl font-bold flex items-center">
              <PawPrint className="w-6 h-6 mr-2" />
              멍BTI
            </h1>
            <p className="text-blue-100 text-sm">반려견 여행 성향 테스트</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-5 space-y-6">
        {/* 멍BTI 소개 */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">멍BTI(여행ver.)?</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              반려견의 성격과 선호도를 분석하여<br />
              최적의 여행 스타일을 찾아주는 테스트입니다
            </p>
          </div>
        </Card>

        {/* 여행 성향 기준 */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Compass className="w-5 h-5 mr-2 text-blue-600" />
            여행 성향 기준 (4개)
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">활동성 vs 휴식성</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">모험성 vs 안정성</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">사교성 vs 독립성</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">계획성 vs 자유성</span>
            </div>
          </div>
        </Card>

        {/* 기존별 상세내용 */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Mountain className="w-5 h-5 mr-2 text-green-600" />
            기존별 상세내용
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl text-center">
              <div className="text-sm font-semibold text-red-700">E (외향형)</div>
              <div className="text-xs text-red-600 mt-1">활발하고 사교적</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center">
              <div className="text-sm font-semibold text-blue-700">I (내향형)</div>
              <div className="text-xs text-blue-600 mt-1">조용하고 신중함</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl text-center">
              <div className="text-sm font-semibold text-green-700">S (감각형)</div>
              <div className="text-xs text-green-600 mt-1">현실적이고 실용적</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl text-center">
              <div className="text-sm font-semibold text-purple-700">N (직관형)</div>
              <div className="text-xs text-purple-600 mt-1">상상력이 풍부함</div>
            </div>
          </div>
        </Card>

        {/* 16가지 여행 성향 설명 */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
            16가지 여행 성향 설명
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              "ESTJ", "ESTP", "ESFJ", "ESFP",
              "ENTJ", "ENTP", "ENFJ", "ENFP", 
              "ISTJ", "ISTP", "ISFJ", "ISFP",
              "INTJ", "INTP", "INFJ", "INFP"
            ].map((type) => (
              <div key={type} className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="text-xs font-bold text-gray-700">{type}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            각 성향별 맞춤 여행지를 추천해드립니다
          </p>
        </Card>

        {/* 테스트 시작 버튼 */}
        <div className="pb-6">
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PawPrint className="w-5 h-5 mr-2" />
            테스트 시작하기
          </Button>
        </div>
      </main>
    </div>
  );
};

export default MbtiTest;