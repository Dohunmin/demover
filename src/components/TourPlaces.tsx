import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Search, Heart, PawPrint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TourPlace {
  contentId: string;
  title: string;
  addr1: string;
  addr2: string;
  image: string;
  tel: string;
  mapx: string;
  mapy: string;
  areacode: string;
  sigungucode: string;
}

interface TourApiResponse {
  pageNo: number;
  numOfRows: number;
  totalCount: number;
  data: TourPlace[];
}

interface PetTourData {
  response?: {
    body?: {
      items?: {
        item?: any[];
      };
      totalCount?: number;
    };
  };
}

const TourPlaces = () => {
  const [tourPlaces, setTourPlaces] = useState<TourPlace[]>([]);
  const [petTourPlaces, setPetTourPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"general" | "pet">("general");

  useEffect(() => {
    fetchTourPlaces();
    fetchPetTourPlaces();
    testApiKey();
  }, [currentPage]);

  const fetchTourPlaces = async (keyword?: string) => {
    setLoading(true);
    try {
      // 임시 데이터로 테스트
      const mockData = {
        pageNo: 1,
        numOfRows: 10,
        totalCount: 100,
        data: [
          {
            contentId: "1",
            title: "서울대공원",
            addr1: "경기도 과천시 대공원광장로 102",
            addr2: "",
            image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=300&h=200&fit=crop",
            tel: "02-500-7335",
            mapx: "127.0276",
            mapy: "37.4363",
            areacode: "31",
            sigungucode: "13"
          },
          {
            contentId: "2", 
            title: "남산공원",
            addr1: "서울특별시 중구 남산공원길 105",
            addr2: "",
            image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
            tel: "02-3783-5900",
            mapx: "126.9895",
            mapy: "37.5512",
            areacode: "1",
            sigungucode: "24"
          },
          {
            contentId: "3",
            title: "여의도 한강공원",
            addr1: "서울특별시 영등포구 여의동로 330",
            addr2: "",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop",
            tel: "02-3780-0561",
            mapx: "126.9312",
            mapy: "37.5281",
            areacode: "1",
            sigungucode: "22"
          }
        ]
      };

      setTourPlaces(mockData.data);
      setTotalCount(mockData.totalCount);
      
      // 실제 API 호출 (백그라운드에서)
      setTimeout(async () => {
        try {
          const params = new URLSearchParams({
            pageNo: currentPage.toString(),
            numOfRows: '10',
          });

          if (keyword) {
            params.append('keyword', keyword);
          }

          const response = await fetch(`https://iuoofmeyakduqteyptkq.supabase.co/functions/v1/korea-tour-api?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1b29mbWV5YWtkdXF0ZXlwdGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTYzNDMsImV4cCI6MjA2OTg5MjM0M30.bY_V1Mv5M2-fLUTFcsn4tdXzVFHsSSTGmlm6cEVltp4`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.data && result.data.length > 0) {
              setTourPlaces(result.data);
              setTotalCount(result.totalCount || 0);
              toast.success('실제 여행지 데이터를 불러왔습니다!');
            }
          }
        } catch (apiError) {
          console.log('백그라운드 API 호출 실패 (임시 데이터 사용 중):', apiError);
        }
      }, 1000);

    } catch (error) {
      console.error('Error fetching tour places:', error);
      toast.error('관광지 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const testApiKey = async () => {
    try {
      const response = await fetch(`https://iuoofmeyakduqteyptkq.supabase.co/functions/v1/test-api-key`, {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1b29mbWV5YWtkdXF0ZXlwdGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTYzNDMsImV4cCI6MjA2OTg5MjM0M30.bY_V1Mv5M2-fLUTFcsn4tdXzVFHsSSTGmlm6cEVltp4`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API Key Test Result:', result);
        if (!result.hasApiKey) {
          toast.error('한국관광공사 API 키가 설정되지 않았습니다.');
        }
      }
    } catch (error) {
      console.error('API Key Test Error:', error);
    }
  };

  const fetchPetTourPlaces = async () => {
    try {
      // 임시 반려동물 동반 가능 여행지 데이터
      const mockPetTourData = [
        {
          contentid: "pet1",
          title: "반려견 카페 더독",
          addr1: "서울특별시 강남구 논현로 132길 5",
          addr2: "",
          firstimage: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300&h=200&fit=crop",
          tel: "02-545-5555"
        },
        {
          contentid: "pet2", 
          title: "도그런 애견카페",
          addr1: "서울특별시 마포구 와우산로 94",
          addr2: "",
          firstimage: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=200&fit=crop",
          tel: "02-322-7788"
        },
        {
          contentid: "pet3",
          title: "강아지와 함께하는 펜션",
          addr1: "강원도 춘천시 사북면 화악산길 142",
          addr2: "",
          firstimage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop",
          tel: "033-261-9900"
        }
      ];

      setPetTourPlaces(mockPetTourData);
      
      // 백그라운드에서 실제 API 호출 시도
      setTimeout(async () => {
        try {
          const params = new URLSearchParams({
            pageNo: currentPage.toString(),
            numOfRows: '10',
          });

          const response = await fetch(`https://iuoofmeyakduqteyptkq.supabase.co/functions/v1/pet-tour-api?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1b29mbWV5YWtkdXF0ZXlwdGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTYzNDMsImV4cCI6MjA2OTg5MjM0M30.bY_V1Mv5M2-fLUTFcsn4tdXzVFHsSSTGmlm6cEVltp4`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            const items = result.response?.body?.items?.item || [];
            const realData = Array.isArray(items) ? items : [items].filter(Boolean);
            if (realData.length > 0) {
              setPetTourPlaces(realData);
              toast.success('실제 반려동물 여행지 데이터를 불러왔습니다!');
            }
          }
        } catch (apiError) {
          console.log('백그라운드 Pet API 호출 실패 (임시 데이터 사용 중):', apiError);
        }
      }, 1500);

    } catch (error) {
      console.error('Error fetching pet tour places:', error);
      toast.error('반려동물 여행지 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTourPlaces(searchKeyword);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatAddress = (addr1: string, addr2: string) => {
    return `${addr1} ${addr2}`.trim();
  };

  return (
    <div className="px-5 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-900">여행지 정보</h3>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "general" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("general")}
            className="text-xs"
          >
            일반 관광지
          </Button>
          <Button
            variant={activeTab === "pet" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("pet")}
            className="text-xs"
          >
            <PawPrint className="w-3 h-3 mr-1" />
            반려동물 동반
          </Button>
        </div>
      </div>

      {activeTab === "general" && (
        <div className="mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="여행지를 검색해보세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} size="sm">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">로딩 중...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === "general" ? (
            tourPlaces.length > 0 ? (
              tourPlaces.map((place) => (
                <Card key={place.contentId} className="p-4 shadow-sm border-0 bg-white rounded-2xl">
                  <div className="flex gap-4">
                    {place.image && (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={place.image} 
                          alt={place.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                        {place.title}
                      </h4>
                      {formatAddress(place.addr1, place.addr2) && (
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="line-clamp-1">{formatAddress(place.addr1, place.addr2)}</span>
                        </div>
                      )}
                      {place.tel && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="line-clamp-1">{place.tel}</span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="p-2 h-auto">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">검색 결과가 없습니다.</p>
              </Card>
            )
          ) : (
            petTourPlaces.length > 0 ? (
              petTourPlaces.map((place, index) => (
                <Card key={place.contentid || index} className="p-4 shadow-sm border-0 bg-white rounded-2xl">
                  <div className="flex gap-4">
                    {place.firstimage && (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={place.firstimage} 
                          alt={place.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 line-clamp-1">
                          {place.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                          <PawPrint className="w-2 h-2 mr-1" />
                          반려동물 동반 가능
                        </Badge>
                      </div>
                      {place.addr1 && (
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="line-clamp-1">{place.addr1} {place.addr2 || ''}</span>
                        </div>
                      )}
                      {place.tel && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="line-clamp-1">{place.tel}</span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="p-2 h-auto">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">반려동물 동반 여행지 정보가 없습니다.</p>
              </Card>
            )
          )}
        </div>
      )}

      {activeTab === "general" && totalCount > 10 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                이전
              </Button>
            )}
            <span className="flex items-center px-3 text-sm text-gray-600">
              {currentPage}
            </span>
            {currentPage * 10 < totalCount && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                다음
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TourPlaces;