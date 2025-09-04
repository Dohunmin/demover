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
      src: "/lovable-uploads/03b729d9-f143-4a40-9a42-4f54e04a9361.png",
      alt: "힐링 파트너 - 천사 날개를 가진 평온한 강아지",
      title: "힐링 파트너"
    },
    {
      src: "/lovable-uploads/b41f2fd5-8313-479d-8839-742408395a67.png",
      alt: "캠핑장 사장님 - 캠핑을 즐기는 활발한 강아지",
      title: "캠핑장 사장님"
    },
    {
      src: "/lovable-uploads/9f1e3228-48c8-46f5-b2e9-f92a07d246a5.png",
      alt: "전속 모델 - 사진 찍기를 좋아하는 강아지",
      title: "전속 모델"
    },
    {
      src: "/lovable-uploads/053c625b-da0b-490a-86c2-5c4ae4c71fe1.png",
      alt: "패션 리더 - 스타일리시한 강아지",
      title: "패션 리더"
    },
    {
      src: "/lovable-uploads/06ff5d07-2090-44bb-a8ac-51a242eafbb3.png",
      alt: "활동적인 탐험가 - 에너지 넘치는 강아지",
      title: "활동적인 탐험가"
    },
    {
      src: "/lovable-uploads/13aa0338-6e00-4fe2-a46c-8f0bcf6c50dc.png",
      alt: "차분한 동반자 - 온화한 성격의 강아지",
      title: "차분한 동반자"
    },
    {
      src: "/lovable-uploads/28b87428-54bd-4a64-bd4e-6a42b7a1799b.png",
      alt: "기본에 충실한 - 클래식한 강아지",
      title: "기본에 충실한"
    },
    {
      src: "/lovable-uploads/32bcdc3a-cc67-4912-a010-9fafabb7f736.png",
      alt: "코로 이끄는 - 후각이 뛰어난 강아지",
      title: "코로 이끄는"
    },
    {
      src: "/lovable-uploads/596aef9c-00b0-4916-87bd-acce0e9cb626.png",
      alt: "눈으로 이끄는 - 시각적 감각이 뛰어난 강아지",
      title: "눈으로 이끄는"
    },
    {
      src: "/lovable-uploads/652b14b3-76db-4dc4-a058-74a645b2936b.png",
      alt: "주인만 바라보는 - 충성심 깊은 강아지",
      title: "주인만 바라보는"
    },
    {
      src: "/lovable-uploads/653be78a-fc51-4b6c-8528-9c7b9625be0d.png",
      alt: "사교적인 스타 - 인기 많은 강아지",
      title: "사교적인 스타"
    },
    {
      src: "/lovable-uploads/6f0a82a5-520c-4690-ad10-b7a956fe794c.png",
      alt: "해변의 개들 - 바다를 좋아하는 강아지들",
      title: "해변의 개들"
    },
    {
      src: "/lovable-uploads/8e8852b6-3098-4496-bbe1-93b235fc4e6a.png",
      alt: "질문하는 개 - 호기심 많은 강아지",
      title: "질문하는 개"
    },
    {
      src: "/lovable-uploads/8e94178e-a6d0-495e-a51e-2db8f9649ad0.png",
      alt: "모험가 정신 - 탐험을 좋아하는 강아지",
      title: "모험가 정신"
    },
    {
      src: "/lovable-uploads/a59b7728-dcb9-4fd5-b34c-ba874cff8499.png",
      alt: "편안한 동반자 - 안정감을 주는 강아지",
      title: "편안한 동반자"
    },
    {
      src: "/lovable-uploads/ce1fcfb5-0d9d-4376-a99f-eaf28ec9709d.png",
      alt: "독립적인 성격 - 자유로운 영혼의 강아지",
      title: "독립적인 성격"
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
                  
                  {/* Central overlay card */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md mx-4 shadow-lg">
                      <h2 className="text-2xl font-bold text-foreground mb-6">
                        우리 멍멍이는 어떤 여행러일까?
                      </h2>
                      <Button 
                        onClick={() => navigate('/mbti')}
                        className="bg-[#4CD2C7] hover:bg-[#3bb5aa] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                      >
                        멍BTI 테스트 하러가기
                      </Button>
                    </div>
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