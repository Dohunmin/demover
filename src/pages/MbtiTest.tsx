import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, PawPrint, Heart, MapPin, Compass, Mountain, Zap, Coffee, Users, User, Eye, Flower, Sparkles, Leaf } from "lucide-react";

// Import dog images
import energeticExplorerDog from "@/assets/energetic-explorer-dog.jpg";
import calmCompanionDog from "@/assets/calm-companion-dog.jpg";
import socialStarDog from "@/assets/social-star-dog.jpg";
import ownerOnlyDog from "@/assets/owner-only-dog.jpg";
import visualLedDog from "@/assets/visual-led-dog.jpg";
import noseLedDog from "@/assets/nose-led-dog.jpg";
import fashionForwardDog from "@/assets/fashion-forward-dog.jpg";
import backToBasicsDog from "@/assets/back-to-basics-dog.jpg";

// 16가지 성향 데이터 (설명은 사용자가 제공할 예정)
const travelTypes = [
  { code: "ESVF", description: "설명을 입력해주세요" },
  { code: "ESVB", description: "설명을 입력해주세요" },
  { code: "ESNF", description: "설명을 입력해주세요" },
  { code: "ESNB", description: "설명을 입력해주세요" },
  { code: "EOVF", description: "설명을 입력해주세요" },
  { code: "EOVB", description: "설명을 입력해주세요" },
  { code: "EONF", description: "설명을 입력해주세요" },
  { code: "EONB", description: "설명을 입력해주세요" },
  { code: "CSVF", description: "설명을 입력해주세요" },
  { code: "CSVB", description: "설명을 입력해주세요" },
  { code: "CSNF", description: "설명을 입력해주세요" },
  { code: "CSNB", description: "설명을 입력해주세요" },
  { code: "COVF", description: "설명을 입력해주세요" },
  { code: "COVB", description: "설명을 입력해주세요" },
  { code: "CONF", description: "설명을 입력해주세요" },
  { code: "CONB", description: "설명을 입력해주세요" },
];

const MbtiTest = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTypeClick = (typeCode: string) => {
    setSelectedType(typeCode);
    setDialogOpen(true);
  };

  const selectedTypeData = travelTypes.find(type => type.code === selectedType);

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
              <span className="text-sm font-medium text-gray-700">에너지레벨 (Energy Level)</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">관계 추구 (Relationship)</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">발달 감각 (Sense)</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">여행 바이브 (Vibe)</span>
            </div>
          </div>
        </Card>

        {/* 기준별 상세내용 */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Mountain className="w-5 h-5 mr-2 text-green-600" />
            기준별 상세내용
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl text-center">
              <img src={energeticExplorerDog} alt="활동적인 탐험가" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
              <div className="text-sm font-semibold text-red-700">활동적인 탐험가</div>
              <div className="text-xs text-red-600 mt-1">Energetic Explorer</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center">
              <img src={calmCompanionDog} alt="차분한 동반자" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
              <div className="text-sm font-semibold text-blue-700">차분한 동반자</div>
              <div className="text-xs text-blue-600 mt-1">Calm Companion</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl text-center">
              <img src={socialStarDog} alt="핵 인싸" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
              <div className="text-sm font-semibold text-green-700">핵 인싸</div>
              <div className="text-xs text-green-600 mt-1">Social Star</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl text-center">
              <img src={ownerOnlyDog} alt="주인 바라기" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
              <div className="text-sm font-semibold text-purple-700">주인 바라기</div>
              <div className="text-xs text-purple-600 mt-1">Owner Only</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl text-center">
              <img src={visualLedDog} alt="시각 중심" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
              <div className="text-sm font-semibold text-orange-700">시각 중심</div>
              <div className="text-xs text-orange-600 mt-1">Visual-led</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl text-center">
              <img src={noseLedDog} alt="후각 중심" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
              <div className="text-sm font-semibold text-pink-700">후각 중심</div>
              <div className="text-xs text-pink-600 mt-1">Nose-led</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl text-center">
              <img src={fashionForwardDog} alt="꾸꾸꾸" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
              <div className="text-sm font-semibold text-teal-700">꾸꾸꾸</div>
              <div className="text-xs text-teal-600 mt-1">Fashion Forward</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl text-center">
              <img src={backToBasicsDog} alt="꾸안꾸" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
              <div className="text-sm font-semibold text-gray-700">꾸안꾸</div>
              <div className="text-xs text-gray-600 mt-1">Back to Basics</div>
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
            {travelTypes.map((type) => (
              <button 
                key={type.code} 
                onClick={() => handleTypeClick(type.code)}
                className="p-3 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-transparent rounded-lg text-center transition-all duration-200 cursor-pointer"
              >
                <div className="text-xs font-bold text-gray-700 hover:text-blue-700">{type.code}</div>
              </button>
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

      {/* 여행 성향 설명 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-gray-900">
              {selectedType} 성향
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 text-sm leading-relaxed text-center">
              {selectedTypeData?.description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MbtiTest;