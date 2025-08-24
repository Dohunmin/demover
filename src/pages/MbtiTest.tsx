import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, PawPrint, Heart, MapPin, Compass, Mountain } from "lucide-react";

// 테스트 질문 데이터
const questions = [
  {
    id: 1,
    category: "energy",
    question: "꿈에 그리던 여행지에 도착했다! 우리 강아지의 첫 반응은?",
    options: [
      { value: "E", text: "낯선 곳이 마냥 신나! 꼬리를 흔들며 당장 나가자고 문을 긁는다." },
      { value: "C", text: "일단 새로운 숙소 냄새부터 맡고, 가장 편한 자리에 앉아 상황을 살핀다." }
    ]
  },
  {
    id: 2,
    category: "energy",
    question: "여행의 하이라이트, 자유시간이 주어졌다. 우리 강아지가 가장 행복해할 코스는?",
    options: [
      { value: "E", text: "함께 오르는 등산로나 넓은 해변에서 신나게 달리기!" },
      { value: "C", text: "조용한 애견 카페에서 간식을 먹거나, 호숫가 벤치에서 함께 풍경 감상하기." }
    ]
  },
  {
    id: 3,
    category: "energy",
    question: "하루 일정을 마치고 숙소에 돌아왔다. 강아지의 저녁 시간은?",
    options: [
      { value: "E", text: "아직 지치지 않았다! \"산책 한번 더?\" 라는 말에 귀가 쫑긋, 꼬리가 반응한다." },
      { value: "C", text: "푹신한 내 자리가 최고! 내일의 여행을 위해 얌전히 누워 에너지를 충전한다." }
    ]
  },
  {
    id: 4,
    category: "social",
    question: "여행 중 들른 휴게소나 공원에서 다른 강아지를 만났다!",
    options: [
      { value: "S", text: "\"안녕! 너도 여행 왔니?\" 망설임 없이 다가가 냄새를 맡고 인사를 건넨다." },
      { value: "O", text: "다른 강아지는 일단 경계! 주인 옆에 바짝 붙어 상황을 지켜본다." }
    ]
  },
  {
    id: 5,
    category: "social",
    question: "애견동반 식당에 갔다. 주변 테이블 사람들이 우리 강아지를 보고 \"너무 예쁘다\"고 말한다.",
    options: [
      { value: "S", text: "\"저 예쁜 거 아세요?\" 꼬리를 살랑이며 다가가 아는 척, 이쁨을 독차지한다." },
      { value: "O", text: "칭찬은 좋지만 낯은 가려요. 슬쩍 눈을 피하며 주인의 다리 사이로 쏙 들어간다." }
    ]
  },
  {
    id: 6,
    category: "social",
    question: "낯선 여행지에서 \"이리 와!\" 하고 불렀을 때, 우리 강아지의 행동은?",
    options: [
      { value: "S", text: "일단 주변 구경이 먼저! 부르는 소리는 들었지만 새로운 환경에 대한 호기심이 더 크다." },
      { value: "O", text: "세상의 모든 소리 중 주인의 목소리가 1순위! 하던 일을 멈추고 바로 주인에게 달려온다." }
    ]
  },
  {
    id: 7,
    category: "sense",
    question: "처음 와본 숲속 산책로! 가장 먼저 하는 행동은?",
    options: [
      { value: "V", text: "고개를 들고 주변의 나무, 하늘, 날아다니는 새와 나비를 구경하느라 바쁘다." },
      { value: "N", text: "코를 땅에 박고 온갖 흙냄새, 풀냄새, 다른 친구들의 흔적을 분석하느라 바쁘다." }
    ]
  },
  {
    id: 8,
    category: "sense",
    question: "새로운 장난감을 사주었다. 강아지의 반응은?",
    options: [
      { value: "V", text: "눈앞에서 흔들어주면 바로 흥분! 일단 물고 보고, 던져주면 신나게 쫓아간다." },
      { value: "N", text: "섣불리 달려들지 않는다. 처음 보는 물건의 냄새를 한참 동안 맡으며 안전한지 확인한다." }
    ]
  },
  {
    id: 9,
    category: "sense",
    question: "넓은 잔디밭에 풀어주었다. 주로 어디에 정신이 팔려있나?",
    options: [
      { value: "V", text: "저 멀리 움직이는 물체(사람, 자동차, 다른 강아지)를 빤히 쳐다본다." },
      { value: "N", text: "바닥에 코를 대고 지그재그로 움직이며, 보이지 않는 냄새의 지도를 읽는다." }
    ]
  },
  {
    id: 10,
    category: "vibe",
    question: "강아지와의 여행 짐을 챙길 때, 나의 생각은?",
    options: [
      { value: "F", text: "\"남는 건 사진뿐!\" 여행지 컨셉에 맞는 예쁜 옷과 액세서리는 필수!" },
      { value: "B", text: "\"편한 게 최고!\" 목줄, 물그릇, 배변 봉투 등 필수품만 간단하게 챙긴다." }
    ]
  },
  {
    id: 11,
    category: "vibe",
    question: "멋진 포토 스팟에 도착했다. 어떻게 사진을 찍을까?",
    options: [
      { value: "F", text: "준비해 간 모자나 스카프를 착용시키고 '앉아, 기다려!'를 외쳐 견생샷을 건진다." },
      { value: "B", text: "자유롭게 뛰노는 가장 자연스러운 순간을 포착하는 것이 최고의 사진이다." }
    ]
  },
  {
    id: 12,
    category: "vibe",
    question: "물놀이를 하러 갔다. 우리 강아지의 모습은?",
    options: [
      { value: "F", text: "알록달록한 강아지용 구명조끼나 귀여운 수영모를 쓰고 안전과 멋을 동시에 챙긴다." },
      { value: "B", text: "온몸으로 파도를 느끼고, 흙과 물에 뒹굴며 자연과 하나가 된다." }
    ]
  }
];

