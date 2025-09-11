import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import logoImage from "@/assets/logo.png";

interface TourPlace {
  id: string;
  title: string;
  addr1: string;
  firstimage?: string;
  contentid: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: 'event' | 'sale';
  image_url?: string;
  created_at: string;
}

type RecommendationItem = (TourPlace & { type: 'tour' }) | (NewsItem & { type: 'news' });

const RecommendationSlider = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    dragFree: true,
    slidesToScroll: 1
  });

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      // Fetch pet-friendly tour places from Supabase Edge Function
      const { data: tourData, error: tourError } = await supabase.functions.invoke('combined-tour-api', {
        body: {
          areaCode: '6', // Default to Busan
          numOfRows: '5',
          pageNo: '1',
          keyword: '',
          activeTab: 'pet'
        }
      });

      // Fetch recent news
      const { data: newsData, error: newsError } = await (supabase as any)
        .from('news_posts')
        .select('*')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (newsError) {
        console.error('Error fetching news:', newsError);
      }

      if (tourError) {
        console.error('Error fetching tour data:', tourError);
      }

      const items: RecommendationItem[] = [];

      // Add tour places with images
      if (tourData?.success && tourData?.data?.petTourismPlaces) {
        const tourPlaces = tourData.data.petTourismPlaces
          .filter((item: any) => item.firstImage && item.firstImage.trim() !== '')
          .slice(0, 3)
          .map((item: any) => ({
            id: item.contentId,
            title: item.title,
            addr1: item.addr1,
            firstimage: item.firstImage,
            contentid: item.contentId,
            type: 'tour' as const
          }));
        items.push(...tourPlaces);
      }

      // Add news items
      if (newsData) {
        const newsItems = newsData
          .slice(0, 3)
          .map((item: any) => ({
            ...item,
            type: 'news' as const
          }));
        items.push(...newsItems);
      }

      // Shuffle and limit to 6 items
      const shuffled = items.sort(() => 0.5 - Math.random()).slice(0, 6);
      setRecommendations(shuffled);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollPrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  const getCategoryIcon = (category: 'event' | 'sale') => {
    return category === 'event' ? Calendar : Tag;
  };

  const handleItemClick = (item: RecommendationItem) => {
    if (item.type === 'tour') {
      navigate('/travel');
    } else {
      navigate(`/news/${item.id}`);
    }
  };

  if (loading) {
    return (
      <div className="px-5 py-6">
        <h2 className="card-title text-lg mb-4">이런 곳은 어때요?</h2>
        <p className="card-subtitle text-sm mb-4">🌊 우리 강아지와 가볼만한 장소는?</p>
        <div className="flex space-x-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-none w-64 h-36 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="card-title text-lg mb-1">이런 곳은 어때요?</h2>
          <p className="card-subtitle text-sm">🌊 우리 강아지와 가볼만한 장소는?</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={scrollPrev}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={scrollNext}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {recommendations.map((item) => (
            <Card 
              key={`${item.type}-${item.id}`} 
              className="flex-none w-64 h-36 p-0 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleItemClick(item)}
            >
              <div className="relative h-full">
                {item.type === 'tour' && (item as TourPlace & { type: 'tour' }).firstimage ? (
                  <img 
                    src={(item as TourPlace & { type: 'tour' }).firstimage} 
                    alt={(item as TourPlace & { type: 'tour' }).title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = logoImage;
                      target.className = "absolute inset-0 w-full h-full object-contain p-4 bg-gradient-to-br from-blue-50 to-orange-50";
                    }}
                  />
                ) : item.type === 'news' && (item as NewsItem & { type: 'news' }).image_url ? (
                  <img 
                    src={(item as NewsItem & { type: 'news' }).image_url} 
                    alt={(item as NewsItem & { type: 'news' }).title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = logoImage;
                      target.className = "absolute inset-0 w-full h-full object-contain p-4 bg-gradient-to-br from-blue-50 to-orange-50";
                    }}
                  />
                ) : (
                  <img 
                    src={logoImage}
                    alt="멍멍 여행 로고"
                    className="absolute inset-0 w-full h-full object-contain p-4 bg-gradient-to-br from-blue-50 to-orange-50"
                  />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40" />
                
                {/* Content */}
                <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                        {item.type === 'tour' 
                          ? (item as TourPlace & { type: 'tour' }).title
                          : (item as NewsItem & { type: 'news' }).title
                        }
                      </h3>
                      {item.type === 'tour' ? (
                        <p className="text-xs opacity-90 line-clamp-1">
                          {(item as TourPlace & { type: 'tour' }).addr1}
                        </p>
                      ) : (
                        <p className="text-xs opacity-90 line-clamp-2">
                          {(item as NewsItem & { type: 'news' }).content}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {item.type === 'tour' ? (
                        <MapPin className="w-3 h-3" />
                      ) : (
                        <>
                          {(() => {
                            const Icon = getCategoryIcon((item as NewsItem & { type: 'news' }).category);
                            return <Icon className="w-3 h-3" />;
                          })()}
                        </>
                      )}
                      <span className="text-xs font-medium">
                        {item.type === 'tour' ? '여행지' : 
                         (item as NewsItem & { type: 'news' }).category === 'event' ? '이벤트' : '세일'
                        }
                      </span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="text-xs h-6 px-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
                      }}
                    >
                      보기
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {recommendations.length === 0 && (
            <Card className="flex-none w-64 h-36 p-4 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  추천 장소를 불러올 수 없습니다
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationSlider;