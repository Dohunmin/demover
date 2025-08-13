import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Search, Heart, PawPrint } from "lucide-react";
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

const TourPlaces = () => {
  const [tourPlaces, setTourPlaces] = useState<TourPlace[]>([]);
  const [petTourPlaces, setPetTourPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [petLoading, setPetLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"general" | "pet">("general");

  useEffect(() => {
    fetchTourPlaces();
  }, [currentPage]);

  useEffect(() => {
    if (activeTab === "pet") {
      fetchPetTourPlaces();
    }
  }, [activeTab]);

  const fetchTourPlaces = async (keyword?: string) => {
    setLoading(true);
    
    // API가 계속 실패하므로 임시 더미 데이터 사용
    const dummyData = [
      {
        contentId: "1",
        title: "경복궁",
        addr1: "서울특별시 종로구 사직로 161",
        addr2: "",
        image: "/api/placeholder/300/200",
        tel: "02-3700-3900",
        mapx: "126.977",
        mapy: "37.578",
        areacode: "1",
        sigungucode: "1"
      },
      {
        contentId: "2", 
        title: "제주 한라산",
        addr1: "제주특별자치도 제주시 해안동",
        addr2: "",
        image: "/api/placeholder/300/200",
        tel: "064-713-9950",
        mapx: "126.531",
        mapy: "33.362",
        areacode: "39",
        sigungucode: "1"
      },
      {
        contentId: "3",
        title: "부산 해운대해수욕장", 
        addr1: "부산광역시 해운대구 우동",
        addr2: "",
        image: "/api/placeholder/300/200",
        tel: "051-749-4000",
        mapx: "129.160",
        mapy: "35.158",
        areacode: "6",
        sigungucode: "2"
      },
      {
        contentId: "4",
        title: "서울 남산타워",
        addr1: "서울특별시 용산구 남산공원길 105",
        addr2: "",
        image: "/api/placeholder/300/200",
        tel: "02-3455-9277",
        mapx: "126.988",
        mapy: "37.551",
        areacode: "1",
        sigungucode: "15"
      },
      {
        contentId: "5",
        title: "강릉 경포해수욕장",
        addr1: "강원특별자치도 강릉시 창해로 514",
        addr2: "",
        image: "/api/placeholder/300/200",
        tel: "033-640-4414",
        mapx: "128.908",
        mapy: "37.795",
        areacode: "32",
        sigungucode: "1"
      }
    ];

    setTimeout(() => {
      const filteredData = keyword 
        ? dummyData.filter(place => place.title.includes(keyword) || place.addr1.includes(keyword))
        : dummyData;
      
      setTourPlaces(filteredData);
      setTotalCount(filteredData.length);
      setLoading(false);
      toast.success("임시 데이터로 표시 중입니다");
    }, 500);
  };

  const fetchPetTourPlaces = async () => {
    setPetLoading(true);
    
    // 펫 여행지 임시 더미 데이터
    const petDummyData = [
      {
        contentId: "p1",
        title: "반려견 동반 카페 서울숲",
        addr1: "서울특별시 성동구 뚝섬로",
        addr2: "",
        image: "/api/placeholder/300/200",
        tel: "02-460-2905",
        mapx: "127.044",
        mapy: "37.544",
        areacode: "1",
        sigungucode: "21"
      },
      {
        contentId: "p2",
        title: "제주 애견동반 펜션",
        addr1: "제주특별자치도 서귀포시 성산읍",
        addr2: "",
        image: "/api/placeholder/300/200", 
        tel: "064-782-0000",
        mapx: "126.926",
        mapy: "33.461",
        areacode: "39",
        sigungucode: "4"
      },
      {
        contentId: "p3",
        title: "부산 반려동물 해변",
        addr1: "부산광역시 기장군 일광면",
        addr2: "",
        image: "/api/placeholder/300/200",
        tel: "051-709-4000",
        mapx: "129.223",
        mapy: "35.260",
        areacode: "6",
        sigungucode: "3"
      }
    ];

    setTimeout(() => {
      setPetTourPlaces(petDummyData);
      setPetLoading(false);
      toast.success("임시 펫 여행지 데이터로 표시 중입니다");
    }, 500);
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

      {(loading || petLoading) ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">
            {activeTab === "general" ? "관광지 정보" : "반려동물 여행지 정보"}를 불러오는 중...
          </p>
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
                <p className="text-gray-500">
                  {searchKeyword ? '검색 결과가 없습니다.' : '여행지 정보가 없습니다.'}
                </p>
                <Button 
                  onClick={() => fetchTourPlaces()}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  다시 불러오기
                </Button>
              </Card>
            )
          ) : (
            petTourPlaces.length > 0 ? (
              petTourPlaces.map((place, index) => (
                <Card key={place.contentId || index} className="p-4 shadow-sm border-0 bg-white rounded-2xl">
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
                          <span className="line-clamp-1">
                            {formatAddress(place.addr1, place.addr2 || '')}
                          </span>
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
                <Button 
                  onClick={() => fetchPetTourPlaces()}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  다시 불러오기
                </Button>
              </Card>
            )
          )}
        </div>
      )}

      {activeTab === "general" && totalCount > 5 && (
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
            {currentPage * 5 < totalCount && (
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