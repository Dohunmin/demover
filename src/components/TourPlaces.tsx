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

  // 반려동물 동반 가능한 일반 관광지 키워드 목록
  const petFriendlyKeywords = [
    '롯데프리미엄아울렛 동부산점',
    '몽작',
    '부산시민공원',
    '센텀 APEC나루공원',
    '신호공원',
    '오르디',
    '온천천시민공원',
    '칠암만장',
    '카페 만디',
    '포레스트3002',
    '홍법사(부산)',
    '감나무집',
    '광안리해변 테마거리',
    '광안리해수욕장',
    '구덕포끝집고기',
    '구포시장',
    '국립부산과학관',
    '그림하우스',
    '금강사(부산)',
    '다대포 꿈의 낙조분수',
    '다대포해수욕장',
    '대보름',
    '대저생태공원',
    '대저수문 생태공원',
    '더웨이브',
    '더펫텔프리미엄스위트',
    '덕미',
    '듀스포레',
    '드림서프라운지',
    '만달리',
    '맥도생태공원',
    '모닝듀 게스트 하우스(모닝듀)',
    '무명일기',
    '문탠로드',
    '민락수변공원',
    '밀락더마켓',
    '부산 감천문화마을',
    '부산 송도해상케이블카',
    '부산 송도해수욕장',
    '부산 암남공원',
    '부산북항 친수공원',
    '부산어린이대공원',
    '불란서그로서리',
    '브리타니',
    '비아조',
    '빅토리아 베이커리 가든',
    '삼락생태공원',
    '성안집',
    '송도 구름산책로',
    '송정물총칼국수',
    '송정해수욕장',
    '스노잉클라우드',
    '스포원파크',
    '신세계사이먼 부산 프리미엄 아울렛',
    '아르반호텔[한국관광 품질인증/Korea Quality]',
    '아미르공원',
    '알로이삥삥',
    '옐로우라이트하우스',
    '오구카페',
    '용소웰빙공원',
    '원시학',
    '웨스턴챔버',
    '웨이브온 커피',
    '윙민박',
    '유정1995 기장 본점',
    '을숙도 공원',
    '이바구캠프',
    '장림포구',
    '절영해안산책로',
    '죽성드림세트장',
    '카페베이스',
    '카페윤',
    '캐빈스위트광안',
    '캔버스',
    '캔버스 블랙',
    '태종대',
    '팝콘 호스텔 해운대점',
    '프루터리포레스트',
    '해동용궁사',
    '해운대 달맞이길',
    '해운대 동백섬',
    '해운대 블루라인파크',
    '해운대 영무파라드호텔',
    '해운대해수욕장',
    '해월전망대',
    '형제가든',
    '황령산',
    '황령산 전망대',
    '황령산레포츠공원',
    '회동수원지',
    '회동수원지 둘레길',
    'AJ하우스(AJ House)',
    'EL16.52',
    'JSTAY',
    'The Park Guest House'
  ];
  const [loading, setLoading] = useState(false);
  const [generalSearchKeyword, setGeneralSearchKeyword] = useState("");
  const [petSearchKeyword, setPetSearchKeyword] = useState("");
  const [generalCurrentPage, setGeneralCurrentPage] = useState(1);
  const [petCurrentPage, setPetCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"general" | "pet">("general");
  const [userAreaCode, setUserAreaCode] = useState<string>('');
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
  }, [generalCurrentPage, petCurrentPage, userAreaCode, activeTab]); // activeTab 의존성 추가

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
        // 반려동물 탭인 경우 - 두 가지 API 호출 후 합치기
        console.log('=== 반려동물 탭 데이터 로딩 시작 ===');
        
        // 병렬로 두 API 호출
        const [petResponse, generalResponse] = await Promise.all([
          // 1. 기존 반려동물 여행지 API
          supabase.functions.invoke('combined-tour-api', {
            body: {
              areaCode: userAreaCode,
              numOfRows: '50', // 모든 반려동물 여행지 가져오기
              pageNo: '1',
              keyword: petKeyword || '',
              activeTab: 'pet'
            }
          }),
          // 2. 일반 관광지 API (키워드 매칭용)
          supabase.functions.invoke('combined-tour-api', {
            body: {
              areaCode: userAreaCode,
              numOfRows: '200', // 키워드 매칭을 위해 많은 데이터 가져오기
              pageNo: '1',
              keyword: petKeyword || '',
              activeTab: 'general'
            }
          })
        ]);

        console.log('반려동물 API 응답:', petResponse);
        console.log('일반 관광지 API 응답:', generalResponse);

        let combinedPetPlaces: any[] = [];

        // 1. 기존 반려동물 여행지 처리
        if (petResponse.data?.petTourismData && !petResponse.data.petTourismData.error && 
            petResponse.data.petTourismData.response?.header?.resultCode === "0000" &&
            petResponse.data.petTourismData.response?.body?.items?.item) {
          const petItems = petResponse.data.petTourismData.response.body.items.item;
          const processedPetData = Array.isArray(petItems) ? petItems : petItems ? [petItems] : [];
          console.log(`기존 반려동물 여행지 ${processedPetData.length}개 로드`);
          
          // 기존 반려동물 여행지 제목들 출력
          console.log('=== 기존 반려동물 여행지 목록 ===');
          processedPetData.forEach((place, index) => {
            console.log(`${index + 1}. ${place.title}`);
          });
          
          combinedPetPlaces = [...processedPetData];
        }

        // 2. 일반 관광지에서 키워드 매칭된 것들 추가
        console.log('=== 키워드별 개별 검색 시작 ===');
        
        // 키워드별로 개별 API 검색 수행
        const keywordsToMatch = petKeyword ? [petKeyword] : petFriendlyKeywords;
        console.log(`${keywordsToMatch.length}개 키워드로 개별 검색 시작`);
        
        let allMatchedPlaces: any[] = [];
        
        // 키워드를 배치로 나누어 병렬 처리 (한번에 10개씩)
        const batchSize = 10;
        for (let i = 0; i < keywordsToMatch.length; i += batchSize) {
          const batch = keywordsToMatch.slice(i, i + batchSize);
          console.log(`배치 ${Math.floor(i/batchSize) + 1}: ${batch.length}개 키워드 검색 중...`);
          
          const batchPromises = batch.map(async (keyword) => {
            try {
              const response = await supabase.functions.invoke('combined-tour-api', {
                body: {
                  areaCode: userAreaCode,
                  numOfRows: '20', // 키워드당 최대 20개
                  pageNo: '1',
                  keyword: keyword, // 개별 키워드로 검색
                  activeTab: 'general'
                }
              });
              
              if (response.data?.tourismData?.response?.body?.items?.item) {
                const items = response.data.tourismData.response.body.items.item;
                const processedItems = Array.isArray(items) ? items : items ? [items] : [];
                console.log(`✓ "${keyword}": ${processedItems.length}개 발견`);
                return processedItems;
              } else {
                console.log(`✗ "${keyword}": 검색 결과 없음`);
                return [];
              }
            } catch (error) {
              console.error(`키워드 "${keyword}" 검색 실패:`, error);
              return [];
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          const batchMatched = batchResults.flat();
          allMatchedPlaces = [...allMatchedPlaces, ...batchMatched];
          
          // 배치 간 짧은 지연 (API 호출 제한 방지)
          if (i + batchSize < keywordsToMatch.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
         console.log(`키워드별 검색 완료: 총 ${allMatchedPlaces.length}개 관광지 발견`);
         
         // 상세 분석: 키워드별 결과 상세 출력
         console.log('=== 키워드별 검색 결과 상세 분석 ===');
         let keywordResultCount = 0;
         const keywordResults: any[] = [];
         
         for (let i = 0; i < keywordsToMatch.length; i += batchSize) {
           const batch = keywordsToMatch.slice(i, i + batchSize);
           
           for (const keyword of batch) {
             // 해당 키워드로 검색된 결과 중에서 해당 키워드와 관련된 것들만 찾기
             const keywordMatches = allMatchedPlaces.filter(place => {
               return place.title.includes(keyword) || 
                      keyword.includes(place.title) ||
                      place.title.replace(/\s/g, '').includes(keyword.replace(/\s/g, '')) ||
                      keyword.replace(/\s/g, '').includes(place.title.replace(/\s/g, ''));
             });
             
             if (keywordMatches.length > 0) {
               keywordResultCount++;
               keywordResults.push({
                 keyword: keyword,
                 matches: keywordMatches.map(p => ({ title: p.title, contentid: p.contentid }))
               });
               console.log(`"${keyword}" → ${keywordMatches.length}개: ${keywordMatches.map(p => p.title).join(', ')}`);
             }
           }
         }
         
         console.log(`\n=== 검색 요약 ===`);
         console.log(`검색된 키워드: ${keywordResultCount}/${keywordsToMatch.length}개`);
         console.log(`전체 검색 결과: ${allMatchedPlaces.length}개 관광지`);
         
         // 기존 반려동물 여행지와 겹치는 것들 확인
         const existingPetTitles = combinedPetPlaces.map(place => place.title);
         console.log('\n=== 기존 반려동물 여행지와 중복 확인 ===');
         
         const duplicateKeywords: string[] = [];
         keywordsToMatch.forEach(keyword => {
           const isExistingPet = existingPetTitles.some(title => 
             title.includes(keyword) || keyword.includes(title) ||
             title.replace(/\s/g, '') === keyword.replace(/\s/g, '')
           );
           if (isExistingPet) {
             duplicateKeywords.push(keyword);
             console.log(`"${keyword}" → 이미 기존 반려동물 여행지에 있음`);
           }
         });
         
         console.log(`기존 반려동물 여행지와 겹치는 키워드: ${duplicateKeywords.length}개`);
         console.log(`실제 새로 추가할 키워드: ${keywordsToMatch.length - duplicateKeywords.length}개`);
         
         // 중복 제거 (contentid 기준)
         const existingContentIds = new Set(combinedPetPlaces.map(place => place.contentid));
         const seenContentIds = new Set();
         
         const uniqueMatchedPlaces = allMatchedPlaces.filter(place => {
           const contentId = place.contentid;
           if (!contentId || existingContentIds.has(contentId) || seenContentIds.has(contentId)) {
             return false;
           }
           seenContentIds.add(contentId);
           return true;
         });
         
         console.log('\n=== 최종 결과 분석 ===');
         console.log(`📍 키워드 분석:`);
         console.log(`  - 전체 입력 키워드: ${keywordsToMatch.length}개`);
         console.log(`  - 기존 반려동물 여행지와 겹치는 키워드: ${duplicateKeywords.length}개`);
         console.log(`  - 새로 검색할 키워드: ${keywordsToMatch.length - duplicateKeywords.length}개`);
         
         console.log(`🏛️ 관광지 분석:`);
         console.log(`  - 키워드 검색으로 찾은 총 관광지: ${allMatchedPlaces.length}개`);
         console.log(`  - 기존 반려동물 여행지: ${combinedPetPlaces.length}개`);
         console.log(`  - 중복 제거 후 새로 추가될 관광지: ${uniqueMatchedPlaces.length}개`);
         console.log(`  - 최종 반려동물 동반 여행지 총합: ${combinedPetPlaces.length + uniqueMatchedPlaces.length}개`);
         
         console.log(`\n🔍 왜 키워드 개수와 관광지 개수가 다른가?`);
         console.log(`  - 한 키워드로 검색하면 관련된 여러 관광지가 나올 수 있음`);
         console.log(`  - 예: "부산시민공원" → 부산시민공원, 부산시민공원 산책로 등`);
         
         if (uniqueMatchedPlaces.length > 0) {
           console.log(`\n📝 새로 추가되는 ${uniqueMatchedPlaces.length}개 관광지 목록:`);
           uniqueMatchedPlaces.forEach((place: any, index: number) => {
             console.log(`${index + 1}. ${place.title} (${place.addr1})`);
           });
         }
         
         combinedPetPlaces = [...combinedPetPlaces, ...uniqueMatchedPlaces];

        // 페이지네이션 적용 (클라이언트 사이드)
        const itemsPerPage = 10;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedPlaces = combinedPetPlaces.slice(startIndex, endIndex);

        console.log(`총 ${combinedPetPlaces.length}개 중 ${startIndex + 1}-${Math.min(endIndex, combinedPetPlaces.length)}번째 표시`);

        setPetTourPlaces(paginatedPlaces);
        setPetTotalCount(combinedPetPlaces.length);

        if (combinedPetPlaces.length > 0) {
          toast.success(`${combinedPetPlaces.length}개의 반려동물 동반 여행지를 불러왔습니다!`);
        } else {
          toast.warning("반려동물 동반 여행지를 찾을 수 없습니다.");
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
      setPetCurrentPage(1);
      fetchTourPlaces("", petSearchKeyword);
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
    }
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
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
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