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
  }, [currentPage]);

  const fetchTourPlaces = async (keyword?: string) => {
    setLoading(true);
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: TourApiResponse = await response.json();
      setTourPlaces(result.data || []);
      setTotalCount(result.totalCount || 0);
    } catch (error) {
      console.error('Error fetching tour places:', error);
      toast.error('관광지 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPetTourPlaces = async () => {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PetTourData = await response.json();
      const items = result.response?.body?.items?.item || [];
      setPetTourPlaces(Array.isArray(items) ? items : [items].filter(Boolean));
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