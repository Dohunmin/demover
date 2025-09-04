import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PawPrint } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const MBTIHeroSlider = () => {
  const [api, setApi] = useState<CarouselApi>();
  const navigate = useNavigate();

  const mbtiCharacters = [
    {
      src: "/lovable-uploads/653be78a-fc51-4b6c-8528-9c7b9625be0d.png",
      alt: "활발한 탐험가",
      name: "활발한 탐험가"
    },
    {
      src: "/lovable-uploads/596aef9c-00b0-4916-87bd-acce0e9cb626.png",
      alt: "차분한 힐링러",
      name: "차분한 힐링러"
    },
    {
      src: "/lovable-uploads/06ff5d07-2090-44bb-a8ac-51a242eafbb3.png",
      alt: "사교적인 소셜러",
      name: "사교적인 소셜러"
    },
    {
      src: "/lovable-uploads/32bcdc3a-cc67-4912-a010-9fafabb7f736.png",
      alt: "주인바라기 전용러버",
      name: "주인바라기 전용러버"
    },
    {
      src: "/lovable-uploads/a0dc78cb-f620-44cb-8f2f-55a8e53550b9.png",
      alt: "시각적 풍景러버",
      name: "시각적 풍경러버"
    },
    {
      src: "/lovable-uploads/ce1fcfb5-0d9d-4376-a99f-eaf28ec9709d.png",
      alt: "후각적 탐험가",
      name: "후각적 탐험가"
    },
    {
      src: "/lovable-uploads/c05b8912-d2cc-4343-9b8f-4c5846316710.png",
      alt: "패션 스타일리스트",
      name: "패션 스타일리스트"
    },
    {
      src: "/lovable-uploads/28b87428-54bd-4a64-bd4e-6a42b7a1799b.png",
      alt: "자연스러운 프리덤러",
      name: "자연스러운 프리덤러"
    },
    {
      src: "/lovable-uploads/652b14b3-76db-4dc4-a058-74a645b2936b.png",
      alt: "활발한 소셜러",
      name: "활발한 소셜러"
    },
    {
      src: "/lovable-uploads/a59b7728-dcb9-4fd5-b34c-ba874cff8499.png",
      alt: "차분한 전용러버",
      name: "차분한 전용러버"
    },
    {
      src: "/lovable-uploads/8e94178e-a6d0-495e-a51e-2db8f9649ad0.png",
      alt: "활발한 풍경러버",
      name: "활발한 풍경러버"
    },
    {
      src: "/lovable-uploads/d8ca4f20-1e83-4629-8b07-84f381d631f2.png",
      alt: "차분한 탐험가",
      name: "차분한 탐험가"
    },
    {
      src: "/lovable-uploads/d7bbc895-f98c-41aa-8eaa-c4d442b73b40.png",
      alt: "활발한 스타일리스트",
      name: "활발한 스타일리스트"
    },
    {
      src: "/lovable-uploads/6f0a82a5-520c-4690-ad10-b7a956fe794c.png",
      alt: "차분한 프리덤러",
      name: "차분한 프리덤러"
    },
    {
      src: "/lovable-uploads/053c625b-da0b-490a-86c2-5c4ae4c71fe1.png",
      alt: "사교적 풍경러버",
      name: "사교적 풍경러버"
    },
    {
      src: "/lovable-uploads/13aa0338-6e00-4fe2-a46c-8f0bcf6c50dc.png",
      alt: "주인바라기 탐험가",
      name: "주인바라기 탐험가"
    }
  ];

  // Auto-slide every 2 seconds
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 2000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="w-full h-screen relative">
      <Carousel
        setApi={setApi}
        className="w-full h-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="h-full">
          {mbtiCharacters.map((character, index) => (
            <CarouselItem key={index} className="h-full">
              <div className="relative w-full h-full">
                {/* Background Character Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${character.src})`,
                  }}
                />
                
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/20" />
                
                {/* Centered Overlay Card */}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
                      우리 멍멍이는 어떤 여행러일까?
                    </h2>
                    
                    <Button 
                      onClick={() => navigate("/mbti")}
                      className="w-full h-12 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: '#4CD2C7' }}
                    >
                      <PawPrint className="w-5 h-5 mr-2" />
                      멍BTI 테스트 하러가기
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default MBTIHeroSlider;