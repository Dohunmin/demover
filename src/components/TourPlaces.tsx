import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { MapPin, Phone, Search, Heart, PawPrint, Map, ChevronsLeft, ChevronsRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import TourDetailModal from "./TourDetailModal";

interface TourPlace {
  contentId: string;
  contentTypeId?: string;
  title: string;
  addr1: string;
  addr2: string;
  image: string;
  tel: string;
  mapx: string;
  mapy: string;
  areacode: string;
  sigungucode: string;
  firstImage?: string;
}

interface TourPlacesProps {
  onShowMap?: () => void;
}

const TourPlaces: React.FC<TourPlacesProps> = ({ onShowMap }) => {
  const { user } = useAuth();
  const [tourPlaces, setTourPlaces] = useState<TourPlace[]>([]);
  const [petTourPlaces, setPetTourPlaces] = useState<any[]>([]);
  const [petTotalCount, setPetTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"general" | "pet">("general");
  const [userAreaCode, setUserAreaCode] = useState<string>('1');
  const [selectedPlace, setSelectedPlace] = useState<TourPlace | null>(null);

  // 사용자 프로필에서 지역 코드 가져오기
  useEffect(() => {
    const getUserAreaCode = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('area_code')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile?.area_code) {
          setUserAreaCode(profile.area_code);
        }
      }
    };
    
    getUserAreaCode();
  }, [user]);

  useEffect(() => {
    if (userAreaCode) {
      fetchTourPlaces();
    }
  }, [currentPage, userAreaCode]);

  const fetchTourPlaces = async (keyword?: string) => {
    setLoading(true);
    
    try {
      console.log('Combined Tour API 호출 시작:', { keyword, currentPage });
      
      // 실제 API 호출
      const { data, error } = await supabase.functions.invoke('combined-tour-api', {
        body: {
          areaCode: userAreaCode,
          numOfRows: '10',
          pageNo: currentPage.toString(),
          keyword: keyword || ''
        }
      });

      if (error) {
        console.error('Combined Tour API 오류:', error);
        toast.error('여행지 정보를 불러오는데 실패했습니다.');
        return;
      }

      console.log('Combined Tour API 응답:', data);

      let hasData = false;

      // 일반 관광지 데이터 처리
      if (data.tourismData && !data.tourismData.error && data.tourismData.response?.body?.items?.item) {
        const items = data.tourismData.response.body.items.item;
        const processedData = Array.isArray(items) ? items : items ? [items] : [];
        
        setTourPlaces(processedData.map((item: any) => ({
          contentId: item.contentid,
          contentTypeId: item.contenttypeid,
          title: item.title,
          addr1: item.addr1 || '',
          addr2: item.addr2 || '',
          image: item.firstimage || item.firstimage2 || '',
          firstImage: item.firstimage || item.firstimage2 || '',
          tel: item.tel || '',
          mapx: item.mapx || '',
          mapy: item.mapy || '',
          areacode: item.areacode || '',
          sigungucode: item.sigungucode || ''
        })));
        
        setTotalCount(data.tourismData.response.body.totalCount || 0);
        hasData = true;
      } else {
        console.warn('일반 관광지 데이터 없음:', data.tourismData?.error || 'No data');
        setTourPlaces([]);
      }

      // 반려동물 동반 여행지 데이터 처리
      if (data.petTourismData && !data.petTourismData.error && data.petTourismData.response?.body?.items?.item) {
        const petItems = data.petTourismData.response.body.items.item;
        const processedPetData = Array.isArray(petItems) ? petItems : petItems ? [petItems] : [];
        setPetTourPlaces(processedPetData);
        setPetTotalCount(data.petTourismData.response.body.totalCount || 0);
        hasData = true;
      } else {
        console.warn('반려동물 여행지 데이터 없음:', data.petTourismData?.error || 'No data');
        setPetTourPlaces([]);
      }

      if (hasData) {
        toast.success("여행지 정보를 성공적으로 불러왔습니다!");
      } else {
        toast.warning("일부 데이터를 불러오는데 실패했지만 계속 진행합니다.");
      }

    } catch (error) {
      console.error('여행지 정보 조회 실패:', error);
      toast.error('여행지 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
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

  // 페이지네이션 관련 계산
  const currentTotalCount = activeTab === "general" ? totalCount : petTotalCount;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(currentTotalCount / itemsPerPage);
  
  // 페이지 번호 목록 생성 (최대 5개)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // 끝에서부터 계산하여 시작 페이지 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const renderTourPlace = (place: any, index: number) => {
    const handlePlaceClick = () => {
      const tourPlace: TourPlace = {
        contentId: place.contentid || place.contentId,
        contentTypeId: place.contenttypeid || place.contentTypeId,
        title: place.title,
        addr1: place.addr1 || '',
        addr2: place.addr2 || '',
        image: place.firstimage || place.image || '',
        firstImage: place.firstimage || place.image || '',
        tel: place.tel || '',
        mapx: place.mapx || '',
        mapy: place.mapy || '',
        areacode: place.areacode || '',
        sigungucode: place.sigungucode || ''
      };
      setSelectedPlace(tourPlace);
    };

    return (
      <Card 
        key={place.contentid || place.contentId || index} 
        className="p-4 shadow-sm border-0 bg-white rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
        onClick={handlePlaceClick}
      >
        <div className="flex gap-4">
          {(place.firstimage || place.image) && (
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={place.firstimage || place.image} 
                alt={place.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
              {place.title}
            </h4>
            {place.addr1 && (
              <div className="flex items-start gap-1 mb-2">
                <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 line-clamp-2">
                  {place.addr1} {place.addr2}
                </p>
              </div>
            )}
            {place.tel && (
              <div className="flex items-center gap-1 mb-2">
                <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  {place.tel}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {activeTab === "pet" ? "반려동물 동반" : "일반 관광지"}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* 검색 영역 */}
      <div className="px-5">
        <Card className="p-4 bg-white border-0 shadow-lg rounded-2xl">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="여행지를 검색하세요..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 border-gray-200 focus:border-green-500"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
            {onShowMap && (
              <Button 
                onClick={onShowMap}
                variant="outline"
                className="px-6"
              >
                <Map className="w-4 h-4 mr-2" />
                지도
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* 탭 영역 */}
      <div className="px-5">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === "general"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <MapPin className="w-4 h-4 mr-2 inline" />
            일반 관광지
          </button>
          <button
            onClick={() => setActiveTab("pet")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === "pet"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <PawPrint className="w-4 h-4 mr-2 inline" />
            반려동물 동반
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="px-5">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">로딩 중...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "general" ? (
              tourPlaces.length > 0 ? (
                <>
                  <div className="text-sm text-gray-600 mb-4">
                    총 {totalCount.toLocaleString()}개의 관광지
                  </div>
                  {tourPlaces.map((place, index) => renderTourPlace(place, index))}
                </>
              ) : (
                <Card className="p-8 text-center bg-white border-0 shadow-lg rounded-2xl">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    여행지 정보가 없습니다
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    다른 검색어로 시도해보세요
                  </p>
                </Card>
              )
            ) : (
              petTourPlaces.length > 0 ? (
                <>
                  <div className="text-sm text-gray-600 mb-4">
                    총 {petTotalCount.toLocaleString()}개의 반려동물 동반 여행지
                  </div>
                  {petTourPlaces.map((place, index) => renderTourPlace(place, index))}
                </>
              ) : (
                <Card className="p-8 text-center bg-white border-0 shadow-lg rounded-2xl">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <PawPrint className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    반려동물 동반 여행지가 없습니다
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    다른 지역을 선택해보세요
                  </p>
                </Card>
              )
            )}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        (activeTab === "general" && tourPlaces.length > 0) || 
        (activeTab === "pet" && petTourPlaces.length > 0)
      ) && (
        <div className="px-5">
          <Pagination>
            <PaginationContent>
              {/* 첫 페이지로 이동 */}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="sr-only">첫 페이지</span>
                </Button>
              </PaginationItem>
              
              {/* 이전 페이지 */}
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {/* 페이지 번호들 */}
              {getPageNumbers().map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={pageNum === currentPage}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {/* 생략 표시 (마지막 페이지가 표시되지 않을 때) */}
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* 다음 페이지 */}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {/* 마지막 페이지로 이동 */}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  <ChevronsRight className="h-4 w-4" />
                  <span className="sr-only">마지막 페이지</span>
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* 상세 정보 모달 */}
      {selectedPlace && (
        <TourDetailModal
          contentId={selectedPlace.contentId}
          contentTypeId={selectedPlace.contentTypeId}
          title={selectedPlace.title}
          isOpen={!!selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
};

export default TourPlaces;