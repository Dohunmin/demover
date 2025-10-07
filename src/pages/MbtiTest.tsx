import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PawPrint, Heart, MapPin, ChevronLeft, ChevronRight, Download } from "lucide-react";
import dogPawIcon from "@/assets/dog-paw-icon.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import html2canvas from "html2canvas";


// 4가지 평가차원 데이터
const dimensions = [
  {
    id: "energy",
    title: "에너지 레벨 (Energy Level)",
    subtitle: "활동적 vs 차분한",
    icon: "⚡",
    bgColor: "",
    options: [
      {
        type: "E",
        title: "활동적인 탐험가 (Energetic Explorer)",
        description: "새로운 장소와 액티비티를 즐기는 에너자이저. 다양한 체험을 할 수 있는 여행지가 잘 맞아요."
      },
      {
        type: "C",
        title: "차분한 동반자 (Calm Companion)",
        description: "안정적이고 편안한 환경을 선호하는 힐링러. 한적한 산책로나 프라이빗 숙소가 더 어울려요."
      }
    ]
  },
  {
    id: "social",
    title: "관계 추구 (Relationship)",
    subtitle: "사교적 vs 주인바라기",
    icon: "🤝",
    bgColor: "",
    options: [
      {
        type: "S",
        title: "핵-인싸 (Social Star)",
        description: "다른 강아지·사람과 쉽게 친해지는 소셜러. 펫 카페, 체험 프로그램이 많은 여행지가 좋아요."
      },
      {
        type: "O",
        title: "주인 바라기 (Owner Only)",
        description: "보호자와 단둘이 있는 시간을 중요하게 생각하는 타입. 프라이빗한 공간, 조용한 코스의 여행이 편안해요."
      }
    ]
  },
  {
    id: "sense",
    title: "발달 감각 (Sense)",
    subtitle: "시각 중심 vs 후각 중심",
    icon: "👁️",
    bgColor: "",
    options: [
      {
        type: "V",
        title: "시각 중심 (Visual-led)",
        description: "풍경과 장면을 눈으로 즐기는 시각형. 포토존, 전망대, 경치 명소에서 행복해해요."
      },
      {
        type: "N",
        title: "후각 중심 (Nose-led)",
        description: "냄새로 세상을 탐험하는 후각형. 시장, 피크닉 장소, 향이 풍부한 공간에서 즐거워해요."
      }
    ]
  },
  {
    id: "vibe",
    title: "여행 바이브 (Vibe)",
    subtitle: "꾸미기 vs 자연스러움",
    icon: "✨",
    bgColor: "",
    options: [
      {
        type: "F",
        title: "꾸꾸꾸 (Fashion Forward)",
        description: "귀엽게 꾸미고 특별한 경험을 추구하는 스타일. 포토존, 인스타 감성 숙소, 예쁜 소품이 많은 여행지가 좋아요."
      },
      {
        type: "B",
        title: "꾸안꾸 (Back to Basics)",
        description: "편안함을 중시하는 자연주의자. 자유롭게 뛰어놀 수 있는 잔디밭, 한적한 산책로 같은 여행지가 어울려요."
      }
    ]
  }
];

