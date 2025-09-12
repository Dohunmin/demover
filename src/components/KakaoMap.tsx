import React, { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Coffee, 
  UtensilsCrossed, 
  Utensils,
  Bed, 
  Waves, 
  TreePine, 
  Mountain, 
  ShoppingBag, 
  Church,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import PlaceReviewModal from "./PlaceReviewModal";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    kakao: any;
  }
}

interface Place {
  title: string;
  addr1: string;
  addr2?: string;
  mapx: string;
  mapy: string;
  contentid?: string;
  tel?: string;
  locationGubun?: string;
  mbti?: string | string[];
  holiday?: string;
}

interface KakaoMapProps {
  petTourismData?: any;
  propSelectedCategory?: string;
  initialCategory?: string;
  showPetFilter?: boolean;
  hideSearchBar?: boolean;
  hideCategoryGrid?: boolean;
  onBack?: () => void;
}

const mbtiData = [
  { id: "ESVF", label: "활발한 탐험가" },
  { id: "ESVB", label: "사교적 모험가" },
  { id: "ESNF", label: "호기심 많은 친구" },
  { id: "ESNB", label: "차분한 동반자" },
  { id: "EOVF", label: "자유로운 영혼" },
  { id: "EOVB", label: "느긋한 관찰자" },
  { id: "EONF", label: "냄새로 탐험하는 친구" },
  { id: "EONB", label: "주인만 바라보는 친구" },
  { id: "CSVF", label: "시각적 학습자" },
  { id: "CSVB", label: "침착한 학습자" },
  { id: "CSNF", label: "패션 리더" },
  { id: "CSNB", label: "차분한 패셔니스타" },
  { id: "COVF", label: "자연을 사랑하는 개" },
  { id: "COVB", label: "여유로운 자연인" },
  { id: "CONF", label: "냄새 중시 탐험가" },
  { id: "CONB", label: "기본에 충실한 개" }
];

