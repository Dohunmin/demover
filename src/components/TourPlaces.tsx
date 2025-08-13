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
    
    try {
      console.log('Edge Function 호출 시작:', { keyword, currentPage });
      
      // 1차: Edge Function 시도
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('korea-tour-api', {
        body: {
          op: keyword ? 'searchKeyword1' : 'areaBasedList1',
          pageNo: currentPage,
          numOfRows: 50,
          keyword: keyword || null
        }
      });

      if (edgeError) {
        console.warn('Edge Function 실패:', edgeError);
        throw new Error(`Edge Function 오류: ${edgeError.message}`);
      }

      if (edgeData && !edgeData.ok === false) {
        console.log('Edge Function 성공:', edgeData);
        
        // Edge Function에서 받은 데이터가 문자열일 수 있으므로 파싱
        let apiData = edgeData;
        if (typeof edgeData === 'string') {
          try {
            apiData = JSON.parse(edgeData);
          } catch (parseError) {
            console.error('JSON 파싱 실패:', parseError);
            throw new Error('API 응답 파싱 실패');
          }
        }
        
        const items = apiData?.response?.body?.items?.item || [];
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
        
        setTotalCount(apiData?.response?.body?.totalCount || 0);
        toast.success("관광지 정보를 성공적으로 불러왔습니다 (Edge Function)");
        return;
      }

      throw new Error('Edge Function 응답이 비어있음');
      
    } catch (edgeError) {
      console.warn('Edge Function 완전 실패, DB RPC 시도:', edgeError);
      
      try {
        // 2차: DB RPC 백업 시도
        const { data: rpcData, error: rpcError } = await supabase.rpc('tour_area_list', {
          page_no: currentPage,
          rows: 50,
          keyword: keyword || null
        });

        if (rpcError) {
          console.error('DB RPC도 실패:', rpcError);
          throw rpcError;
        }

        console.log('DB RPC 성공:', rpcData);
        
        const apiData = rpcData as any;
        
        if (apiData?.error) {
          throw new Error(apiData.error);
        }
        
        const items = apiData?.response?.body?.items?.item || [];
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
        
        setTotalCount(apiData?.response?.body?.totalCount || 0);
        toast.success("관광지 정보를 성공적으로 불러왔습니다 (DB RPC)");
        
      } catch (rpcError) {
        console.error('모든 시도 실패:', rpcError);
        toast.error("관광지 정보를 불러오는데 실패했습니다");
        setTourPlaces([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPetTourPlaces = async () => {
    setPetLoading(true);
    
    try {
      console.log('Pet Edge Function 호출 시작');
      
      // 1차: Edge Function 시도
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('pet-tour-api', {
        body: {
          op: 'areaBasedList1',
          pageNo: 1,
          numOfRows: 100
        }
      });

      if (edgeError) {
        console.warn('Pet Edge Function 실패:', edgeError);
        throw new Error(`Pet Edge Function 오류: ${edgeError.message}`);
      }

      if (edgeData && !edgeData.ok === false) {
        console.log('Pet Edge Function 성공:', edgeData);
        
        let apiData = edgeData;
        if (typeof edgeData === 'string') {
          try {
            apiData = JSON.parse(edgeData);
          } catch (parseError) {
            console.error('Pet JSON 파싱 실패:', parseError);
            throw new Error('Pet API 응답 파싱 실패');
          }
        }
        
        const items = apiData?.response?.body?.items?.item || [];
        const processedData = Array.isArray(items) ? items : items ? [items] : [];
        
        setPetTourPlaces(processedData.map((item: any) => ({
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
        
        toast.success("반려동물 여행지 정보를 성공적으로 불러왔습니다 (Edge Function)");
        return;
      }

      throw new Error('Pet Edge Function 응답이 비어있음');
      
    } catch (edgeError) {
      console.warn('Pet Edge Function 완전 실패, DB RPC 시도:', edgeError);
      
      try {
        // 2차: DB RPC 백업 시도
        const { data: rpcData, error: rpcError } = await supabase.rpc('tour_pet_list', {
          page_no: 1,
          rows: 100
        });

        if (rpcError) {
          console.error('Pet DB RPC도 실패:', rpcError);
          throw rpcError;
        }

        console.log('Pet DB RPC 성공:', rpcData);
        
        const apiData = rpcData as any;
        
        if (apiData?.error) {
          throw new Error(apiData.error);
        }
        
        const items = apiData?.response?.body?.items?.item || [];
        const processedData = Array.isArray(items) ? items : items ? [items] : [];
        
        setPetTourPlaces(processedData.map((item: any) => ({
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
        
        toast.success("반려동물 여행지 정보를 성공적으로 불러왔습니다 (DB RPC)");
        
      } catch (rpcError) {
        console.error('Pet 모든 시도 실패:', rpcError);
        toast.error("반려동물 여행지 정보를 불러오는데 실패했습니다");
        setPetTourPlaces([]);
      }
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

      {activeTab === "general" && totalCount > 50 && (
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
            {currentPage * 50 < totalCount && (
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