// 4가지 차원을 간단한 텍스트로 설명하는 컴포넌트
const DimensionText = () => {  
  return (
    <div className="space-y-8">
      {dimensions.map((dimension, index) => (
        <div 
          key={dimension.id} 
          className="card"
        >
          {/* Large cute dog icon at top */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center shadow-sm">
              <span className="text-3xl">{dimension.icon}</span>
            </div>
          </div>

          {/* Title with emoji */}
          <div className="text-center mb-4">
            <h3 className="card-title text-lg mb-2">
              {dimension.icon} {dimension.title}
            </h3>
            
            {/* Opposing traits bar */}
            <div className="flex items-center justify-between bg-secondary rounded-full px-4 py-2 text-sm font-medium text-muted-foreground">
              <span>{dimension.options[0].title.split(' ')[0]}</span>
              <span className="text-muted-foreground">↔</span>
              <span>{dimension.options[1].title.split(' ')[0]}</span>
            </div>
          </div>

          {/* Two persona mini cards */}
          <div className="space-y-3">
            {dimension.options.map((option, optionIndex) => (
              <div 
                key={option.type}
                className="bg-secondary/50 rounded-xl p-3 border border-border"
              >
                <div className="flex items-start gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-primary`}>
                    {option.type}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-foreground mb-1">
                      {option.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// 테스트 질문 데이터
const questions = [
  {
    id: 1,
    category: "energy",
    question: "꿈에 그리던 여행지에 도착했다! 우리 강아지의 첫 반응은?",
    options: [
      { value: "E", text: "낯선 장소지만 마냥 신나! 꼬리를 흔들며 날 이끌고 달린다." },
      { value: "C", text: "일단 새로운 장소 냄새부터 맡고, 천천히 걸으며 주위 상황을 살핀다." }
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
      { value: "S", text: "\"저 예쁜 거 아세요?\" 꼬리를 살랑이며 다가가 아는 척, 만져달라고 몸을 내민다." },
      { value: "O", text: "칭찬은 좋지만 낯은 가려요. 슬쩍 눈을 피하며 주인의 다리 사이로 쏙 들어간다." }
    ]
  },
  {
    id: 6,
    category: "social",
    question: "낯선 여행지에서 \"이리 와!\" 하고 불렀을 때, 우리 강아지의 행동은?",
    options: [
      { value: "S", text: "일단 주변 구경이 먼저! 부르는 소리는 들었지만 못들은척…새로운 환경에 대한 호기심이 더 크다." },
      { value: "O", text: "세상의 모든 소리 중 주인의 목소리가 1순위! 하던 일을 멈추고 바로 주인에게 달려온다." }
    ]
  },
  {
    id: 7,
    category: "sense",
    question: "처음 와본 해안 산책로! 가장 먼저 하는 행동은?",
    options: [
      { value: "V", text: "고개를 들고 주변의 나무, 하늘, 날아다니는 갈매기를 구경하느라 바쁘다." },
      { value: "N", text: "코를 땅에 박고 온갖 흙냄새, 바다냄새, 다른 친구들의 흔적을 분석하느라 바쁘다." }
    ]
  },
  {
    id: 8,
    category: "sense",
    question: "새로운 장난감을 사주었다. 강아지의 반응은?",
    options: [
      { value: "V", text: "눈앞에서 흔들어주면 바로 흥분! 일단 씹고 뜯고 맛보고, 던져주면 신나게 쫓아간다." },
      { value: "N", text: "섣불리 달려들지 않는다. 처음 보는 물건의 냄새를 한참 동안 맡으며 안전한지 확인한다." }
    ]
  },
  {
    id: 9,
    category: "sense",
    question: "넓은 백사장에 풀어주었다. 주로 어디에 정신이 팔려있나?",
    options: [
      { value: "V", text: "저 멀리 움직이는 물체(사람, 다른 강아지, 갈매기)를 빤히 쳐다본다." },
      { value: "N", text: "바닥에 코를 대고 지그재그로 움직이며, 백사장의 모래가 다 묻어도 냄새 맡기를 멈추지 않는다." }
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
  },
  {
    id: 13,
    category: "bonus",
    question: "여행을 마치고, 강아지가 기념품을 딱 하나 고를 수 있다면?",
    options: [
      { value: "A", text: "그 지역 특산물로 만든 수제 간식" },
      { value: "B", text: "나와 함께 찍은 사진 키링" },
      { value: "C", text: '"멍멍" 소리가 나는 새로운 장난감' }
    ]
  }
];

// 16가지 성향 데이터와 이미지 매핑
export const mbtiImages: { [key: string]: string } = {
  "ESVF": "/lovable-uploads/053c625b-da0b-490a-86c2-5c4ae4c71fe1.png",
  "ESVB": "/lovable-uploads/13aa0338-6e00-4fe2-a46c-8f0bcf6c50dc.png", 
  "ESNF": "/lovable-uploads/d8ca4f20-1e83-4629-8b07-84f381d631f2.png",
  "ESNB": "/lovable-uploads/ce1fcfb5-0d9d-4376-a99f-eaf28ec9709d.png",
  "EOVF": "/lovable-uploads/a59b7728-dcb9-4fd5-b34c-ba874cff8499.png",
  "EOVB": "/lovable-uploads/8e94178e-a6d0-495e-a51e-2db8f9649ad0.png",
  "EONF": "/lovable-uploads/d7bbc895-f98c-41aa-8eaa-c4d442b73b40.png",
  "EONB": "/lovable-uploads/c05b8912-d2cc-4343-9b8f-4c5846316710.png",
  "CSVF": "/lovable-uploads/6f0a82a5-520c-4690-ad10-b7a956fe794c.png",
  "CSVB": "/lovable-uploads/28b87428-54bd-4a64-bd4e-6a42b7a1799b.png",
  "CSNF": "/lovable-uploads/652b14b3-76db-4dc4-a058-74a645b2936b.png",
  "CSNB": "/lovable-uploads/653be78a-fc51-4b6c-8528-9c7b9625be0d.png",
  "COVF": "/lovable-uploads/596aef9c-00b0-4916-87bd-acce0e9cb626.png",
  "COVB": "/lovable-uploads/06ff5d07-2090-44bb-a8ac-51a242eafbb3.png",
  "CONF": "/lovable-uploads/32bcdc3a-cc67-4912-a010-9fafabb7f736.png",
  "CONB": "/lovable-uploads/a0dc78cb-f620-44cb-8f2f-55a8e53550b9.png"
};

// 각 성향별 배경색 매핑
export const mbtiBackgrounds: { [key: string]: string } = {
  "ESVF": "from-cyan-300 to-cyan-400", // 밝은 청록색
  "ESVB": "from-gray-300 to-gray-400", // 회색
  "ESNF": "from-green-200 to-green-300", // 연한 초록
  "ESNB": "from-purple-200 to-purple-300", // 연한 보라
  "EOVF": "from-pink-200 to-pink-300", // 연한 분홍
  "EOVB": "from-purple-200 to-purple-300", // 연한 보라
  "EONF": "from-pink-200 to-pink-300", // 연한 분홍
  "EONB": "from-pink-200 to-pink-300", // 연한 분홍
  "CSVF": "from-purple-300 to-purple-400", // 보라
  "CSVB": "from-green-200 to-green-300", // 연한 초록
  "CSNF": "from-green-200 to-green-300", // 연한 초록
  "CSNB": "from-amber-200 to-amber-300", // 베이지/노란색
  "COVF": "from-pink-200 to-pink-300", // 연한 분홍
  "COVB": "from-sky-200 to-sky-300", // 연한 파랑
  "CONF": "from-gray-300 to-gray-400", // 회색
  "CONB": "from-yellow-200 to-yellow-300" // 노란색
};

export const travelTypes = [
  { 
    code: "ESVF", 
    title: "에너자이저 여행 유튜버",
    description: "구독과 좋아요는 필수! 지치지 않는 에너지로 새로운 장소를 탐험하고, 만나는 모든 사람과 강아지들에게 댕댕펀치를 날리며 구독자를 늘려요. 오늘의 OOTD를 뽐내며 멋진 풍경 앞에서 라이브 방송을 켜는 게 여행의 가장 큰 즐거움이랍니다.",
    tags: ["#유튜버", "#소셜미디어", "#에너지넘침", "#패션"],
    icon: "🎬"
  },
  { 
    code: "ESVB", 
    title: "골목대장 프로참견러",
    description: "\"이 구역의 대장은 바로 나!\" 낯선 여행지에 도착하자마자 온 동네를 뛰어다니며 모든 일에 참견해야 직성이 풀려요. 꾸밈없는 모습 그대로, 새로운 친구들을 이끌고 신나는 모험을 떠나는 타고난 리더입니다.",
    tags: ["#리더십", "#활발함", "#사교적", "#자연스러움"],
    icon: "👑"
  },
  { 
    code: "ESNF", 
    title: "킁킁대는 패셔니스타",
    description: "제 코는 최신 유행의 냄새를 맡죠! 호기심 가득한 코로 낯선 곳의 냄새를 킁킁거리면서도, \"이 옷 어때?\" 하고 뽐내는 건 포기할 수 없어요. 냄새 탐험과 스타일, 둘 다 놓칠 수 없는 욕심쟁이랍니다.",
    tags: ["#후각탐험", "#패션", "#호기심", "#스타일"],
    icon: "👗"
  },
  { 
    code: "ESNB", 
    title: "자연 속의 보물찾기 왕",
    description: "세상은 넓고 맡을 냄새는 많다! 반짝이는 보물을 찾듯, 코를 땅에 대고 온갖 자연의 흔적을 찾아다니는 탐험가. 다른 강아지 친구들과 함께 흙냄새 풀냄새를 맡으며 뛰어놀 때 가장 행복해요.",
    tags: ["#자연탐험", "#보물찾기", "#후각", "#친구들"],
    icon: "🏆"
  },
  { 
    code: "EOVF", 
    title: "견생샷 전문, 전속 모델",
    description: "제 카메라는 오직 보호자뿐이에요. 다른 사람의 부름엔 묵묵부답, 오직 보호자 앞에서만 최고의 포즈를 선보이죠. 보호자가 입혀준 예쁜 옷을 입고 '견생샷'을 찍을 때 가장 빛나는, 보호자만의 전속 모델입니다.",
    tags: ["#모델", "#사진촬영", "#패션", "#보호자전용"],
    icon: "📸"
  },
  { 
    code: "EOVB", 
    title: "가족껌딱지 자연 탐험가",
    description: "우리 가족과 함께라면 어디든 갈 수 있어! 화려한 옷이나 낯선 친구들보다, 우리 가족과 함께 흙길을 달리고 계곡을 건너는 것이 가장 큰 기쁨이에요. 가족의 보폭에 맞춰 함께 걷는 듬직한 탐험가랍니다.",
    tags: ["#가족여행", "#자연탐험", "#충성심", "#모험"],
    icon: "🏔️"
  },
  { 
    code: "EONF", 
    title: "멋쟁이 탐정, 셜록 멍즈",
    description: "사건 발생! 이 냄새의 근원지를 찾아야 해! 멋진 트렌치코트(옷)를 휘날리며, 예리한 코로 사건의 단서를 추적하는 명탐정. 수사가 끝나면 언제나 유일한 파트너, 보호자의 곁으로 돌아가죠.",
    tags: ["#탐정", "#추리", "#패션", "#보호자와둘이"],
    icon: "🔍"
  },
  { 
    code: "EONB", 
    title: "둘만의 비밀 탐사대원",
    description: "이 세상은 보호자와 나, 단둘이 탐험하는 비밀의 장소! 다른 사람의 접근은 허용하지 않아요. 보호자의 발자국 소리를 들으며, 함께 미지의 냄새를 찾아 떠나는 우리만의 비밀 탐사대원입니다.",
    tags: ["#비밀탐사", "#보호자전용", "#탐험", "#독립적"],
    icon: "🗺️"
  },
  { 
    code: "CSVF", 
    title: "까칠한 내향적 슈퍼스타",
    description: "나만의 아우라, 함부로 다가오지 말아줘! 조용한 곳에서 나만의 시간을 즐기지만, 모든 사람들의 시선은 온전히 내게 향해야 해요. 완벽하게 세팅된 스타일을 멀리서 감상해 주는 게 팬들의 기본 매너랍니다.",
    tags: ["#슈퍼스타", "#까칠함", "#내향적", "#패션"],
    icon: "⭐"
  },
  { 
    code: "CSVB", 
    title: "꾸밈없는 캠핑장 사장님",
    description: "\"허허, 좋은 아침이구먼.\" 캠핑장의 아침을 가장 먼저 맞이하며, 모든 텐트를 둘러보는 게 일과인 마음 좋은 사장님. 꾸미지 않은 편안한 모습으로, 오고 가는 모든 이들에게 꼬리를 살랑여주는 터줏대감입니다.",
    tags: ["#캠핑장사장", "#편안함", "#터줏대감", "#소통"],
    icon: "🏕️"
  },
  { 
    code: "CSNF", 
    title: "로컬맛집 비밀 감별사",
    description: "이 집, 찐맛집의 냄새가 난다! 여행지의 숨겨진 맛집을 찾아내는 비밀 감별사. 겉으로는 조용하고 세련된 손님인 척 앉아있지만, 사실은 예리한 코로 주방의 냄새까지 분석하고 있는 미식가랍니다.",
    tags: ["#미식가", "#비밀감별사", "#맛집탐방", "#후각"],
    icon: "🍽️"
  },
  { 
    code: "CSNB", 
    title: "약초캐는 산골도사",
    description: "깊은 산골짜기의 숨겨진 약초를 찾아다니는 도사님. 화려함보다는 자연의 기운을 중시하며, 예리한 코로 흙과 풀의 향기를 읽어내죠. 묵묵히 자기 일에 집중하지만, 가끔 마을에 내려와 신비로운 기운을 나눠주는 지혜로운 여행가입니다.",
    tags: ["#산골도사", "#약초", "#자연치유", "#지혜"],
    icon: "🌿"
  },
  { 
    code: "COVF", 
    title: "좋은 일만 가득한 행운요정",
    description: "내가 곁에 있으면 좋은 일이 생길 거예요! 보호자의 곁에 꼭 붙어, 반짝이는 모습으로 행운을 가져다주는 요정. 나의 존재 자체가 보호자를 빛나게 하는 가장 아름다운 행운 부적이랍니다.",
    tags: ["#행운요정", "#긍정에너지", "#반짝임", "#행복부적"],
    icon: "🧚"
  },
  { 
    code: "COVB", 
    title: "내 옆의 힐링 파트너",
    description: "세상 가장 편안한 내 자리, 바로 보호자의 옆자리! 특별한 활동 없이 보호자 곁에 꼭 붙어 눈을 맞추는 것만으로도 행복 에너지를 충전시켜줘요. 꾸미지 않은 모습 그대로가 가장 큰 위로를 주는, 타고난 힐링 파트너입니다.",
    tags: ["#힐링파트너", "#편안함", "#위로", "#평화"],
    icon: "💆"
  },
  { 
    code: "CONF", 
    title: "가족 옷자락 끝 작은 경호원",
    description: "임무 개시! 가족을 안전하게 보호한다! 가족 구성원 옷자락 끝에 매달려, 낯선 냄새로부터 가족을 지키는 듬직한 경호원. 작지만 강한 책임감으로 무장한, 세상에서 가장 귀여운 경호 임무를 수행 중입니다.",
    tags: ["#경호원", "#보호본능", "#충성", "#가족수호"],
    icon: "🛡️"
  },
  { 
    code: "CONB", 
    title: "포근한 담요 속 탐험가",
    description: "바깥세상은 위험해, 이 담요 속이 나의 우주! 보호자의 체취가 묻은 담요 속에 파묻혀, 코만 내밀고 세상 냄새를 탐험하는 소심한 탐험가. 보호자의 품속이 세상에서 가장 안전하고 흥미진진한 탐험 장소랍니다.",
    tags: ["#담요속탐험", "#안전제일", "#포근함", "#소심한용기"],
    icon: "🛋️"
  }
];

const MbtiTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const resultRef = useRef<HTMLDivElement>(null);

  // 기존 MBTI 결과 불러오기
  useEffect(() => {
    const fetchExistingResult = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('mbti_result')
          .eq('user_id', user.id)
          .single();

        if (data?.mbti_result) {
          setResult(data.mbti_result);
        }
      } catch (error) {
        console.error('기존 MBTI 결과 불러오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingResult();
  }, [user]);

  // 멍BTI 결과 저장 함수
  const saveMbtiResult = async (mbtiResult: string) => {
    if (!user) return;
    
    try {
      const profileData = {
        id: user.id,
        user_id: user.id,
        mbti_result: mbtiResult,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await (supabase as any)
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('멍BTI 결과 저장 오류:', error);
      } else {
        console.log('멍BTI 결과 저장 성공:', mbtiResult);
        toast.success("멍BTI 결과가 저장되었습니다!");
      }
    } catch (error) {
      console.error('멍BTI 저장 실패:', error);
    }
  };

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
    
    // 보너스 질문을 제외한 답변만 계산에 포함
    Object.entries(finalAnswers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === parseInt(questionId));
      if (question && question.category !== "bonus" && counts.hasOwnProperty(answer)) {
        counts[answer as keyof typeof counts]++;
      }
    });

    const energy = counts.E >= counts.C ? "E" : "C";
    const social = counts.S >= counts.O ? "S" : "O";
    const sense = counts.V >= counts.N ? "V" : "N";
    const vibe = counts.F >= counts.B ? "F" : "B";

    const mbtiResult = energy + social + sense + vibe;
    setResult(mbtiResult);
    
    // 결과를 데이터베이스에 저장
    if (user) {
      saveMbtiResult(mbtiResult);
    }
  };

  const handleRetakeTest = () => {
    setIsTestStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setCurrentAnswer("");
    setResult(null);
  };

  const handleRecommendTravel = () => {
    navigate(`/travel?category=${result}`);
  };

  // 결과 이미지로 저장하기
  const handleShareResult = async () => {
    if (!resultRef.current) return;

    try {
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false
      });

      // Canvas를 Blob으로 변환
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `멍BTI_${result}_결과.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success("결과 이미지가 저장되었습니다!");
        }
      }, 'image/png');
    } catch (error) {
      console.error('이미지 저장 실패:', error);
      toast.error("이미지 저장에 실패했습니다.");
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">멍BTI 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 메인 소개 화면
  if (!isTestStarted && !result) {
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
              <h1 className="header-title">멍BTI</h1>
              <p className="header-subtitle">반려견 여행 성향 테스트</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-5 space-y-6">
          {/* 멍BTI 메인 소개 */}
          <div className="card text-center p-6">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <img 
                src={dogPawIcon} 
                alt="강아지 발자국"
                className="w-20 h-20 object-contain"
              />
            </div>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              멍BTI<br />우리 강아지의 여행 취향을<br />알아보세요!
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              반려견도 사람처럼 여행 스타일이 다 다르다는 사실, 알고 계셨나요?<br />
              멍BTI는 강아지의 성격과 행동 패턴을 네 가지 차원으로 분석해 16가지 여행 성향으로 나눈 테스트예요.<br />
              우리 아이의 성향에 맞는 완벽한<br />여행지를 추천해드릴게요.
            </p>
            
            {/* 테스트 시작 버튼 */}
            <Button 
              onClick={handleStartTest}
              className="button-primary w-full mb-6"
            >
              <PawPrint className="w-5 h-5 mr-2" />
              테스트 시작하기
            </Button>
          </div>

          {/* 16가지 여행 성향 설명 */}
          <div className="card p-6">
            <h3 className="card-title text-lg mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" style={{ color: "var(--primary-color)" }} />
              16가지 여행 성향 설명
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {travelTypes.map((type) => (
                <button 
                  key={type.code} 
                  onClick={() => handleTypeClick(type.code)}
                  className="tab-item p-1 text-center transition-all duration-200 cursor-pointer hover:shadow-md rounded-lg overflow-hidden"
                >
                  {mbtiImages[type.code] && (
                    <img 
                      src={mbtiImages[type.code]} 
                      alt={`${type.code} 캐릭터`}
                      className="w-full h-16 object-contain"
                    />
                  )}
                </button>
              ))}
            </div>
            <p className="card-subtitle text-xs mt-4 text-center">
              각 성향별 맞춤 여행지를 추천해드립니다
            </p>
          </div>

          {/* 4가지 차원 소개 */}
          <div className="space-y-4">
            <h3 className="card-title text-lg text-center mb-4">🎯 4가지 평가 차원</h3>
            
            <DimensionText />
          </div>
        </main>

        

        {/* 여행 성향 설명 다이얼로그 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-center">
                {selectedTypeData?.code} - {selectedTypeData?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedTypeData && (
              <div className="space-y-4">
                {/* 캐릭터 이미지 */}
                {mbtiImages[selectedTypeData.code] && (
                  <div className="flex justify-center">
                    <img 
                      src={mbtiImages[selectedTypeData.code]} 
                      alt={`${selectedTypeData.code} 캐릭터`}
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                )}
                
                {/* 성향 설명 */}
                <div className="card">
                  <div className="text-center mb-3">
                    <span className="text-2xl">{selectedTypeData.icon}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-center text-foreground">
                    {selectedTypeData.description}
                  </p>
                </div>
                
                {/* 태그 */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {selectedTypeData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
      <div className="min-h-screen bg-background max-w-md mx-auto">
        {/* Progress Bar */}
        <div className="w-full bg-secondary h-1">
          <div 
            className="bg-primary h-1 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Counter */}
        <div className="text-center py-4">
          <span className="text-lg font-bold text-foreground">
            {currentQuestion + 1}/{questions.length}
          </span>
        </div>

        {/* Question Card */}
        <div className="p-5">
          <Card className="card mb-6">
            <h2 className="text-lg font-bold text-foreground mb-6 leading-relaxed">
              {question.question}
            </h2>

            <RadioGroup value={currentAnswer} onValueChange={handleAnswerChange}>
              <div className="space-y-4">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      currentAnswer === option.value
                        ? "border-primary bg-secondary"
                        : "border-border bg-secondary/50 hover:border-border/80"
                    }`}
                    onClick={() => handleAnswerChange(option.value)}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={option.value} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground leading-relaxed">
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
              className="flex-1 button-primary py-3 disabled:opacity-50"
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
              <h1 className="header-title">멍BTI 결과</h1>
              <p className="header-subtitle">반려견 여행 성향</p>
            </div>
          </div>
        </header>

        {/* Result Content */}
        <div ref={resultRef} className="bg-background p-5">
          {/* Result Header */}
          <div className="text-center py-8">
            <div className="text-6xl mb-4">{resultData.icon}</div>
            <div className="header-title text-2xl mb-2">
              {result}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {resultData.title}
            </div>
          </div>

          {/* Result Card */}
          <Card className="card mb-3">
            {/* 캐릭터 이미지 */}
            {mbtiImages[result] && (
              <div className="flex justify-center mb-6">
                <img 
                  src={mbtiImages[result]} 
                  alt={`${result} 캐릭터`}
                  className="w-32 h-32 object-contain"
                />
              </div>
            )}
            
            <p className="text-sm leading-relaxed text-foreground">
              {resultData.description}
            </p>
          </Card>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {resultData.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-secondary text-muted-foreground rounded-full"
                style={{ 
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 space-y-3">
          <Button
            onClick={handleRecommendTravel}
            className="button-primary w-full py-4"
          >
            <Heart className="w-5 h-5 mr-2" />
            추천 여행지 보기
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleRetakeTest}
              className="py-3 rounded-xl"
            >
              다시 테스트하기
            </Button>
            <Button
              variant="outline"
              onClick={handleShareResult}
              className="py-3 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              결과 저장하기
            </Button>
          </div>
        </div>

        {/* Additional Content - Same as main screen */}
        <div className="p-5 space-y-6">
          {/* 16가지 여행 성향 설명 */}
          <div className="card p-6">
            <h3 className="card-title text-lg mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" style={{ color: "var(--primary-color)" }} />
              16가지 여행 성향 설명
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {travelTypes.map((type) => (
                <button 
                  key={type.code} 
                  onClick={() => handleTypeClick(type.code)}
                  className="tab-item p-1 text-center transition-all duration-200 cursor-pointer hover:shadow-md rounded-lg overflow-hidden"
                >
                  {mbtiImages[type.code] && (
                    <img 
                      src={mbtiImages[type.code]} 
                      alt={`${type.code} 캐릭터`}
                      className="w-full h-16 object-contain"
                    />
                  )}
                  <div className="text-xs font-medium mt-1" style={{ color: "var(--text-primary)" }}>
                    {type.code}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 4가지 차원 설명 */}
          <div className="card p-6">
            <h3 className="card-title text-lg mb-4 flex items-center">
              <PawPrint className="w-5 h-5 mr-2" style={{ color: "var(--primary-color)" }} />
              멍BTI 4가지 성향 차원
            </h3>
            <DimensionText />
          </div>
        </div>

        {/* Dialog for type details */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[95%] max-w-md mx-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-center">
                {selectedTypeData?.code} - {selectedTypeData?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedTypeData && (
              <div className="space-y-4">
                {mbtiImages[selectedTypeData.code] && (
                  <div className="flex justify-center">
                    <img 
                      src={mbtiImages[selectedTypeData.code]} 
                      alt={`${selectedTypeData.code} 캐릭터`}
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                )}
                <p className="text-sm text-center leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {selectedTypeData.description}
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {selectedTypeData.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
};

export default MbtiTest;