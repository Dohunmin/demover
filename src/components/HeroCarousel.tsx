import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

// Use uploaded MBTI character images
import angelHealing from "/lovable-uploads/03b729d9-f143-4a40-9a42-4f54e04a9361.png";
import campingExplorer from "/lovable-uploads/b41f2fd5-8313-479d-8839-742408395a67.png";
import photoModel from "/lovable-uploads/9f1e3228-48c8-46f5-b2e9-f92a07d246a5.png";

const HeroCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  {/* Optional title overlay */}
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