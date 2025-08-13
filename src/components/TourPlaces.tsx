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
  const [petLoading, setPetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [petError, setPetError] = useState<string | null>(null);
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
    setError(null);
    
    try {
      // 먼저 클라이언트에서 직접 API 호출 시도
      const serviceKey = 'lZf40IMmpeOv3MWEUV+xoRC+zuAYiUYcDyMVbm5AVPsFZ+ZAbhezzET3VZlh8y8dTZGsDIot0RVq0RzYgvoECA==';
      const params = new URLSearchParams({
        serviceKey: serviceKey,
        pageNo: currentPage.toString(),
        numOfRows: '50',
        MobileApp: 'LovableApp',
        MobileOS: 'ETC',
        _type: 'json'
      });
      
      if (keyword) {
        params.append('keyword', keyword);
      }
      
      const apiUrl = `https://apis.data.go.kr/B551011/KorService1/${keyword ? 'searchKeyword1' : 'areaBasedList1'}?${params.toString()}`;
      
      console.log('클라이언트에서 직접 API 호출 시도:', apiUrl.replace(serviceKey, 'MASKED_KEY'));
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`클라이언트 API 호출 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('클라이언트 API 성공 응답:', data);
      
      const items = data.response?.body?.items?.item || [];
      const processedData = Array.isArray(items) ? items : items ? [items] : [];
      
      setTourPlaces(processedData.map((item: any) => ({
        contentId: item.contentid,
        title: item.title,
        addr1: item.addr1 || '',
        addr2: item.addr2 || '',
        image: item.firstimage || item.firstimage2 || '',
        tel: item.tel || '',
        mapx: item.mapx || '',
        mapy: item.mapy || '',
        areacode: item.areacode || '',
        sigungucode: item.sigungucode || ''
      })));
      
      setTotalCount(data.response?.body?.totalCount || 0);
      
      if (processedData.length > 0) {
        toast.success('여행지 정보를 성공적으로 불러왔습니다!');
      }
      
    } catch (clientError) {
      console.error('클라이언트 직접 호출 실패, Edge Function 시도:', clientError);
      
      // 클라이언트 호출 실패시 Edge Function 폴백
      try {
        const params = new URLSearchParams({
          pageNo: currentPage.toString(),
          numOfRows: '50'
        });
        
        if (keyword) {
          params.append('keyword', keyword);
        }
        
        const url = `https://wdmqabtatkibyveilzut.supabase.co/functions/v1/korea-tour-api?${params.toString()}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkbXFhYnRhdGtpYnl2ZWlsenV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMjkxNzksImV4cCI6MjA2OTYwNTE3OX0.iBXrQyNDJ3OqoCTOi4XjSr-0Qd8B7y_upuCaQcWPwCI`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkbXFhYnRhdGtpYnl2ZWlsenV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMjkxNzksImV4cCI6MjA2OTYwNTE3OX0.iBXrQyNDJ3OqoCTOi4XjSr-0Qd8B7y_upuCaQcWPwCI'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setTourPlaces(data?.data || []);
        setTotalCount(data?.totalCount || 0);
        
        if (data?.data?.length > 0) {
          toast.success('여행지 정보를 성공적으로 불러왔습니다!');
        }
        
      } catch (edgeError) {
        console.error('Edge Function도 실패:', edgeError);
        setError('여행지 정보를 불러오는데 실패했습니다. 다시 시도해주세요.');
        setTourPlaces([]);
        setTotalCount(0);
        toast.error('여행지 정보를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPetTourPlaces = async () => {
    setPetLoading(true);
    setPetError(null);
    
    try {
      const params = new URLSearchParams({
        pageNo: '1',
        numOfRows: '100'
      });
      
      // GET 요청으로 변경
      const url = `https://wdmqabtatkibyveilzut.supabase.co/functions/v1/pet-tour-api?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkbXFhYnRhdGtpYnl2ZWlsenV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMjkxNzksImV4cCI6MjA2OTYwNTE3OX0.iBXrQyNDJ3OqoCTOi4XjSr-0Qd8B7y_upuCaQcWPwCI`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkbXFhYnRhdGtpYnl2ZWlsenV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMjkxNzksImV4cCI6MjA2OTYwNTE3OX0.iBXrQyNDJ3OqoCTOi4XjSr-0Qd8B7y_upuCaQcWPwCI'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPetTourPlaces(data?.data || []);
      
      if (data?.data?.length > 0) {
        toast.success('반려동물 여행지 정보를 성공적으로 불러왔습니다!');
      }
    } catch (error) {
      console.error('반려동물 여행지 API 호출 실패:', error);
      setPetError('반려동물 여행지 정보를 불러오는데 실패했습니다. 다시 시도해주세요.');
      setPetTourPlaces([]);
      toast.error('반려동물 여행지 정보를 불러오는데 실패했습니다.');
    } finally {
      setPetLoading(false);
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
        <div className="flex gap-2">{/* 제목 제거 */}
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
      ) : error || petError ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{activeTab === "general" ? error : petError}</p>
          <Button 
            onClick={() => activeTab === "general" ? fetchTourPlaces() : fetchPetTourPlaces()}
            variant="outline"
            size="sm"
          >
            다시 시도
          </Button>
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
                <Card key={place.contentId || place.contentid || index} className="p-4 shadow-sm border-0 bg-white rounded-2xl">
                  <div className="flex gap-4">
                    {(place.image || place.firstimage) && (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={place.image || place.firstimage} 
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
                      {(place.addr1 || place.addr) && (
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {formatAddress(place.addr1 || place.addr || '', place.addr2 || '')}
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