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
import { MapPin, Phone, Search, Heart, PawPrint, Map, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [generalSearchKeyword, setGeneralSearchKeyword] = useState("");
  const [petSearchKeyword, setPetSearchKeyword] = useState("");
  const [generalCurrentPage, setGeneralCurrentPage] = useState(1);
  const [petCurrentPage, setPetCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"general" | "pet">("pet");
  const [userAreaCode, setUserAreaCode] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<TourPlace | null>(null);
  const [bookmarkedPlaces, setBookmarkedPlaces] = useState<Set<string>>(new Set());
  
  // 반려동물 키워드 검색 결과 캐시
  const [allPetPlacesCache, setAllPetPlacesCache] = useState<any[]>([]);
  const [petCacheLoaded, setPetCacheLoaded] = useState(false);
  const [initialPetLoading, setInitialPetLoading] = useState(false);

  // 사용자 프로필에서 지역 코드 가져오기 및 즐겨찾기 로드
  useEffect(() => {
    const getUserDataAndBookmarks = async () => {
      if (user) {
        // 사용자 프로필에서 지역 코드 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('area_code')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile?.area_code) {
          setUserAreaCode(profile.area_code);
        }

        // 사용자의 즐겨찾기 목록 로드
        await loadUserBookmarks();
      }
    };
    
    getUserDataAndBookmarks();
  }, [user]);

  useEffect(() => {
    if (userAreaCode) {
      if (activeTab === "general") {
        fetchTourPlaces();
      } else {
        // 반려동물 탭: 캐시가 없으면 초기 로딩
        if (!petCacheLoaded) {
          loadInitialPetPlaces();
        } else {
          // 캐시가 있으면 클라이언트 사이드 처리
          processCachedPetPlaces();
        }
      }
    }
  }, [generalCurrentPage, petCurrentPage, userAreaCode, activeTab]);

  // 빠른 초기 로딩과 전체 데이터 로딩을 분리
  const loadInitialPetPlaces = async () => {
    setInitialPetLoading(true);
    
    try {
      console.log('=== 반려동물 여행지 빠른 초기 로딩 시작 ===');
      
      // 첫 번째: 빠른 기본 로딩 (일반 API 호출)
      const { data, error } = await supabase.functions.invoke('combined-tour-api', {
        body: {
          areaCode: userAreaCode,
          numOfRows: '20', // 빠른 초기 로딩을 위해 20개만
          pageNo: '1',
          keyword: '',
          activeTab: 'pet',
          loadAllPetKeywords: false // 빠른 로딩 모드
        }
      });

      if (error) {
        console.error('빠른 로딩 오류:', error);
        toast.error('반려동물 여행지 로딩에 실패했습니다.');
        return;
      }

      if (data.petTourismData && !data.petTourismData.error && 
          data.petTourismData.response?.header?.resultCode === "0000" &&
          data.petTourismData.response?.body?.items?.item) {
        const items = data.petTourismData.response.body.items.item;
        const processedData = Array.isArray(items) ? items : [items];
        
        console.log(`빠른 로딩: ${processedData.length}개의 반려동물 여행지 로딩 완료`);
        
        // 빠른 결과를 먼저 표시
        setPetTourPlaces(processedData);
        setPetTotalCount(data.petTourismData.response.body.totalCount || processedData.length);
        
        toast.success(`${processedData.length}개의 반려동물 여행지를 불러왔습니다!`);
        
        // 백그라운드에서 전체 데이터 로딩 시작
        setTimeout(() => loadAllPetPlaces(processedData), 100);
        
      } else {
        console.warn('빠른 로딩 결과 없음:', data.petTourismData?.error || 'No data');
        setPetTourPlaces([]);
        setPetTotalCount(0);
        toast.warning("반려동물 동반 여행지를 찾을 수 없습니다.");
      }
      
    } catch (error) {
      console.error('빠른 로딩 실패:', error);
      toast.error('반려동물 여행지 로딩에 실패했습니다.');
    } finally {
      setInitialPetLoading(false);
    }
  };

  // 백그라운드에서 전체 데이터 로딩
  const loadAllPetPlaces = async (initialData?: any[]) => {
    try {
      console.log('=== 백그라운드 전체 데이터 로딩 시작 ===');
      
      const { data, error } = await supabase.functions.invoke('combined-tour-api', {
        body: {
          areaCode: userAreaCode,
          numOfRows: '10', // 사용되지 않음
          pageNo: '1', // 사용되지 않음
          keyword: '',
          activeTab: 'pet',
          loadAllPetKeywords: true // 95개 키워드 로딩 모드
        }
      });

      if (error) {
        console.error('전체 데이터 로딩 오류:', error);
        return;
      }

      if (data.petTourismData && !data.petTourismData.error && 
          data.petTourismData.response?.header?.resultCode === "0000" &&
          data.petTourismData.response?.body?.items?.item) {
        const items = data.petTourismData.response.body.items.item;
        const processedData = Array.isArray(items) ? items : [items];
        
        console.log(`전체 데이터 로딩: ${processedData.length}개의 반려동물 여행지 완료`);
        
        setAllPetPlacesCache(processedData);
        setPetCacheLoaded(true);
        
        // 초기 데이터와 전체 데이터가 다르면 업데이트
        if (!initialData || initialData.length < processedData.length) {
          processCachedPetPlaces(processedData, petSearchKeyword, 1);
          toast.success(`총 ${processedData.length}개의 반려동물 여행지를 불러왔습니다!`, {
            duration: 2000
          });
        }
      } else {
        console.warn('전체 데이터 로딩 결과 없음');
        // 캐시를 초기 데이터로 설정
        if (initialData) {
          setAllPetPlacesCache(initialData);
          setPetCacheLoaded(true);
        }
      }
      
    } catch (error) {
      console.error('전체 데이터 로딩 실패:', error);
      // 에러 발생 시 초기 데이터로라도 캐시 설정
      if (initialData) {
        setAllPetPlacesCache(initialData);
        setPetCacheLoaded(true);
      }
    }
  };

  // 캐시된 데이터로 클라이언트 사이드 페이지네이션 및 검색
  const processCachedPetPlaces = (cachedData?: any[], searchKeyword?: string, page?: number) => {
    const dataToUse = cachedData || allPetPlacesCache;
    const keywordToUse = searchKeyword !== undefined ? searchKeyword : petSearchKeyword;
    const pageToUse = page !== undefined ? page : petCurrentPage;
    
    console.log('=== 캐시된 데이터 처리 ===', { 
      totalCached: dataToUse.length, 
      searchKeyword: keywordToUse, 
      page: pageToUse 
    });
    
    // 검색 필터링
    let filteredData = dataToUse;
    if (keywordToUse && keywordToUse.trim()) {
      filteredData = dataToUse.filter((place: any) => 
        place.title?.toLowerCase().includes(keywordToUse.toLowerCase()) ||
        place.addr1?.toLowerCase().includes(keywordToUse.toLowerCase())
      );
    }
    
    // 페이지네이션
    const itemsPerPage = 10;
    const startIndex = (pageToUse - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    console.log(`필터링 후 ${filteredData.length}개, 페이지네이션 후 ${paginatedData.length}개`);
    
    setPetTourPlaces(paginatedData);
    setPetTotalCount(filteredData.length);
  };

  const fetchTourPlaces = async (generalKeyword?: string, petKeyword?: string) => {
    setLoading(true);
    
    const currentPage = activeTab === "general" ? generalCurrentPage : petCurrentPage;
    
    try {
      console.log('Combined Tour API 호출 시작:', { generalKeyword, petKeyword, currentPage, activeTab });
      
      if (activeTab === "general") {
        // 일반 관광지 탭인 경우 기존 로직 그대로
        const { data, error } = await supabase.functions.invoke('combined-tour-api', {
          body: {
            areaCode: userAreaCode,
            numOfRows: '10',
            pageNo: currentPage.toString(),
            keyword: generalKeyword || '',
            activeTab: 'general'
          }
        });

        if (error) {
          console.error('Combined Tour API 오류:', error);
          toast.error('여행지 정보를 불러오는데 실패했습니다.');
          return;
        }

        // 일반 관광지 데이터 처리
        if (data.tourismData && !data.tourismData.error && 
            data.tourismData.response?.header?.resultCode === "0000" &&
            data.tourismData.response?.body?.items?.item) {
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
          toast.success("여행지 정보를 성공적으로 불러왔습니다!");
        } else {
          console.warn('일반 관광지 데이터 없음:', data.tourismData?.error || 'No data or API error');
          setTourPlaces([]);
          setTotalCount(0);
        }
        
      } else {
        // 반려동물 탭에서 일반 검색 (캐시 사용)
        if (petCacheLoaded) {
          processCachedPetPlaces(undefined, petKeyword, 1);
        } else {
          toast.info('반려동물 여행지 데이터를 로딩 중입니다...');
        }
      }

    } catch (error) {
      console.error('여행지 정보 조회 실패:', error);
      toast.error('여행지 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (activeTab === "general") {
      setGeneralCurrentPage(1);
      fetchTourPlaces(generalSearchKeyword, "");
    } else {
      // 반려동물 탭에서는 캐시된 데이터에서 검색
      setPetCurrentPage(1);
      if (petCacheLoaded) {
        processCachedPetPlaces(undefined, petSearchKeyword, 1);
      } else {
        toast.info('반려동물 여행지 데이터를 로딩 중입니다...');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 탭 전환 시 탭만 변경 (useEffect가 자동으로 데이터 로딩)
  const handleTabChange = (tab: "general" | "pet") => {
    setActiveTab(tab);
    // useEffect가 activeTab 변경을 감지해서 자동으로 fetchTourPlaces 호출
  };

  // 페이지네이션 관련 계산
  const currentTotalCount = activeTab === "general" ? totalCount : petTotalCount;
  const currentPage = activeTab === "general" ? generalCurrentPage : petCurrentPage;
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

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (activeTab === "general") {
      setGeneralCurrentPage(newPage);
    } else {
      setPetCurrentPage(newPage);
      if (petCacheLoaded) {
        processCachedPetPlaces(undefined, undefined, newPage);
      }
    }
  };

  // 사용자 즐겨찾기 목록 로드
  const loadUserBookmarks = async () => {
    if (!user) return;

    try {
      const { data: bookmarks, error } = await supabase
        .from('travel_bookmarks')
        .select('content_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('즐겨찾기 로드 오류:', error);
        return;
      }

      const bookmarkSet = new Set(bookmarks?.map(b => b.content_id) || []);
      setBookmarkedPlaces(bookmarkSet);
    } catch (error) {
      console.error('즐겨찾기 로드 실패:', error);
    }
  };

  // 즐겨찾기 추가/제거
  const toggleBookmark = async (place: any, bookmarkType: 'general' | 'pet') => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    const contentId = place.contentid || place.contentId;
    const isBookmarked = bookmarkedPlaces.has(contentId);

    try {
      if (isBookmarked) {
        // 즐겨찾기 제거
        const { error } = await supabase
          .from('travel_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId);

        if (error) throw error;

        const newBookmarks = new Set(bookmarkedPlaces);
        newBookmarks.delete(contentId);
        setBookmarkedPlaces(newBookmarks);
        toast.success('즐겨찾기에서 제거되었습니다.');
      } else {
        // 즐겨찾기 추가
        const bookmarkData = {
          user_id: user.id,
          content_id: contentId,
          title: place.title,
          addr1: place.addr1 || '',
          addr2: place.addr2 || '',
          image_url: place.firstimage || place.image || '',
          tel: place.tel || '',
          mapx: place.mapx || '',
          mapy: place.mapy || '',
          areacode: place.areacode || '',
          sigungucode: place.sigungucode || '',
          content_type_id: place.contenttypeid || place.contentTypeId || '',
          bookmark_type: bookmarkType
        };

        const { error } = await supabase
          .from('travel_bookmarks')
          .insert(bookmarkData);

        if (error) throw error;

        const newBookmarks = new Set(bookmarkedPlaces);
        newBookmarks.add(contentId);
        setBookmarkedPlaces(newBookmarks);
        toast.success('즐겨찾기에 추가되었습니다.');
      }
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error);
      toast.error(isBookmarked ? '즐겨찾기 제거에 실패했습니다.' : '즐겨찾기 추가에 실패했습니다.');
    }
  };

  const renderTourPlace = (place: any, index: number) => {
    const contentId = place.contentid || place.contentId;
    const isBookmarked = bookmarkedPlaces.has(contentId);
    
    const handlePlaceClick = (e: React.MouseEvent) => {
      // 즐겨찾기 버튼 클릭 시 모달이 열리지 않도록 방지
      if ((e.target as HTMLElement).closest('.bookmark-button')) {
        return;
      }
      
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
              <Button
                variant="ghost"
                size="sm"
                className={`bookmark-button p-2 ${isBookmarked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(place, activeTab);
                }}
              >
                <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
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
                value={activeTab === "general" ? generalSearchKeyword : petSearchKeyword}
                onChange={(e) => activeTab === "general" ? setGeneralSearchKeyword(e.target.value) : setPetSearchKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 border-gray-200 focus:border-primary"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={loading}
              className="button-primary px-6"
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
            onClick={() => handleTabChange("general")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === "general"
                ? "tab-item active"
                : "tab-item"
            }`}
          >
            <MapPin className="w-4 h-4 mr-2 inline" />
            일반 관광지
            {generalSearchKeyword && <span className="ml-1 text-xs" style={{ color: 'var(--primary-color)' }}>●</span>}
          </button>
          <button
            onClick={() => handleTabChange("pet")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === "pet"
                ? "tab-item active"
                : "tab-item"
            }`}
          >
            <PawPrint className="w-4 h-4 mr-2 inline" />
            반려동물 동반
            {petSearchKeyword && <span className="ml-1 text-xs" style={{ color: 'var(--primary-color)' }}>●</span>}
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="px-5">
        {loading || initialPetLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
            <p className="text-gray-600 mt-2">
              {initialPetLoading ? '95개 키워드로 반려동물 여행지 로딩 중...' : '로딩 중...'}
            </p>
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
                    <div className="text-xs text-gray-400 mt-1">디버그: {petTourPlaces.length}개 렌더링</div>
                  </div>
                  {petTourPlaces.map((place, index) => {
                    console.log(`반려동물 장소 ${index}:`, place);
                    return renderTourPlace(place, index);
                  })}
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
          <div className="flex justify-center items-center gap-1">
            {/* 첫 페이지로 이동 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="w-8 h-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            
            {/* 이전 페이지 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* 페이지 번호들 */}
            {getPageNumbers().map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            ))}

            {/* 생략 표시 (마지막 페이지가 표시되지 않을 때) */}
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
              <span className="px-2 text-gray-400">...</span>
            )}

            {/* 다음 페이지 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* 마지막 페이지로 이동 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
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