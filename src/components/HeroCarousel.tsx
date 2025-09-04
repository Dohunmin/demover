import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const HeroCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  // 16개의 MBTI 캐릭터 이미지
  const carouselImages = [
    {
      src: "/lovable-uploads/f39b7efb-a574-49a4-86f8-dfa127daa3e4.png",
      alt: "힐링 파트너 - 천사 날개를 가진 평온한 강아지",
      title: "힐링 파트너"
    },
    {
      src: "/lovable-uploads/e8ca226a-618d-4bb0-b3cd-eac205d98834.png",
      alt: "캠핑장 사장님 - 캠핑을 즐기는 활발한 강아지",
      title: "캠핑장 사장님"
    },
    {
      src: "/lovable-uploads/af4489e1-e047-4d27-baa3-e6c1ca85bbb3.png",
      alt: "전속 모델 - 사진 찍기를 좋아하는 강아지",
      title: "전속 모델"
    },
    {
      src: "/lovable-uploads/7045ed78-2529-4e4f-8c6b-ad3477c967f8.png",
      alt: "셀피 마스터 - 셀카봉을 든 강아지",
      title: "셀피 마스터"
    },
    {
      src: "/lovable-uploads/abacd237-2eb4-4143-84d1-c9b03948c4d8.png",
      alt: "리더십 강아지 - 연단에 서 있는 강아지",
      title: "리더십 강아지"
    },
    {
      src: "/lovable-uploads/b479024a-6645-41aa-8a73-be5addc314c5.png",
      alt: "맛집 탐험가 - 파스타를 먹는 강아지",
      title: "맛집 탐험가"
    },
    {
      src: "/lovable-uploads/cdcaabb4-6424-4992-ac2b-5a7a664e596e.png",
      alt: "꿈나라 여행자 - 잠자는 강아지",
      title: "꿈나라 여행자"
    },
    {
      src: "/lovable-uploads/197027de-ff76-4b56-8b3d-8ab975a7e279.png",
      alt: "행운의 강아지 - 클로버를 든 강아지",
      title: "행운의 강아지"
    },
    {
      src: "/lovable-uploads/ddfaa0a6-11d0-4ad2-b6d8-1306f3cd6fac.png",
      alt: "탐정 전문가 - 모자와 돋보기를 든 강아지",
      title: "탐정 전문가"
    },
    {
      src: "/lovable-uploads/9188a998-aac3-4f73-bed8-b58256788c1b.png",
      alt: "보물 발견자 - 보물상자 앞의 별 눈 강아지",
      title: "보물 발견자"
    },
    {
      src: "/lovable-uploads/51275259-7b3c-4951-b2e1-660ab3a8c7b6.png",
      alt: "공사 전문가 - 안전모를 쓴 강아지",
      title: "공사 전문가"
    },
    {
      src: "/lovable-uploads/d75f3e37-17bf-48e4-b6ef-f5634eaeb1db.png",
      alt: "보디가드 - 선글라스와 정장을 입은 강아지",
      title: "보디가드"
    },
    {
      src: "/lovable-uploads/e9fc2d3d-ee70-40a3-9b68-fb74bda78a23.png",
      alt: "운동선수 - 여자아이와 함께 운동하는 강아지",
      title: "운동선수"
    },
    {
      src: "/lovable-uploads/9d619ba3-ef3c-4bfb-95a1-21675749dffe.png",
      alt: "스타일리스트 - 옷걸이 앞의 강아지",
      title: "스타일리스트"
    },
    {
      src: "/lovable-uploads/399d328d-b324-48bf-ab46-d834ea87917c.png",
      alt: "농부 - 당근과 지팡이를 든 강아지",
      title: "농부"
    },
    {
      src: "/lovable-uploads/c75c9fde-7924-40ad-ab29-1146c91a9030.png",
      alt: "베스트 프렌드 - 여자아이 머리 위의 강아지",
      title: "베스트 프렌드"
    }
  ];

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Auto-slide every 3 seconds
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api]);

  const scrollTo = (index: number) => {
    api?.scrollTo(index);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-5 mb-6">
      <div className="relative">
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {carouselImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-transparent shadow-card">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  {/* Gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  
                  {/* Central overlay card with button only */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 text-center max-w-xs mx-4 shadow-lg">
                      <Button 
                        onClick={() => navigate('/mbti')}
                        className="bg-[#4CD2C7] hover:bg-[#3bb5aa] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                      >
                        멍BTI 테스트 하러가기
                      </Button>
                    </div>
                  </div>

                  {/* Image title in bottom left */}
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-lg font-semibold drop-shadow-lg">
                      {image.title}
                    </h3>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Custom navigation arrows with pastel styling */}
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm border-border hover:bg-card/90 transition-all duration-200 hidden md:flex" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm border-border hover:bg-card/90 transition-all duration-200 hidden md:flex" />
        </Carousel>

        {/* Dot indicators */}
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200 hover:scale-110",
                current === index + 1 
                  ? "bg-primary w-6" 
                  : "bg-muted hover:bg-primary/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;