// 16가지 성향 데이터
const travelTypes = [
  { 
    code: "ESVF", 
    title: "에너자이저 여행 유튜버",
    description: "구독과 좋아요는 필수! 지치지 않는 에너지로 새로운 장소를 탐험하고, 만나는 모든 사람과 강아지들에게 댕댕펀치를 날리며 구독자를 늘려요. 오늘의 OOTD를 뽐내며 멋진 풍경 앞에서 라이브 방송을 켜는 게 여행의 가장 큰 즐거움이랍니다.",
    tags: ["#여행러", "#멍BTI", "#ESVF", "#강아지여행"],
    icon: "🎬"
  },
  { 
    code: "ESVB", 
    title: "골목대장 프로참견러",
    description: "\"이 구역의 대장은 바로 나!\" 낯선 여행지에 도착하자마자 온 동네를 뛰어다니며 모든 일에 참견해야 직성이 풀려요. 꾸밈없는 모습 그대로, 새로운 친구들을 이끌고 신나는 모험을 떠나는 타고난 리더입니다.",
    tags: ["#여행러", "#멍BTI", "#ESVB", "#강아지여행"],
    icon: "👑"
  },
  { 
    code: "ESNF", 
    title: "킁킁대는 패셔니스타",
    description: "제 코는 최신 유행의 냄새를 맡죠! 호기심 가득한 코로 낯선 곳의 냄새를 킁킁거리면서도, \"이 옷 어때?\" 하고 뽐내는 건 포기할 수 없어요. 냄새 탐험과 스타일, 둘 다 놓칠 수 없는 욕심쟁이랍니다.",
    tags: ["#여행러", "#멍BTI", "#ESNF", "#강아지여행"],
    icon: "👗"
  },
  { 
    code: "ESNB", 
    title: "자연 속의 보물찾기 왕",
    description: "세상은 넓고 맡을 냄새는 많다! 반짝이는 보물을 찾듯, 코를 땅에 대고 온갖 자연의 흔적을 찾아다니는 탐험가. 다른 강아지 친구들과 함께 흙냄새 풀냄새를 맡으며 뛰어놀 때 가장 행복해요.",
    tags: ["#여행러", "#멍BTI", "#ESNB", "#강아지여행"],
    icon: "🏆"
  },
  { 
    code: "EOVF", 
    title: "견생샷 전문, 전속 모델",
    description: "제 카메라는 오직 보호자뿐이에요. 다른 사람의 부름엔 묵묵부답, 오직 보호자 앞에서만 최고의 포즈를 선보이죠. 보호자가 입혀준 예쁜 옷을 입고 '견생샷'을 찍을 때 가장 빛나는, 보호자만의 전속 모델입니다.",
    tags: ["#여행러", "#멍BTI", "#EOVF", "#강아지여행"],
    icon: "📸"
  },
  { 
    code: "EOVB", 
    title: "가족껌딱지 자연 탐험가",
    description: "우리 가족과 함께라면 어디든 갈 수 있어! 화려한 옷이나 낯선 친구들보다, 우리 가족과 함께 흙길을 달리고 계곡을 건너는 것이 가장 큰 기쁨이에요. 가족의 보폭에 맞춰 함께 걷는 듬직한 탐험가랍니다.",
    tags: ["#여행러", "#멍BTI", "#EOVB", "#강아지여행"],
    icon: "🏔️"
  },
  { 
    code: "EONF", 
    title: "멋쟁이 탐정, 셜록 멍즈",
    description: "사건 발생! 이 냄새의 근원지를 찾아야 해! 멋진 트렌치코트(옷)를 휘날리며, 예리한 코로 사건의 단서를 추적하는 명탐정. 수사가 끝나면 언제나 유일한 파트너, 보호자의 곁으로 돌아가죠.",
    tags: ["#여행러", "#멍BTI", "#EONF", "#강아지여행"],
    icon: "🔍"
  },
  { 
    code: "EONB", 
    title: "둘만의 비밀 탐사대원",
    description: "이 세상은 보호자와 나, 단둘이 탐험하는 비밀의 장소! 다른 사람의 접근은 허용하지 않아요. 보호자의 발자국 소리를 들으며, 함께 미지의 냄새를 찾아 떠나는 우리만의 비밀 탐사대원입니다.",
    tags: ["#여행러", "#멍BTI", "#EONB", "#강아지여행"],
    icon: "🗺️"
  },
  { 
    code: "CSVF", 
    title: "까칠한 내향적 슈퍼스타",
    description: "나만의 아우라, 함부로 다가오지 말아줘! 조용한 곳에서 나만의 시간을 즐기지만, 모든 사람들의 시선은 온전히 내게 향해야 해요. 완벽하게 세팅된 스타일을 멀리서 감상해 주는 게 팬들의 기본 매너랍니다.",
    tags: ["#여행러", "#멍BTI", "#CSVF", "#강아지여행"],
    icon: "⭐"
  },
  { 
    code: "CSVB", 
    title: "꾸밈없는 캠핑장 사장님",
    description: "\"허허, 좋은 아침이구먼.\" 캠핑장의 아침을 가장 먼저 맞이하며, 모든 텐트를 둘러보는 게 일과인 마음 좋은 사장님. 꾸미지 않은 편안한 모습으로, 오고 가는 모든 이들에게 꼬리를 살랑여주는 터줏대감입니다.",
    tags: ["#여행러", "#멍BTI", "#CSVB", "#강아지여행"],
    icon: "🏕️"
  },
  { 
    code: "CSNF", 
    title: "로컬맛집 비밀 감별사",
    description: "이 집, 찐맛집의 냄새가 난다! 여행지의 숨겨진 맛집을 찾아내는 비밀 감별사. 겉으로는 조용하고 세련된 손님인 척 앉아있지만, 사실은 예리한 코로 주방의 냄새까지 분석하고 있는 미식가랍니다.",
    tags: ["#여행러", "#멍BTI", "#CSNF", "#강아지여행"],
    icon: "🍽️"
  },
  { 
    code: "CSNB", 
    title: "약초캐는 산골도사",
    description: "깊은 산골짜기의 숨겨진 약초를 찾아다니는 도사님. 화려함보다는 자연의 기운을 중시하며, 예리한 코로 흙과 풀의 향기를 읽어내죠. 묵묵히 자기 일에 집중하지만, 가끔 마을에 내려와 신비로운 기운을 나눠주는 지혜로운 여행가입니다.",
    tags: ["#여행러", "#멍BTI", "#CSNB", "#강아지여행"],
    icon: "🌿"
  },
  { 
    code: "COVF", 
    title: "좋은 일만 가득한 행운요정",
    description: "내가 곁에 있으면 좋은 일이 생길 거예요! 보호자의 곁에 꼭 붙어, 반짝이는 모습으로 행운을 가져다주는 요정. 나의 존재 자체가 보호자를 빛나게 하는 가장 아름다운 행운 부적이랍니다.",
    tags: ["#여행러", "#멍BTI", "#COVF", "#강아지여행"],
    icon: "🧚"
  },
  { 
    code: "COVB", 
    title: "내 옆의 힐링 파트너",
    description: "세상 가장 편안한 내 자리, 바로 보호자의 옆자리! 특별한 활동 없이 보호자 곁에 꼭 붙어 눈을 맞추는 것만으로도 행복 에너지를 충전시켜줘요. 꾸미지 않은 모습 그대로가 가장 큰 위로를 주는, 타고난 힐링 파트너입니다.",
    tags: ["#여행러", "#멍BTI", "#COVB", "#강아지여행"],
    icon: "💆"
  },
  { 
    code: "CONF", 
    title: "가족 옷자락 끝 작은 경호원",
    description: "임무 개시! 가족을 안전하게 보호한다! 가족 구성원 옷자락 끝에 매달려, 낯선 냄새로부터 가족을 지키는 듬직한 경호원. 작지만 강한 책임감으로 무장한, 세상에서 가장 귀여운 경호 임무를 수행 중입니다.",
    tags: ["#여행러", "#멍BTI", "#CONF", "#강아지여행"],
    icon: "🛡️"
  },
  { 
    code: "CONB", 
    title: "포근한 담요 속 탐험가",
    description: "바깥세상은 위험해, 이 담요 속이 나의 우주! 보호자의 체취가 묻은 담요 속에 파묻혀, 코만 내밀고 세상 냄새를 탐험하는 소심한 탐험가. 보호자의 품속이 세상에서 가장 안전하고 흥미진진한 탐험 장소랍니다.",
    tags: ["#여행러", "#멍BTI", "#CONB", "#강아지여행"],
    icon: "🛋️"
  }
];

