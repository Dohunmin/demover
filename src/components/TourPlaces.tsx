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
import { MapPin, Phone, Search, Heart, PawPrint, Map, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, TreePine, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import PlaceReviewModal from "./PlaceReviewModal";
import PlaceLocationModal from "./PlaceLocationModal";

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
  onShowMap?: (activeTab: "general" | "pet") => void;
  onPetDataLoaded?: (data: any[]) => void;
}

const TourPlaces: React.FC<TourPlacesProps> = ({ onShowMap, onPetDataLoaded }) => {
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
  const [parkFilter, setParkFilter] = useState(false); // 공원 필터 상태
  
  // 공원 키워드 목록
  const parkKeywords = [
    '부산시민공원',
    '센텀 APEC나루공원',
    '신호공원',
    '온천천시민공원',
    '대저생태공원',
    '대저수문 생태공원',
    '맥도생태공원',
    '민락수변공원',
    '부산 암남공원',
    '부산북항 친수공원',
    '부산어린이대공원',
    '삼락생태공원',
    '스포원파크',
    '아미르공원',
    '용소웰빙공원',
    '을숙도 공원',
    '회동수원지'
  ];
  const [activeTab, setActiveTab] = useState<"general" | "pet">("pet");
  const [userAreaCode, setUserAreaCode] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<TourPlace | null>(null);
  const [bookmarkedPlaces, setBookmarkedPlaces] = useState<Set<string>>(new Set());
  const [selectedPlaceForReview, setSelectedPlaceForReview] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedPlaceForLocation, setSelectedPlaceForLocation] = useState<any>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [placeReviews, setPlaceReviews] = useState<Record<string, {averageRating: number, totalReviews: number}>>({});
  
  // 반려동물 키워드 검색 결과 캐시
  const [allPetPlacesCache, setAllPetPlacesCache] = useState<any[]>([]);
  const [petCacheLoaded, setPetCacheLoaded] = useState(false);
  const [petDataLoading, setPetDataLoading] = useState(false);

  // 장소별 리뷰 통계 로드
  const loadPlaceReviews = async (places: any[]) => {
    if (!places || places.length === 0) return;
    
    const contentIds = places.map(place => place.contentid || place.contentId).filter(Boolean);
    if (contentIds.length === 0) return;

    try {
      // 각 장소별로 리뷰 통계 조회
      const reviewPromises = contentIds.map(async (contentId) => {
        const { data, error } = await supabase
          .from('place_reviews')
          .select('rating')
          .eq('content_id', contentId);

        if (error) {
          console.error(`장소 ${contentId} 리뷰 로드 오류:`, error);
          return { contentId, stats: null };
        }

        if (data && data.length > 0) {
          const totalReviews = data.length;
          const averageRating = data.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
          return {
            contentId,
            stats: {
              averageRating: Math.round(averageRating * 10) / 10, // 소수점 1자리
              totalReviews
            }
          };
        }

        return { contentId, stats: null };
      });

      const reviewResults = await Promise.all(reviewPromises);
      
      // 리뷰 통계 상태 업데이트
      const newPlaceReviews: Record<string, {averageRating: number, totalReviews: number}> = {};
      reviewResults.forEach(({ contentId, stats }) => {
        if (stats) {
          newPlaceReviews[contentId] = stats;
        }
      });

      setPlaceReviews(prev => ({
        ...prev,
        ...newPlaceReviews
      }));

    } catch (error) {
      console.error('리뷰 통계 로드 실패:', error);
    }
  };

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

  // 공원 필터 이벤트 리스너
  useEffect(() => {
    const handleParkFilter = () => {
      setParkFilter(!parkFilter);
      
      if (activeTab === "general") {
        setGeneralCurrentPage(1);
      } else {
        setPetCurrentPage(1);
      }
    };

    window.addEventListener('parkFilterToggle', handleParkFilter);
    
    return () => {
      window.removeEventListener('parkFilterToggle', handleParkFilter);
    };
  }, [parkFilter, activeTab]);

  useEffect(() => {
    if (userAreaCode) {
      console.log(`🔍 useEffect 실행: activeTab=${activeTab}, userAreaCode=${userAreaCode}`);
      
      if (activeTab === "general") {
        console.log("➡️ 일반 관광지 탭: fetchTourPlaces 호출");
        fetchTourPlaces();
      } else if (activeTab === "pet") {
        console.log("➡️ 반려동물 탭: 캐시 상태 확인");
        // 반려동물 탭: 캐시가 없으면 초기 로딩
        if (!petCacheLoaded) {
          console.log("➡️ 캐시 없음: loadAllPetPlaces 호출");
          loadAllPetPlaces();
        } else {
          console.log("➡️ 캐시 있음: processCachedPetPlaces 호출");
          // 캐시가 있으면 클라이언트 사이드 처리
          processCachedPetPlaces();
        }
      }
    }
  }, [generalCurrentPage, petCurrentPage, userAreaCode, activeTab, parkFilter]);

  // 반려동물 여행지 데이터 로딩 - API 호출 방식
  const loadAllPetPlaces = async () => {
    // 이미 로딩 중이거나 로딩 완료된 경우 중복 실행 방지
    if (petDataLoading || petCacheLoaded) {
      console.log('반려동물 데이터 로딩 중이거나 이미 완료됨, 건너뜀');
      return;
    }

    // localStorage에서 캐시 확인 (24시간 TTL) - 캐시 초기화
    const cacheKey = 'pet_places_cache_v3'; // 캐시 초기화
    const cacheTimeKey = 'pet_places_cache_time_v3'; // 캐시 초기화
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

    try {
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheTimeKey);
      
      if (cachedData && cacheTime) {
        const isExpired = Date.now() - parseInt(cacheTime) > CACHE_TTL;
        
        if (!isExpired) {
          console.log('🎯 localStorage에서 반려동물 여행지 캐시 로드');
          const parsedData = JSON.parse(cachedData);
          
          setAllPetPlacesCache(parsedData);
          setPetCacheLoaded(true);
          
          // 부모 컴포넌트에 데이터 전달
          if (onPetDataLoaded) {
            onPetDataLoaded(parsedData);
          }
          
          // 리뷰 통계 로드
          await loadPlaceReviews(parsedData);
          
          // 검색 키워드가 있으면 검색 결과를, 없으면 첫 페이지를 표시
          processCachedPetPlaces(parsedData, petSearchKeyword, 1);
          
          return;
        } else {
          console.log('🕒 localStorage 캐시 만료, 새로 로드');
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(cacheTimeKey);
        }
      }
    } catch (error) {
      console.error('localStorage 캐시 읽기 실패:', error);
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(cacheTimeKey);
    }
    
    setPetDataLoading(true);
    
    try {
      console.log('=== 반려동물 여행지 API 로딩 시작 ===');
      
      const { data, error } = await supabase.functions.invoke('combined-tour-api', {
        body: {
          areaCode: userAreaCode,
          numOfRows: '200',
          pageNo: '1',
          keyword: '',
          activeTab: 'pet',
          loadAllPetKeywords: true
        }
      });

      if (error) {
        console.error('반려동물 여행지 API 오류:', error);
        toast.error('반려동물 여행지를 불러오는데 실패했습니다.');
        return;
      }

      console.log('API 응답 데이터:', data);

      let allPetData = [];

      // API에서 받은 데이터 처리
      if (data?.petTourismData?.response?.body?.items?.item) {
        const items = data.petTourismData.response.body.items.item;
        const processedItems = Array.isArray(items) ? items : [items];
        allPetData.push(...processedItems);
      }

      // 추가 샘플 데이터 (52개)
      if (data?.additionalPetPlaces && Array.isArray(data.additionalPetPlaces)) {
        allPetData.push(...data.additionalPetPlaces);
      }

      console.log(`총 ${allPetData.length}개의 반려동물 여행지 로딩 완료`);
      
      // localStorage에 캐시 저장
      try {
        localStorage.setItem(cacheKey, JSON.stringify(allPetData));
        localStorage.setItem(cacheTimeKey, Date.now().toString());
        console.log('💾 localStorage에 반려동물 여행지 캐시 저장');
      } catch (error) {
        console.error('localStorage 캐시 저장 실패:', error);
      }
      
      setAllPetPlacesCache(allPetData);
      setPetCacheLoaded(true);
      
      // 부모 컴포넌트에 데이터 전달
      if (onPetDataLoaded) {
        onPetDataLoaded(allPetData);
      }
      
      // 리뷰 통계 로드
      await loadPlaceReviews(allPetData);
      
      // 검색 키워드가 있으면 검색 결과를, 없으면 첫 페이지를 표시
      processCachedPetPlaces(allPetData, petSearchKeyword, 1);
      
      toast.success('반려동물 여행지를 불러왔습니다!');
      
    } catch (error) {
      console.error('반려동물 여행지 로딩 실패:', error);
      toast.error('반려동물 여행지 로딩에 실패했습니다.');
      
      // 오류 발생 시 빈 캐시로 설정하여 무한 로딩 방지
      setAllPetPlacesCache([]);
      setPetCacheLoaded(true);
      setPetTourPlaces([]);
      setPetTotalCount(0);
    } finally {
      setPetDataLoading(false);
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
      page: pageToUse,
      parkFilter: parkFilter
    });
    
    // 검색 필터링
    let filteredData = dataToUse;
    if (keywordToUse && keywordToUse.trim()) {
      filteredData = dataToUse.filter((place: any) => 
        place.title?.toLowerCase().includes(keywordToUse.toLowerCase()) ||
        place.addr1?.toLowerCase().includes(keywordToUse.toLowerCase())
      );
    }
    
    // 공원 필터링 (반려동물 탭에서)
    if (parkFilter) {
      filteredData = filteredData.filter((place: any) => 
        parkKeywords.some(parkKeyword => 
          place.title?.trim() === parkKeyword.trim()
        )
      );
    }
    
    // 페이지네이션
    const itemsPerPage = 10;
    const startIndex = (pageToUse - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    console.log(`필터링 후 ${filteredData.length}개, 페이지네이션 후 ${paginatedData.length}개`);
    
    console.log('=== 상태 업데이트 전 ===', { 
      currentPetTourPlaces: petTourPlaces.length, 
      newPaginatedData: paginatedData.length 
    });
    
    // 검색 결과를 상태에 설정
    setPetTourPlaces(paginatedData);
    setPetTotalCount(filteredData.length);
    
    console.log('=== 상태 업데이트 완료 ===', { 
      setPetTourPlacesData: paginatedData.length,
      setPetTotalCountData: filteredData.length
    });
    
    // 검색 결과 로그 출력
    paginatedData.forEach((place, index) => {
      console.log(`반려동물 장소 ${index}:`, place);
    });
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
          let processedData = Array.isArray(items) ? items : items ? [items] : [];
          
          // 공원 필터링 (일반 탭에서)
          if (parkFilter) {
            processedData = processedData.filter((item: any) => 
              parkKeywords.some(parkKeyword => 
                item.title?.trim() === parkKeyword.trim()
              )
            );
          }
          
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
          
          // 리뷰 통계 로드
          await loadPlaceReviews(processedData);
          
          const totalAfterFilter = parkFilter ? processedData.length : (data.tourismData.response.body.totalCount || 0);
          setTotalCount(totalAfterFilter);
          toast.success("일반 관광지를 불러왔습니다!");
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
      // 오류 발생 시 빈 데이터로 설정
      if (activeTab === "general") {
        setTourPlaces([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    console.log('=== handleSearch 호출됨 ===', { 
      activeTab, 
      petSearchKeyword, 
      generalSearchKeyword, 
      petCacheLoaded, 
      allPetPlacesCache: allPetPlacesCache.length 
    });
    
    if (activeTab === "general") {
      setGeneralCurrentPage(1);
      fetchTourPlaces(generalSearchKeyword, "");
    } else {
      // 반려동물 탭에서는 캐시된 데이터에서 검색
      setLoading(true);
      setPetCurrentPage(1);
      
      try {
        console.log('반려동물 탭 검색 시작:', petSearchKeyword);
        
        if (petCacheLoaded && allPetPlacesCache.length > 0) {
          // 캐시가 있으면 바로 검색
          console.log('캐시된 데이터로 검색 실행');
          processCachedPetPlaces(allPetPlacesCache, petSearchKeyword, 1);
        } else {
          // 캐시가 없으면 데이터를 로드 (loadAllPetPlaces 내부에서 검색도 처리됨)
          console.log('캐시가 없어서 데이터 로딩 시작');
          toast.info('반려동물 여행지 데이터를 로딩 중입니다...');
          await loadAllPetPlaces();
        }
      } catch (error) {
        console.error('검색 실패:', error);
        toast.error('검색에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    console.log('=== handleKeyPress 호출됨 ===', e.key);
    if (e.key === 'Enter') {
      console.log('엔터키 눌림 - handleSearch 호출');
      handleSearch();
    }
  };

  // 탭 전환 시 로딩 상태 리셋 및 탭 변경
  const handleTabChange = (tab: "general" | "pet") => {
    // 이전 탭의 로딩 상태 리셋
    if (activeTab === "pet" && tab === "general") {
      setPetDataLoading(false);
    } else if (activeTab === "general" && tab === "pet") {
      setLoading(false);
    }
    
    setActiveTab(tab);
    // useEffect가 activeTab 변경을 감지해서 자동으로 데이터 로딩
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
    const reviewStats = placeReviews[contentId];
    
    const handlePlaceClick = (e: React.MouseEvent) => {
      // 버튼 클릭 시 모달이 열리지 않도록 방지
      if ((e.target as HTMLElement).closest('button')) {
        return;
      }
      
      console.log('🖱️ 장소 카드 클릭됨:', place);
      console.log('📍 좌표 데이터 확인:', { mapx: place.mapx, mapy: place.mapy });
      
      // 지도 모달 열기
      const locationData = {
        contentid: contentId,
        contentId: contentId,
        title: place.title,
        addr1: place.addr1,
        addr2: place.addr2,
        tel: place.tel,
        mapx: place.mapx,
        mapy: place.mapy
      };
      
      console.log('🗺️ 지도 모달에 전달할 데이터:', locationData);
      
      setSelectedPlaceForLocation(locationData);
      setIsLocationModalOpen(true);
    };

    const handleReviewUpdate = (stats: {averageRating: number, totalReviews: number}) => {
      setPlaceReviews(prev => ({
        ...prev,
        [contentId]: stats
      }));
    };

    return (
      <Card 
        key={contentId || index} 
        className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer bg-white border border-gray-100"
        onClick={handlePlaceClick}
      >
        <div className="flex">
          {/* 이미지 영역 */}
          <div className="w-24 h-24 flex-shrink-0 bg-gray-100 relative">
            {(place.firstimage || place.image) ? (
              <img 
                src={place.firstimage || place.image} 
                alt={place.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full bg-gradient-to-br from-blue-400 via-blue-300 to-yellow-300 flex items-center justify-center p-2 ${(place.firstimage || place.image) ? 'hidden' : ''}`}>
              <img 
                src="/lovable-uploads/ac67abbc-77f6-49be-9553-8f14fcad6271.png" 
                alt="로고"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          
          {/* 콘텐츠 영역 */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">
                  {place.title}
                </h4>
                
                {/* 평점 정보 - 여행지명 바로 아래 */}
                {reviewStats && reviewStats.totalReviews > 0 ? (
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= reviewStats.averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      {reviewStats.averageRating}점 ({reviewStats.totalReviews}개)
                    </span>
                  </div>
                ) : (
                  /* 평점이 없으면 주소를 바로 아래 표시 */
                  place.addr1 && (
                    <div className="flex items-start gap-1 mt-1.5">
                      <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {place.addr1} {place.addr2}
                      </p>
                    </div>
                  )
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={`bookmark-button flex-shrink-0 p-1 -mt-2 ${isBookmarked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(place, activeTab);
                }}
              >
                <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* 평점이 있을 때만 주소를 따로 표시 */}
            {reviewStats && reviewStats.totalReviews > 0 && place.addr1 && (
              <div className="flex items-start gap-1 mt-1.5">
                <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {place.addr1} {place.addr2}
                </p>
              </div>
            )}
            
            {/* 전화번호 */}
            {place.tel && (
              <div className="flex items-center gap-1 mb-3">
                <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-600 truncate">
                  {place.tel}
                </p>
              </div>
            )}
            
            {/* 하단 영역 */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {activeTab === "pet" ? "반려동물 동반" : "일반 관광지"}
              </Badge>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-3 py-1 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlaceForReview({
                      contentid: contentId,
                      title: place.title
                    });
                    setIsReviewModalOpen(true);
                  }}
                >
                  <Star className="w-3 h-3 mr-1" />
                  평점
                </Button>
              </div>
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
                onClick={() => onShowMap(activeTab)}
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

      {/* 공원 필터 및 탭 영역 */}
      <div className="px-5 space-y-3">
        {/* 공원 필터 버튼 */}
        {parkFilter && (
          <div className="flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-200">
            <div className="flex items-center gap-2">
              <TreePine className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">공원만 보기</span>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                {parkKeywords.length}개 공원
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setParkFilter(false)}
              className="text-green-700 hover:text-green-800 hover:bg-green-100 text-xs"
            >
              전체 보기
            </Button>
          </div>
        )}
        
        {/* 탭 영역 */}
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
        {loading || petDataLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
            <p className="text-gray-600 mt-2">
              {petDataLoading ? '반려동물 여행지 로딩중...' : '로딩 중...'}
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

      {/* 평점/후기 모달 */}
      {selectedPlaceForReview && (
        <PlaceReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedPlaceForReview(null);
          }}
          onReviewUpdate={(stats) => {
            setPlaceReviews(prev => ({
              ...prev,
              [selectedPlaceForReview.contentid]: stats
            }));
          }}
          place={{
            contentid: selectedPlaceForReview.contentid,
            title: selectedPlaceForReview.title
          }}
        />
      )}

      {/* 지도 위치 모달 */}
      <PlaceLocationModal
        place={selectedPlaceForLocation}
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          setSelectedPlaceForLocation(null);
        }}
      />
    </div>
  );
};

export default TourPlaces;