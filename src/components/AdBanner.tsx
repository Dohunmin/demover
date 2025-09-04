import React, { useState, useEffect } from 'react';
import hospitalBanner from '@/assets/ad-banner-hospital.jpg';
import groomingBanner from '@/assets/ad-banner-grooming.jpg';
import hotelBanner from '@/assets/ad-banner-hotel.jpg';

interface BannerData {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  link: string;
}

const banners: BannerData[] = [
  {
    id: 1,
    image: hospitalBanner,
    title: "24시 동물병원",
    subtitle: "우리 아이의 건강을 책임집니다",
    link: "#"
  },
  {
    id: 2,
    image: groomingBanner,
    title: "펫살롱",
    subtitle: "우리 강아지를 더욱 예쁘게",
    link: "#"
  },
  {
    id: 3,
    image: hotelBanner,
    title: "펫 동반 호텔",
    subtitle: "가족 모두가 함께하는 휴식",
    link: "#"
  }
];

const AdBanner: React.FC = () => {
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000); // 5초마다 변경

    return () => clearInterval(interval);
  }, []);

  const handleBannerClick = (link: string) => {
    if (link !== "#") {
      window.open(link, '_blank');
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentBanner(index);
  };

  return (
    <div className="w-full bg-muted/50 py-4">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="relative overflow-hidden rounded-lg shadow-lg">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
          >
            {banners.map((banner) => (
              <div 
                key={banner.id} 
                className="w-full flex-shrink-0 cursor-pointer relative"
                onClick={() => handleBannerClick(banner.link)}
              >
                <img 
                  src={banner.image} 
                  alt={banner.title}
                  className="w-full h-32 sm:h-40 object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h3 className="text-lg sm:text-xl font-bold mb-1">{banner.title}</h3>
                    <p className="text-sm sm:text-base opacity-90">{banner.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 인디케이터 점들 */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentBanner ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={() => handleDotClick(index)}
              />
            ))}
          </div>
        </div>
        
        <div className="text-center mt-2">
          <p className="text-xs text-muted-foreground">광고</p>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;