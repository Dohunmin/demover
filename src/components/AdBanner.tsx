import React, { useState, useEffect } from 'react';

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
    image: "/lovable-uploads/ef62330e-d2c8-436c-a93b-94b280eb17ea.png",
    title: "털 끝까지 사랑을 담다",
    subtitle: "펫 그루밍 전문 서비스",
    link: "#"
  },
  {
    id: 2,
    image: "/lovable-uploads/ec9c4fd4-6c05-4760-8af9-ff63c429f4bb.png",
    title: "우리동네 동물병원",
    subtitle: "언제나, 당신 곁에 든든한",
    link: "#"
  },
  {
    id: 3,
    image: "/lovable-uploads/23447610-d606-420e-aa28-dab6485249b2.png",
    title: "반려동물과 함께",
    subtitle: "완벽한 스테이!",
    link: "#"
  },
  {
    id: 4,
    image: "/lovable-uploads/3f350ae4-af49-4927-ba2e-d652d903e2b1.png",
    title: "반려동물 관련 광고문의",
    subtitle: "rislekfk@gmail.com",
    link: "mailto:rislekfk@gmail.com"
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
                  className="w-full h-40 sm:h-48 object-cover"
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