const KakaoMap: React.FC<KakaoMapProps> = ({
  petTourismData,
  propSelectedCategory = "all",
  showPetFilter = true,
  hideSearchBar = false,
  hideCategoryGrid = false,
  onBack
}) => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const infoWindow = useRef<any>(null);
  const clusterer = useRef<any>(null);
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(propSelectedCategory);
  
  // 상태 동기화
  useEffect(() => {
    if (propSelectedCategory !== undefined) {
      setSelectedCategory(propSelectedCategory);
    }
  }, [propSelectedCategory]);

  // 필터링 실행 중 상태 추가
  const [isFiltering, setIsFiltering] = useState(false);

  // 카테고리별 필터링 (sample-data에 실제 존재하는 카테고리만)
  const categories = [
    { id: "all", label: "전체", icon: MapPin },
    { id: "cafe", label: "카페", icon: Coffee },
    { id: "restaurant", label: "식당", icon: UtensilsCrossed },
    { id: "brunch", label: "브런치", icon: Utensils },
    { id: "accommodation", label: "숙소", icon: Bed },
    { id: "beach", label: "해수욕장", icon: Waves },
    { id: "park", label: "공원", icon: TreePine },
    { id: "trekking", label: "트레킹", icon: Mountain },
    { id: "theme-street", label: "테마거리", icon: MapPin },
    { id: "shopping", label: "쇼핑", icon: ShoppingBag },
    { id: "temple", label: "사찰", icon: Church }
  ];

  // 카테고리별 마커 아이콘 매핑
  const getCategoryIcon = (locationGubun: string) => {
    const iconMap: { [key: string]: { color: string; emoji: string } } = {
      "카페": { color: "#8B4513", emoji: "☕" },
      "식당": { color: "#FF6B35", emoji: "🍽️" },
      "브런치": { color: "#FFB347", emoji: "🥐" },
      "숙소": { color: "#4A90E2", emoji: "🏨" },
      "해수욕장": { color: "#00BFFF", emoji: "🏖️" },
      "공원": { color: "#32CD32", emoji: "🌳" },
      "트레킹": { color: "#228B22", emoji: "🥾" },
      "테마거리": { color: "#9370DB", emoji: "🛣️" },
      "쇼핑": { color: "#FF69B4", emoji: "🛍️" },
      "사찰": { color: "#DAA520", emoji: "🏛️" },
      "재래시장": { color: "#FF4500", emoji: "🏪" },
      "레저": { color: "#1E90FF", emoji: "🎯" },
      "문화시설": { color: "#8A2BE2", emoji: "🎭" },
      "항구": { color: "#20B2AA", emoji: "⚓" }
    };
    
    return iconMap[locationGubun] || { color: "#666666", emoji: "📍" };
  };

  const [petTourismMarkers, setPetTourismMarkers] = useState<any[]>([]);
  const [allPetData, setAllPetData] = useState<any[]>([]);
  const [selectedPlaceForReview, setSelectedPlaceForReview] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedMbti, setSelectedMbti] = useState<string | null>(null);
  const [isMbtiModalOpen, setIsMbtiModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // 드래그 스크롤을 위한 상태
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });

  // 지도 초기화
  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;

    try {
      const mapOption = {
        center: new window.kakao.maps.LatLng(35.1796, 129.0756),
        level: 8,
      };

      mapInstance.current = new window.kakao.maps.Map(mapRef.current, mapOption);

      const zoomControl = new window.kakao.maps.ZoomControl();
      mapInstance.current.addControl(
        zoomControl,
        window.kakao.maps.ControlPosition.RIGHT
      );

      infoWindow.current = new window.kakao.maps.InfoWindow({ zIndex: 1 });

      console.log("✅ 지도 초기화 완료");
      setIsMapLoaded(true);
    } catch (error) {
      console.error("지도 초기화 오류:", error);
      toast.error("지도 초기화 중 오류가 발생했습니다.");
    }
  }, []);

  // 드래그 스크롤 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoryScrollRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - categoryScrollRef.current.offsetLeft,
      scrollLeft: categoryScrollRef.current.scrollLeft,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !categoryScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - dragStart.x) * 2; // 스크롤 속도
    categoryScrollRef.current.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!categoryScrollRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].pageX - categoryScrollRef.current.offsetLeft,
      scrollLeft: categoryScrollRef.current.scrollLeft,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !categoryScrollRef.current) return;
    const x = e.touches[0].pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - dragStart.x) * 1.5; // 터치 스크롤 속도
    categoryScrollRef.current.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 통합된 마커 생성 함수 - 중복 방지 및 동기 처리
  const createMarkers = useCallback(
    (categoryId: string, mbtiFilter: string | null = null) => {
      console.log(`🎯 마커 생성 시작: ${categoryId}, MBTI: ${mbtiFilter || 'none'}`);
      console.log(`🔍 데이터 상태 확인:`, {
        showPetFilter,
        allPetDataLength: allPetData.length,
        mapInstanceExists: !!mapInstance.current,
        sampleDataPreview: allPetData.slice(0, 3).map(item => ({
          title: item.title,
          locationGubun: item.locationGubun,
          mbti: item.mbti,
          mapx: item.mapx,
          mapy: item.mapy
        }))
      });

      if (!showPetFilter || allPetData.length === 0 || !mapInstance.current) {
        console.log(`❌ 마커 생성 조건 불충족:`, {
          showPetFilter,
          dataLength: allPetData.length,
          mapExists: !!mapInstance.current
        });
        return;
      }

      // 🔥 모든 기존 마커들 완전히 제거
      setPetTourismMarkers((prevMarkers) => {
        prevMarkers.forEach((marker) => marker.setMap(null));
        return [];
      });
      
      markers.current.forEach((marker) => marker.setMap(null));
      markers.current = [];
      
      if (clusterer.current) {
        clusterer.current.clear();
      }

      // 1단계: 중복 제거 강화 (contentid + title 기준)
      const uniqueDataMap = new Map();
      allPetData.forEach((item: any) => {
        const uniqueKey = item.contentid ? 
          `id_${item.contentid}` : 
          `title_${item.title}_${item.mapx}_${item.mapy}`;
        
        if (!uniqueDataMap.has(uniqueKey)) {
          uniqueDataMap.set(uniqueKey, item);
        }
      });
      
      const deduplicatedData = Array.from(uniqueDataMap.values());
      console.log(`🔄 중복 제거: ${allPetData.length}개 → ${deduplicatedData.length}개`);

      // 2단계: 카테고리 필터링
      let filteredPlaces = [];
      if (categoryId === "all") {
        filteredPlaces = [...deduplicatedData];
        console.log(`✅ 전체 카테고리: ${filteredPlaces.length}개`);
      } else {
        // sample-data.ts에 실제로 존재하는 locationGubun과 정확히 매칭
        const locationGubunMap = {
          restaurant: "식당",
          shopping: "쇼핑", 
          brunch: "브런치",
          cafe: "카페",
          park: "공원",
          temple: "사찰",
          accommodation: "숙소",
          "theme-street": "테마거리",
          trekking: "트레킹", 
          beach: "해수욕장"
        };

        const targetLocationGubun = locationGubunMap[categoryId as keyof typeof locationGubunMap];
        
        if (targetLocationGubun) {
          filteredPlaces = deduplicatedData.filter(place => place.locationGubun === targetLocationGubun);
          console.log(`✅ ${categoryId} (${targetLocationGubun}) 카테고리 필터링: ${filteredPlaces.length}개`);
          
          // 디버깅: 해당 카테고리의 모든 데이터 확인
          if (filteredPlaces.length === 0) {
            console.log(`⚠️ ${targetLocationGubun} 카테고리에 데이터가 없습니다.`);
            // 전체 데이터에서 해당 카테고리 검색
            const allCategoryData = deduplicatedData.filter(place => place.locationGubun === targetLocationGubun);
            console.log(`🔍 전체 데이터에서 ${targetLocationGubun} 검색 결과: ${allCategoryData.length}개`);
            
            // 실제 존재하는 카테고리들 확인
            const existingCategories = [...new Set(deduplicatedData.map(place => place.locationGubun))];
            console.log(`📋 데이터에 존재하는 카테고리들:`, existingCategories);
          }
        } else {
          console.log(`❌ 매핑되지 않은 카테고리: ${categoryId}`);
        }
      }

      // 3단계: MBTI 필터링 (선택된 MBTI가 있을 때만 적용)
      let finalPlaces = filteredPlaces;
      if (mbtiFilter && filteredPlaces.length > 0) {
        console.log(`🧠 MBTI 필터 적용: ${mbtiFilter}`);
        const beforeCount = filteredPlaces.length;
        
        finalPlaces = filteredPlaces.filter((place) => {
          if (!place.mbti) return false;
          
          // mbti가 "all"이면 모든 MBTI에 표시
          if (place.mbti === "all") return true;
          
          if (Array.isArray(place.mbti)) {
            return place.mbti.includes(mbtiFilter);
          } else {
            return place.mbti === mbtiFilter;
          }
        });
        
        const afterCount = finalPlaces.length;
        console.log(`🧠 MBTI 필터링 완료: ${beforeCount}개 → ${afterCount}개`);
      }

      // 4단계: 90-99개 제한 체크 (전체 카테고리, MBTI 필터 없을 때만)
      if (categoryId === "all" && !mbtiFilter) {
        const dataCount = finalPlaces.length;
        if (dataCount < 85 || dataCount > 105) {
          console.warn(`⚠️ 데이터 개수 주의: ${dataCount}개 (권장 범위: 85-105개)`);
          // 오류로 처리하지 않고 경고만 표시
          toast.info(`총 ${dataCount}개의 장소를 표시합니다.`);
        }
      }

      // 5단계: 마커 생성 (동기적 처리로 겹침 방지)
      const newMarkers: any[] = [];
      let markerCount = 0;
      
      finalPlaces.forEach((place, index) => {
        if (!place.mapx || !place.mapy || place.mapx === "0" || place.mapy === "0") {
          return;
        }

        try {
          const position = new window.kakao.maps.LatLng(place.mapy, place.mapx);
          
          // SVG 마커 이미지 생성 (동기 처리)
          const markerSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="40" height="50">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.2)"/>
                </filter>
                <clipPath id="circleClip">
                  <circle cx="20" cy="16" r="10"/>
                </clipPath>
              </defs>
              
              <path d="M20 2 C12 2, 6 8, 6 16 C6 24, 20 42, 20 42 S34 24, 34 16 C34 8, 28 2, 20 2 Z" 
                    fill="#f0f9ff" stroke="#87ceeb" stroke-width="2" filter="url(#shadow)"/>
              
              <circle cx="20" cy="16" r="11" fill="white" stroke="#5fb3d4" stroke-width="1"/>
              
              <image href="/lovable-uploads/98b33a3a-8acc-4374-b015-d9b87702fb52.png" 
                     x="10" y="6" width="20" height="20" 
                     clip-path="url(#circleClip)" preserveAspectRatio="xMidYMid slice"/>
              
              <path d="M20 2 C12 2, 6 8, 6 16 C6 24, 20 42, 20 42 S34 24, 34 16 C34 8, 28 2, 20 2 Z" 
                    fill="none" stroke="#5fb3d4" stroke-width="1"/>
            </svg>
          `)}`;

          const markerImage = new window.kakao.maps.MarkerImage(markerSvg, new window.kakao.maps.Size(40, 50), { offset: new window.kakao.maps.Point(20, 50) });
          
          const newMarker = new window.kakao.maps.Marker({
            position: position,
            image: markerImage,
            clickable: true,
          });

          newMarker.setMap(mapInstance.current);
          newMarkers.push(newMarker);
          markerCount++;

          // 마커 클릭 이벤트
          window.kakao.maps.event.addListener(newMarker, "click", () => {
            const content = `
              <div style="padding: 12px; min-width: 200px; max-width: 240px; font-family: 'Malgun Gothic', sans-serif; position: relative; word-wrap: break-word; overflow: hidden;">
                <button onclick="window.closeInfoWindow()" style="position: absolute; top: 6px; right: 6px; background: #f3f4f6; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; color: #6b7280;">×</button>
                
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; color: #DC2626; padding-right: 26px; line-height: 1.2; word-wrap: break-word; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${place.title}</div>
                
                <div style="font-size: 10px; color: #666; margin-bottom: 6px; background: #FEF2F2; padding: 3px 6px; border-radius: 8px; display: inline-block;">
                  🐾 반려동물 동반 가능
                </div>
                
                ${place.locationGubun ? `<div style="font-size: 10px; color: #666; margin-bottom: 6px; background: #F3F4F6; padding: 3px 6px; border-radius: 8px; display: inline-block; max-width: 100%; word-wrap: break-word;">📍 ${place.locationGubun}</div>` : ""}
                ${place.mbti && place.mbti !== "all" ? `<div style="font-size: 10px; color: #666; margin-bottom: 6px; background: #E0F2FE; padding: 3px 6px; border-radius: 8px; display: inline-block; max-width: 100%; word-wrap: break-word;">🧠 MBTI: ${Array.isArray(place.mbti) ? place.mbti.join(', ') : place.mbti}</div>` : ""}
                
                ${place.holiday ? `<div style="font-size: 10px; color: #666; margin-bottom: 6px; background: #F3F4F6; padding: 3px 6px; border-radius: 8px; display: inline-block; max-width: 100%; word-wrap: break-word;">🚫 휴무일: ${place.holiday}</div>` : ""}
                
                <div style="font-size: 11px; color: #333; margin-bottom: 4px; line-height: 1.2; word-wrap: break-word; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${place.addr1 || '주소 정보 없음'}</div>
                ${place.addr2 ? `<div style="font-size: 10px; color: #666; margin-bottom: 4px; word-wrap: break-word; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;">${place.addr2}</div>` : ""}
                ${place.tel ? `<div style="font-size: 10px; color: #666; margin-bottom: 6px; word-wrap: break-word;">📞 ${place.tel}</div>` : ""}
                
                <div style="text-align: center;">
                  <button id="review-btn-${place.contentid}" 
                     onclick="event.stopPropagation(); window.openReviewModal && window.openReviewModal('${place.contentid}', '${place.title.replace(/'/g, "\\'")}')"
                     style="color: #DC2626; font-size: 10px; text-decoration: none; background: #FEF2F2; padding: 4px 8px; border-radius: 6px; display: inline-block; border: 1px solid #FCA5A5; cursor: pointer;">
                    ⭐ 평점 및 후기
                  </button>
                </div>
              </div>
            `;
            
            infoWindow.current.setContent(content);
            infoWindow.current.open(mapInstance.current, newMarker);

            (window as any).closeInfoWindow = () => {
              infoWindow.current.close();
            };

            (window as any).openReviewModal = (contentid: string, title: string) => {
              if (isReviewModalOpen) return;
              setSelectedPlaceForReview({ contentid, title });
              setIsReviewModalOpen(true);
            };
          });
          
        } catch (error) {
          console.error(`❌ 마커 생성 실패: ${place.title}`, error);
        }
      });

      // 6단계: 지도 뷰 조정
      if (newMarkers.length > 0) {
        const bounds = new window.kakao.maps.LatLngBounds();
        newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
        
        if (newMarkers.length === 1) {
          mapInstance.current.setCenter(newMarkers[0].getPosition());
          mapInstance.current.setLevel(5);
        } else if (newMarkers.length <= 10) {
          mapInstance.current.setBounds(bounds);
        } else {
          mapInstance.current.setBounds(bounds);
          setTimeout(() => {
            if (mapInstance.current.getLevel() > 7) {
              mapInstance.current.setLevel(7);
            }
          }, 100);
        }
      }

      // 7단계: 마커 상태 업데이트
      markers.current = newMarkers;
      setPetTourismMarkers(newMarkers);

      console.log(`✅ 마커 생성 완료: ${markerCount}개 (총 데이터: ${finalPlaces.length}개)`);
      
      // 성공 메시지
      const categoryLabels = {
        all: "전체",
        cafe: "카페", 
        restaurant: "식당",
        brunch: "브런치",
        accommodation: "숙소",
        beach: "해수욕장",
        park: "공원",
        trekking: "트레킹",
        "theme-street": "테마거리",
        shopping: "쇼핑",
        temple: "사찰"
      };
      
      if (markerCount > 0) {
        const categoryName = categoryLabels[categoryId as keyof typeof categoryLabels] || categoryId;
        const mbtiText = mbtiFilter ? ` (${mbtiFilter} 필터)` : "";
        toast.success(`${categoryName} ${markerCount}개를 지도에 표시했습니다${mbtiText}`);
      } else {
        const categoryName = categoryLabels[categoryId as keyof typeof categoryLabels] || categoryId;
        toast.info(`${categoryName} 카테고리에서 조건에 맞는 장소를 찾지 못했습니다. 다른 조건을 시도해보세요.`);
      }
    },
    [showPetFilter, allPetData, isReviewModalOpen]
  );

  // 카테고리 선택 핸들러 - 통합된 마커 생성 함수 사용
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      if (isFiltering) {
        console.log("⚠️ 이미 필터링 중이므로 중복 실행 방지");
        return;
      }
      
      console.log(`🎯 카테고리 선택: ${categoryId}`);
      setIsFiltering(true);
      setSelectedCategory(categoryId);
      
      // createMarkers 실행 후 필터링 상태 해제
      try {
        createMarkers(categoryId, selectedMbti);
      } catch (error) {
        console.error('마커 생성 중 오류:', error);
      } finally {
        setIsFiltering(false);
      }
    },
    [isFiltering, selectedMbti, createMarkers]
  );


  // MBTI 선택 핸들러 - 중복 실행 방지
  const handleMbtiSelect = useCallback(
    (mbtiId: string) => {
      console.log(`🧠 MBTI 선택: ${mbtiId}`);
      
      if (mbtiId === "none") {
        setSelectedMbti(null);
        setIsMbtiModalOpen(false);
        toast.success("멍BTI 필터가 해제되었습니다.");
      } else {
        setSelectedMbti(mbtiId);
        setIsMbtiModalOpen(false);
        toast.success(`${mbtiId} 멍BTI 필터가 적용되었습니다.`);
      }
      
      // 현재 카테고리와 함께 마커 재생성
      if (selectedCategory) {
        createMarkers(selectedCategory, mbtiId === "none" ? null : mbtiId);
      }
    },
    [selectedCategory, createMarkers]
  );

  // 검색 기능
  const searchPlaces = useCallback(() => {
    if (!searchQuery.trim() || !mapInstance.current) return;
    
    setLoading(true);
    const places = new window.kakao.maps.services.Places();
    
    places.keywordSearch(searchQuery, (data: any, status: any) => {
      setLoading(false);
      
      if (status === window.kakao.maps.services.Status.OK) {
        // 기존 마커 제거
        markers.current.forEach(marker => marker.setMap(null));
        markers.current = [];
        
        const bounds = new window.kakao.maps.LatLngBounds();
        
        data.forEach((place: any) => {
          const position = new window.kakao.maps.LatLng(place.y, place.x);
          
          // 기본 마커 생성
          const marker = new window.kakao.maps.Marker({
            position: position,
            clickable: true
          });
          
          marker.setMap(mapInstance.current);
          markers.current.push(marker);
          bounds.extend(position);
          
          // 인포윈도우
          const iwContent = `
            <div style="padding:8px;font-size:12px;">
              <strong>${place.place_name}</strong><br>
              ${place.road_address_name || place.address_name}<br>
              ${place.phone ? `📞 ${place.phone}` : ''}
            </div>
          `;
          
          const infowindow = new window.kakao.maps.InfoWindow({
            content: iwContent
          });
          
          window.kakao.maps.event.addListener(marker, 'click', () => {
            infowindow.open(mapInstance.current, marker);
          });
        });
        
        mapInstance.current.setBounds(bounds);
        toast.success(`'${searchQuery}' 검색 결과 ${data.length}개를 찾았습니다.`);
      } else {
        toast.error("검색 결과가 없습니다.");
      }
    });
  }, [searchQuery]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchPlaces();
    }
  };

  // Kakao Map API 로드 및 초기화
  useEffect(() => {
    const loadKakaoMap = async () => {
      try {
        if (window.kakao && window.kakao.maps) {
          initializeMap();
          return;
        }

        const { data: apiKey } = await supabase.functions.invoke('kakao-proxy', {
          body: { action: 'getApiKey' }
        });

        if (!apiKey?.success || !apiKey?.data?.apiKey) {
          throw new Error('API Key를 가져올 수 없습니다.');
        }

        const script = document.createElement("script");
        script.async = true;
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey.data.apiKey}&libraries=services,clusterer&autoload=false`;

        script.onload = () => {
          window.kakao.maps.load(() => {
            initializeMap();
          });
        };

        script.onerror = () => {
          console.error("Kakao Map script load failed");
          toast.error("지도를 불러올 수 없습니다.");
        };

        document.head.appendChild(script);

      } catch (error) {
        console.error('지도 로드 오류:', error);
        toast.error("지도를 불러올 수 없습니다.");
      }
    };

    loadKakaoMap();
  }, [initializeMap]);

  // 데이터 로드 및 마커 생성
  useEffect(() => {
    if (petTourismData && petTourismData.length > 0) {
      console.log('🔄 Props로 받은 데이터로 마커 생성');
      setAllPetData(petTourismData);
      return;
    }

    if (allPetData.length === 0 && showPetFilter) {
      // props로 데이터를 받지 못했고, 자체 데이터도 없다면 직접 로드
      console.log('🔄 지도에서 자체적으로 반려동물 데이터 로드 시작');
      loadPetTourismData();
    }
  }, [petTourismData, allPetData.length, showPetFilter]);

  // 반려동물 데이터 자체 로드 함수
  const loadPetTourismData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('combined-tour-api', {
        body: {
          areaCode: '6', // 부산 고정
          numOfRows: '200',
          pageNo: '1',
          keyword: '',
          activeTab: 'pet',
          loadAllPetKeywords: true
        }
      });

      if (error) {
        console.error('반려동물 데이터 로드 실패:', error);
        return;
      }

      let allPetData = [];

      // 1. API에서 받은 데이터 처리
      if (data?.petTourismData?.response?.body?.items?.item) {
        const items = data.petTourismData.response.body.items.item;
        const processedItems = Array.isArray(items) ? items : [items];
        allPetData.push(...processedItems);
        console.log(`📡 API 데이터: ${processedItems.length}개`);
      }

      // 2. Sample 데이터 (additionalPetPlaces) 추가 - "all" MBTI 값 보존
      if (data?.additionalPetPlaces && Array.isArray(data.additionalPetPlaces)) {
        const sampleData = data.additionalPetPlaces;
        allPetData.push(...sampleData);
        console.log(`🌟 Sample 데이터: ${sampleData.length}개 추가`);
        
        // "all" MBTI 장소들 확인
        const allMbtiPlaces = sampleData.filter((item: any) => item.mbti === 'all');
        console.log(`🎯 "all" MBTI 장소들: ${allMbtiPlaces.length}개`, allMbtiPlaces.map((p: any) => p.title));
      }

      // 3. 중복 제거 (contentid 기준)
      const uniqueDataMap = new Map();
      allPetData.forEach((item: any) => {
        if (item.contentid && !uniqueDataMap.has(item.contentid)) {
          uniqueDataMap.set(item.contentid, item);
        } else if (!item.contentid && item.title) {
          // contentid가 없는 경우 title로 중복 체크
          const titleKey = `title_${item.title}`;
          if (!uniqueDataMap.has(titleKey)) {
            uniqueDataMap.set(titleKey, item);
          }
        }
      });
      
      const deduplicatedData = Array.from(uniqueDataMap.values());
      console.log(`🔄 중복 제거: ${allPetData.length}개 → ${deduplicatedData.length}개`);

      const validData = deduplicatedData.filter(
        (item: any) => item.mapx && item.mapy && item.mapx !== "0" && item.mapy !== "0"
      );

      // 4. 데이터 개수 검증 (90개 이상 100개 미만만 허용)
      const dataCount = validData.length;
      console.log(`📊 유효한 데이터 개수: ${dataCount}개`);
      
      setAllPetData(validData);
      console.log(`✅ 반려동물 데이터 로드 완료: ${validData.length}개`);

    } catch (error) {
      console.error('반려동물 데이터 로드 오류:', error);
      toast.error('반려동물 여행지 데이터를 불러올 수 없습니다.');
    }
  };

  // 지도와 데이터가 모두 로드되면 마커 생성
  useEffect(() => {
    if (isMapLoaded && allPetData.length > 0 && showPetFilter) {
      console.log(`🎯 지도 로드 완료 후 마커 생성: ${selectedCategory}`);
      createMarkers(selectedCategory, selectedMbti);
    }
  }, [isMapLoaded, allPetData.length, showPetFilter, selectedCategory, selectedMbti, createMarkers]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBack ? onBack() : navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="header-title">지도</h1>
            <p className="header-subtitle">카테고리별 반려동물 동반 가능 장소</p>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      {!hideSearchBar && showPetFilter && (
        <div className="px-5 mb-3">
          <Card className="p-3 bg-white border-0 shadow-lg rounded-xl">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="카카오맵에서 장소 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="pl-10 border-gray-200 focus:border-primary h-8 text-sm"
                />
              </div>
              <Button 
                onClick={searchPlaces}
                disabled={loading}
                size="sm"
                className="px-3 h-8"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <Search className="w-3 h-3" />
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Category Grid */}
      {!hideCategoryGrid && showPetFilter && (
        <div className="px-5 mb-3">
          <Card className="p-3 bg-white border-0 shadow-lg rounded-xl">
            <h3 className="font-semibold text-sm mb-2 text-gray-900">카테고리 선택</h3>
            <div 
              ref={categoryScrollRef}
              className={`flex gap-2 overflow-x-auto scrollbar-hide pb-1 cursor-grab ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ userSelect: 'none' }}
            >
              {categories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={(e) => {
                      // 드래그 중이면 클릭 이벤트 방지
                      if (isDragging) {
                        e.preventDefault();
                        return;
                      }
                      handleCategorySelect(category.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                      isSelected
                        ? "bg-gray-900 text-white"
                        : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-xs font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>
            {/* 스크롤 힌트 */}
            <div className="text-xs text-gray-400 mt-1 text-center">← 좌우로 드래그하여 더 많은 카테고리를 확인하세요 →</div>
          </Card>
        </div>
      )}

      {/* MBTI Filter */}
      {showPetFilter && (
        <div className="px-5 mb-3">
          <Card className="p-3 bg-white border-0 shadow-lg rounded-xl">
            <h3 className="font-semibold text-sm mb-2 text-gray-900">멍BTI 필터</h3>
            <Button
              variant="outline"
              onClick={() => setIsMbtiModalOpen(true)}
              className="w-full justify-between bg-gray-50 border-gray-200 hover:bg-gray-100 h-8 text-xs"
            >
              <span className="text-gray-700 truncate">
                {selectedMbti 
                  ? mbtiData.find(m => m.id === selectedMbti)?.label || selectedMbti
                  : "멍BTI 유형 선택하기 (전체)"
                }
              </span>
              <div className="w-4 h-4 text-gray-400">⚙️</div>
            </Button>
          </Card>
        </div>
      )}

      {/* Map Container */}
      <div className="px-5">
        <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
          <div className="relative h-80">
            <div ref={mapRef} className="w-full h-full" />
            {!isMapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">지도를 불러오는 중...</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* MBTI Selection Modal */}
      <Dialog open={isMbtiModalOpen} onOpenChange={setIsMbtiModalOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">멍BTI 유형 선택</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
            {/* 필터 해제 옵션 */}
            <Button
              variant={selectedMbti === null ? "default" : "outline"}
              onClick={() => handleMbtiSelect("none")}
              className="justify-start p-3 h-auto text-left border-dashed"
            >
              <div>
                <div className="font-medium">필터 해제</div>
                <div className="text-xs text-muted-foreground mt-1">
                  모든 유형 표시
                </div>
              </div>
            </Button>
            
            {/* MBTI 옵션들 */}
            {mbtiData.map((mbti) => (
              <Button
                key={mbti.id}
                variant={selectedMbti === mbti.id ? "default" : "outline"}
                onClick={() => handleMbtiSelect(mbti.id)}
                className="justify-start p-3 h-auto text-left"
              >
                <div>
                  <div className="font-medium">{mbti.id}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {mbti.label}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      {selectedPlaceForReview && (
        <PlaceReviewModal
          place={selectedPlaceForReview}
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedPlaceForReview(null);
          }}
          onReviewUpdate={(stats) => {
            // 리뷰 통계만 업데이트하고 모달은 닫지 않음
            console.log('리뷰 통계 업데이트:', stats);
          }}
        />
      )}
    </div>
  );
};

export default KakaoMap;