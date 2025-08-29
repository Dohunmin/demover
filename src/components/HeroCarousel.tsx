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

// Import existing dog images
import angelDog from "@/assets/calm-companion-dog.jpg";
import campingDog from "@/assets/energetic-explorer-dog.jpg"; 
import cameraDog from "@/assets/visual-led-dog.jpg";
import beachDogs from "@/assets/beach-dogs.jpg";
import socialDog from "@/assets/social-star-dog.jpg";

const HeroCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const carouselImages = [
    {
      src: beachDogs,
      alt: "해변에서 놀고 있는 강아지들",
      title: "해변 여행",
    },
    {
      src: campingDog,
      alt: "캠핑을 즐기는 활발한 강아지",
      title: "캠핑 모험",
    },
    {
      src: cameraDog,
      alt: "사진 찍기를 좋아하는 강아지",
      title: "포토 투어",
    },
    {
      src: angelDog,
      alt: "평온한 여행을 즐기는 강아지",
      title: "힐링 여행",
    },
    {
      src: socialDog,
      alt: "사교적인 강아지",
      title: "소셜 여행",
    },
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
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.1)]">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  {/* Gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
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

          {/* Custom navigation arrows */}
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border-white/50 hover:bg-white/90 transition-all duration-200 hidden md:flex" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border-white/50 hover:bg-white/90 transition-all duration-200 hidden md:flex" />
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
                  ? "bg-[#4E6EF2] w-6" 
                  : "bg-[#D3D3D3] hover:bg-[#4E6EF2]/50"
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