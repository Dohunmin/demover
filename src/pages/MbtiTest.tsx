import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, PawPrint, Heart } from "lucide-react";

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

// 결과 타입 정의
const resultTypes = {
  "ESVF": {
    title: "에너자이저 여행 유튜버",
    subtitle: "포근한 담요 속 탐험가",
    description: "바깥세상은 위험해, 이 담요 속이 나의 우주! 보호자의 체취가 묻은 담요 속에 파묻혀, 코만 내밀고 세상 냄새를 탐험하는 소심한 탐험가. 보호자의 품속이 세상에서 가장 안전하고 흥미진진한 탐험 장소랍니다.",
    tags: ["#여행러", "#멍BTI", "#ESVF", "#강아지여행"],
    icon: "🛋️"
  },
  // 나머지 16가지 타입들도 추가 (예시로 하나만 보여줌)
  "CONB": {
    title: "포근한 담요 속 탐험가",
    subtitle: "포근한 담요 속 탐험가",
    description: "바깥세상은 위험해, 이 담요 속이 나의 우주! 보호자의 체취가 묻은 담요 속에 파묻혀, 코만 내밀고 세상 냄새를 탐험하는 소심한 탐험가. 보호자의 품속이 세상에서 가장 안전하고 흥미진진한 탐험 장소랍니다.",
    tags: ["#여행러", "#멍BTI", "#CONB", "#강아지여행"],
    icon: "🛋️"
  }
};

const MbtiTest = () => {
  const navigate = useNavigate();
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [result, setResult] = useState<string | null>(null);

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
        </main>
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
    const resultData = resultTypes[result as keyof typeof resultTypes] || resultTypes["CONB"];

    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="text-center py-8">
          <div className="text-6xl mb-4">{resultData.icon}</div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {result}
          </div>
          <div className="text-lg font-semibold text-gray-700">
            {resultData.subtitle}
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