const MbtiTest = () => {
  const navigate = useNavigate();
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTypeClick = (typeCode: string) => {
    setSelectedType(typeCode);
    setDialogOpen(true);
  };

  const selectedTypeData = travelTypes.find(type => type.code === selectedType);

  const handleStartTest = () => {
    setIsTestStarted(true);
  };

  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);
  };

  const handleNextQuestion = () => {
    if (!currentAnswer) return;
    
    setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: currentAnswer }));
    setCurrentAnswer("");
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // 테스트 완료 - 결과 계산
      calculateResult({ ...answers, [questions[currentQuestion].id]: currentAnswer });
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setCurrentAnswer(answers[questions[currentQuestion - 1].id] || "");
    }
  };

  const calculateResult = (finalAnswers: Record<number, string>) => {
    const counts = { E: 0, C: 0, S: 0, O: 0, V: 0, N: 0, F: 0, B: 0 };
    
    Object.values(finalAnswers).forEach(answer => {
      if (counts.hasOwnProperty(answer)) {
        counts[answer as keyof typeof counts]++;
      }
    });

    const energy = counts.E >= counts.C ? "E" : "C";
    const social = counts.S >= counts.O ? "S" : "O";
    const sense = counts.V >= counts.N ? "V" : "N";
    const vibe = counts.F >= counts.B ? "F" : "B";

    const mbtiResult = energy + social + sense + vibe;
    setResult(mbtiResult);
  };

  const handleRetakeTest = () => {
    setIsTestStarted(false);
    setCurrentQuestion(0);
    setAnswers({});
    setCurrentAnswer("");
    setResult(null);
  };

  const handleRecommendTravel = () => {
    navigate("/travel");
  };

  // 메인 소개 화면
  if (!isTestStarted && !result) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-20">
        {/* Header */}
        <header className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white p-6 rounded-b-3xl shadow-xl relative overflow-hidden">
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
              <h1 className="text-xl font-bold">멍BTI</h1>
              <p className="text-blue-100 text-sm">반려견 여행 성향 테스트</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-5 space-y-6">
          {/* 테스트 시작 버튼 - 상단으로 이동 */}
          <div className="pt-2">
            <Button 
              onClick={handleStartTest}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <PawPrint className="w-5 h-5 mr-2" />
              테스트 시작하기
            </Button>
          </div>

          {/* 멍BTI 소개 */}
          <Card className="p-6 bg-white rounded-2xl shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">🐾 멍BTI 여행 유형 테스트 🐾</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                우리 강아지의 진짜 여행 스타일을 발견해 보세요!<br />
                각 질문에 더 가깝다고 생각하는 답변을 선택해 주세요.
              </p>
            </div>
          </Card>

          {/* 여행 성향 기준 설명 */}
          <Card className="p-6 bg-white rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              🎯 평가 기준
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-xl">
                <div className="font-medium text-red-700">E / C (에너지 레벨)</div>
                <div className="text-xs text-red-600 mt-1">활동적 vs 차분한 성향</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="font-medium text-blue-700">S / O (관계 추구)</div>
                <div className="text-xs text-blue-600 mt-1">사교적 vs 주인바라기 성향</div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <div className="font-medium text-green-700">V / N (발달 감각)</div>
                <div className="text-xs text-green-600 mt-1">시각 중심 vs 후각 중심</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <div className="font-medium text-orange-700">F / B (여행 바이브)</div>
                <div className="text-xs text-orange-600 mt-1">꾸미기 vs 자연스러움</div>
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
        </main>

        {/* 여행 성향 설명 다이얼로그 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-bold text-gray-900">
                {selectedTypeData?.title}
              </DialogTitle>
              <p className="text-center text-sm text-gray-500 mt-1">
                {selectedType}
              </p>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                {selectedTypeData?.description}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // 테스트 진행 화면
  if (isTestStarted && !result) {
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const question = questions[currentQuestion];

    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1">
          <div 
            className="bg-blue-600 h-1 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Counter */}
        <div className="text-center py-4">
          <span className="text-lg font-bold text-gray-800">
            {currentQuestion + 1}/{questions.length}
          </span>
        </div>

        {/* Question Card */}
        <div className="p-5">
          <Card className="p-6 bg-white rounded-2xl shadow-lg mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 leading-relaxed">
              {question.question}
            </h2>

            <RadioGroup value={currentAnswer} onValueChange={handleAnswerChange}>
              <div className="space-y-4">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      currentAnswer === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                    onClick={() => handleAnswerChange(option.value)}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={option.value} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 leading-relaxed">
                          {option.text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex space-x-3">
            {currentQuestion > 0 && (
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                className="flex-1 py-3"
              >
                이전 문항
              </Button>
            )}
            <Button
              onClick={handleNextQuestion}
              disabled={!currentAnswer}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 disabled:opacity-50"
            >
              {currentQuestion === questions.length - 1 ? "결과 보기" : "다음 문항"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 결과 화면
  if (result) {
    const resultData = travelTypes.find(type => type.code === result) || travelTypes[0];

    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="text-center py-8">
          <div className="text-6xl mb-4">{resultData.icon}</div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {result}
          </div>
          <div className="text-lg font-semibold text-gray-700">
            {resultData.title}
          </div>
        </div>

        {/* Result Card */}
        <div className="p-5">
          <Card className="p-6 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl shadow-lg text-white mb-6">
            <p className="text-sm leading-relaxed">
              {resultData.description}
            </p>
          </Card>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {resultData.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRecommendTravel}
              className="w-full bg-black text-white font-semibold py-4 rounded-xl hover:bg-gray-800 transition-all duration-200"
            >
              <Heart className="w-5 h-5 mr-2" />
              추천 여행지 보기
            </Button>
            <Button
              variant="outline"
              onClick={handleRetakeTest}
              className="w-full py-3 rounded-xl"
            >
              다시 테스트하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MbtiTest;