import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Search,
  Phone,
  ExternalLink,
  PawPrint,
  TreePine,
  UtensilsCrossed,
  ShoppingBag,
  Dumbbell,
  Building2,
  Utensils,
  Church,
  Bed,
  Store,
  Coffee,
  Mountain,
  Anchor,
  Waves,
  Stethoscope,
  Star,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import PlaceReviewModal from "@/components/PlaceReviewModal";
import { mbtiData } from "@/data/mbti-data";

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  onBack: () => void;
  hideCategoryGrid?: boolean;
  hideSearchBar?: boolean;
  showPetFilter?: boolean;
  userProfileImage?: string;
  initialCategory?: string | null;
  selectedCategory?: string | null;
  petTourismData?: any[];
  bookmarkedPlaces?: Array<{
    content_id: string;
    title: string;
    mapx: string;
    mapy: string;
    bookmark_type: "general" | "pet";
  }>;
}

const KakaoMap: React.FC<KakaoMapProps> = ({
  onBack,
  hideCategoryGrid = false,
  hideSearchBar = false,
  showPetFilter = false,
  userProfileImage,
  initialCategory = null,
  selectedCategory: propSelectedCategory = null,
  petTourismData = [],
  bookmarkedPlaces = [],
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const clusterer = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const infoWindow = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    propSelectedCategory || initialCategory || "all"
  );

  // props로 전달된 selectedCategory 동기화
  useEffect(() => {
    console.log("🔍 Props selectedCategory 변경:", propSelectedCategory);
    if (propSelectedCategory && propSelectedCategory !== selectedCategory) {
      console.log(`카테고리 동기화: ${selectedCategory} -> ${propSelectedCategory}`);
      setSelectedCategory(propSelectedCategory);
    }
  }, [propSelectedCategory]);

  // 필터링 실행 중 상태 추가
  const [isFiltering, setIsFiltering] = useState(false);

  // 카테고리별 필터링
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
    { id: "temple", label: "사찰", icon: Church },
    { id: "market", label: "재래시장", icon: Store },
    { id: "leisure", label: "레저", icon: Dumbbell },
    { id: "culture", label: "문화시설", icon: Building2 },
    { id: "port", label: "항구", icon: Anchor },
  ];

  // CategoryGrid와 동일한 카테고리 매핑 및 색상
  const getCategoryIcon = (locationGubun: string) => {
    const iconMap: { [key: string]: { bgColor: string; iconColor: string; icon: string } } = {
      "카페": { 
        bgColor: "#ecfeff", 
        iconColor: "#0891b2",
        icon: "Coffee"
      },
      "식당": { 
        bgColor: "#ecfdf5", 
        iconColor: "#059669",
        icon: "UtensilsCrossed"
      },
      "브런치": { 
        bgColor: "#fff7ed", 
        iconColor: "#ea580c",
        icon: "Utensils"
      },
      "숙소": { 
        bgColor: "#eef2ff", 
        iconColor: "#4f46e5",
        icon: "Bed"
      },
      "해수욕장": { 
        bgColor: "#f0f9ff", 
        iconColor: "#0284c7",
        icon: "Waves"
      },
      "공원": { 
        bgColor: "#f0fdf4", 
        iconColor: "#16a34a",
        icon: "TreePine"
      },
      "트레킹": { 
        bgColor: "#fafaf9", 
        iconColor: "#57534e",
        icon: "Mountain"
      },
      "테마거리": { 
        bgColor: "#f0fdfa", 
        iconColor: "#0d9488",
        icon: "MapPin"
      },
      "쇼핑": { 
        bgColor: "#fdf2f8", 
        iconColor: "#db2777",
        icon: "ShoppingBag"
      },
      "사찰": { 
        bgColor: "#fffbeb", 
        iconColor: "#d97706",
        icon: "Church"
      },
      "재래시장": { 
        bgColor: "#fefce8", 
        iconColor: "#ca8a04",
        icon: "Store"
      },
      "레저": { 
        bgColor: "#eff6ff", 
        iconColor: "#2563eb",
        icon: "Dumbbell"
      },
      "문화시설": { 
        bgColor: "#faf5ff", 
        iconColor: "#9333ea",
        icon: "Building2"
      },
      "항구": { 
        bgColor: "#f8fafc", 
        iconColor: "#64748b",
        icon: "Anchor"
      }
    };
    
    return iconMap[locationGubun] || { 
      bgColor: "#f8fafc", 
      iconColor: "#64748b", 
      icon: "MapPin"
    };
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

  // 통합된 마커 생성 함수 - 중복 방지 및 90-99개 제한 적용
  const createMarkers = useCallback(
    (categoryId: string, mbtiFilter: string | null = null) => {
      console.log(`🎯 마커 생성 시작: ${categoryId}, MBTI: ${mbtiFilter || 'none'}`);

      if (!showPetFilter || allPetData.length === 0 || !mapInstance.current) {
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
        const locationGubunMap = {
          restaurant: "식당",
          shopping: "쇼핑", 
          brunch: "브런치",
          cafe: "카페",
          park: "공원",
          leisure: "레저",
          culture: "문화시설",
          temple: "사찰",
          accommodation: "숙소",
          market: "재래시장",
          "theme-street": "테마거리",
          trekking: "트레킹",
          port: "항구",
          beach: "해수욕장",
        };

        const targetLocationGubun = locationGubunMap[categoryId as keyof typeof locationGubunMap];
        
        if (targetLocationGubun) {
          filteredPlaces = deduplicatedData.filter(place => place.locationGubun === targetLocationGubun);
          console.log(`✅ ${categoryId} (${targetLocationGubun}) 카테고리 필터링: ${filteredPlaces.length}개`);
          
          // 카페인 경우 상세 로그 추가
          if (categoryId === "cafe") {
            const allCafeData = deduplicatedData.filter(place => place.locationGubun === "카페");
            console.log(`🔍 전체 데이터에서 카페 검색 결과: ${allCafeData.length}개`);
            console.log(`☕ 카페 데이터 목록:`, allCafeData.map(p => ({ title: p.title, locationGubun: p.locationGubun })));
          }
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
          }
          
          return place.mbti === mbtiFilter;
        });
        
        console.log(`✅ MBTI 필터링: ${beforeCount}개 → ${finalPlaces.length}개`);
      }

      // 4단계: 90-99개 제한 엄격 적용
      if (categoryId === "all" && !mbtiFilter) {
        const dataCount = finalPlaces.length;
        if (dataCount < 90 || dataCount > 99) {
          console.error(`❌ 데이터 개수 오류: ${dataCount}개 (정상 범위: 90-99개)`);
          toast.error(`데이터 오류: ${dataCount}개 표시됨 (정상: 90-99개)`);
          setIsFiltering(false);
          return;
        }
      }

      // 5단계: 마커 생성
      const newMarkers: any[] = [];
      let markerCount = 0;
      
      finalPlaces.forEach((place, index) => {
        if (!place.mapx || !place.mapy || place.mapx === "0" || place.mapy === "0") {
          return;
        }

        try {
          const position = new window.kakao.maps.LatLng(place.mapy, place.mapx);
          const imageSize = new window.kakao.maps.Size(32, 32);
          const imageOption = { offset: new window.kakao.maps.Point(16, 32) };

          // 카테고리별 아이콘 가져오기
          const categoryIcon = getCategoryIcon(place.locationGubun || "");
          
          // Lucide 아이콘 SVG paths
          const iconPaths: { [key: string]: string } = {
            Coffee: "M17 8h1a4 4 0 1 1 0 8h-1m-3-8h.01M12 8h0l0 0v8l0 0M8 8h0l0 0v8l0 0m-3 0V8a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z",
            UtensilsCrossed: "m16 2-2.3 2.3a3 3 0 0 0 0 4.2L16 11l5-5-1.4-1.4a3 3 0 0 0-4.2 0L16 2zm-10 15.5 7.5 7.5c.83.83 2.17.83 3 0l7.5-7.5-10.5-10.5L6 14.5z",
            Utensils: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2m7 0v20l-2-2v-6m0-6.5L18 9",
            Bed: "M2 4v16m2-8h16M7 4v16m10-16v16M5 9h1M5 14h1m12-5h1m-1 5h1",
            Waves: "M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
            TreePine: "m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 2l4 5.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z",
            Mountain: "m8 3 4 8 5-5v7H5V8l3-5Z",
            MapPin: "M20 10c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 3-3 3ZM4 10c2 0 3-1 3-3S6 4 4 4s-3 1-3 3 1 3 3 3Zm16 6-1.5-1.5L15 18l-3-3-1.5 1.5L12 18l-3-3L7.5 16.5 9 18l-3 3 1.5 1.5L9 21l3 3 1.5-1.5L12 21l3 3Z",
            ShoppingBag: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zm0 2h12l2 2v2H4V6l2-2zm2 4a1 1 0 1 0 0 2c1.66 0 3 1.34 3 3a1 1 0 1 0 2 0c0-2.76-2.24-5-5-5z",
            Church: "M18 2h3v20H3V2h3m1 2v16h8V4H7zm2 2h4v2H9V6zm0 4h4v2H9v-2zm0 4h4v2H9v-2z",
            Store: "m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4",
            Dumbbell: "M14.4 14.4 9.6 9.6m8.9-2.1a5.1 5.1 0 1 1-7.2 0 5.1 5.1 0 0 1 7.2 0ZM15 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm1.5 6.5 3 3 3-3-1.5-1.5-1.5 1.5-1.5-1.5-1.5 1.5Z",
            Building2: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Zm1-6h2m0 0h2m-2 0v2m0-2v-2m5-4h2m-2 0v2m0-2v-2m0-2V4",
            Anchor: "M12 8V2H8l4 6 4-6h-4zm-1 1v3l-6 4 2.5 1.5L12 15l4.5 2.5L19 16l-6-4V9h-2z"
          };
          
          const iconPath = iconPaths[categoryIcon.icon] || iconPaths.MapPin;
          
          const svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                </filter>
              </defs>
              <circle cx="16" cy="16" r="14" fill="${categoryIcon.bgColor}" stroke="white" stroke-width="2" filter="url(#shadow)"/>
              <g transform="translate(8, 8)">
                <path d="${iconPath}" fill="none" stroke="${categoryIcon.iconColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
            </svg>
          `;
          const categoryMarkerSvg = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;

          const markerImage = new window.kakao.maps.MarkerImage(categoryMarkerSvg, imageSize, imageOption);
          const marker = new window.kakao.maps.Marker({
            position: position,
            image: markerImage,
            clickable: true,
          });

          marker.setMap(mapInstance.current);
          newMarkers.push(marker);
          markerCount++;

          // 마커 클릭 이벤트
          window.kakao.maps.event.addListener(marker, "click", () => {
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
            infoWindow.current.open(mapInstance.current, marker);

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

      setPetTourismMarkers(newMarkers);
      console.log(`🎯 최종 마커 생성 완료: ${markerCount}개`);
      
      // 토스트 메시지
      const categoryLabels = {
        all: "전체",
        restaurant: "식당",
        shopping: "쇼핑", 
        brunch: "브런치",
        cafe: "카페",
        park: "공원",
        leisure: "레저",
        culture: "문화시설",
        temple: "사찰",
        accommodation: "숙소",
        market: "재래시장",
        "theme-street": "테마거리",
        trekking: "트레킹",
        port: "항구",
        beach: "해수욕장",
      };
      
      if (markerCount > 0) {
        const categoryName = categoryLabels[categoryId as keyof typeof categoryLabels] || categoryId;
        const mbtiText = mbtiFilter ? ` (${mbtiFilter} 필터)` : "";
        toast.success(`${categoryName} ${markerCount}개를 지도에 표시했습니다${mbtiText}`);
      } else {
        toast.warning("해당 조건에 맞는 장소가 없습니다.");
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
      
      setIsFiltering(true);
      setSelectedCategory(categoryId);
      
      createMarkers(categoryId, selectedMbti);
      setIsFiltering(false);
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
        toast.success(`${mbtiId} MBTI 필터가 적용되었습니다.`);
      }
      
      // MBTI 상태가 변경되면 자동으로 useEffect에서 필터링이 재실행됨
    },
    []
  );

  // MBTI가 변경될 때 현재 카테고리로 다시 필터링
  useEffect(() => {
    if (isMapLoaded && showPetFilter && allPetData.length > 0 && selectedCategory && !isFiltering) {
      console.log(`🔄 MBTI 변경으로 인한 재필터링: ${selectedCategory}, MBTI: ${selectedMbti || 'none'}`);
      createMarkers(selectedCategory, selectedMbti);
    }
  }, [selectedMbti, isMapLoaded, showPetFilter, allPetData.length, selectedCategory, createMarkers, isFiltering]);
  
  // 카카오 지도 SDK 로드
  useEffect(() => {
    let isMounted = true;

    const loadKakaoMap = async () => {
      try {
        if (window.kakao && window.kakao.maps) {
          console.log("카카오 지도가 이미 로드되어 있습니다.");
          window.kakao.maps.load(() => {
            if (isMounted) {
              initializeMap();
            }
          });
          return;
        }

        console.log("카카오 API 키 가져오는 중...");
        const { data, error } = await supabase.functions.invoke("test-api-key");

        if (error || !data?.kakaoJsKey) {
          console.error("카카오 API 키 조회 실패:", error);
          toast.error("카카오 지도 API 키를 가져올 수 없습니다.");
          return;
        }

        const KAKAO_JS_KEY = data.kakaoJsKey;
        console.log("카카오 지도 스크립트 로딩 시작...");

        const existingScript = document.querySelector(
          'script[src*="dapi.kakao.com"]'
        );
        if (existingScript) {
          existingScript.remove();
        }

        if (window.kakao) {
          delete window.kakao;
        }

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services,clusterer`;

        document.head.appendChild(script);

        script.onload = () => {
          console.log("✅ 카카오 지도 스크립트 로드 성공");

          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              if (isMounted) {
                console.log("✅ 카카오 지도 초기화 완료");
                initializeMap();
              }
            });
          } else {
            console.error("❌ 카카오 지도 객체를 찾을 수 없습니다");
            toast.error("카카오 지도 초기화에 실패했습니다.");
          }
        };

        script.onerror = () => {
          console.error("❌ 카카오 지도 스크립트 로딩 실패");
          toast.error("카카오 지도를 불러올 수 없습니다.");
        };

        script.onload = () => {
          console.log("✅ 카카오 지도 스크립트 로드 성공");

          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              if (isMounted) {
                console.log("✅ 카카오 지도 초기화 완료");
                initializeMap();
              }
            });
          } else {
            console.error("❌ 카카오 지도 객체를 찾을 수 없습니다");
            toast.error("카카오 지도 초기화에 실패했습니다.");
          }
        };

        script.onerror = () => {
          console.error("❌ 카카오 지도 스크립트 로딩 실패");
          toast.error("카카오 지도를 불러올 수 없습니다.");
        };

        console.log("✅ 카카오 지도 로딩 완료");
      } catch (error) {
        console.error("카카오 지도 로딩 중 예외 발생:", error);
        toast.error(
          "카카오 지도를 불러오는데 실패했습니다. 페이지를 새로고침해 주세요."
        );
      }
    };

    loadKakaoMap();

    return () => {
      isMounted = false;
    };
  }, [initializeMap]);

  // petTourismData가 있을 때 데이터 설정 또는 자체 로드
  useEffect(() => {
    if (petTourismData && petTourismData.length > 0 && allPetData.length === 0) {
      const validData = petTourismData.filter(
        (item: any) => item.mapx && item.mapy && item.mapx !== "0" && item.mapy !== "0"
      );
      setAllPetData(validData);
      console.log(`✅ Props에서 받은 데이터 ${validData.length}개 설정 완료`);
      
      // 데이터 샘플 로그
      if (validData.length > 0) {
        console.log("📋 데이터 샘플:", {
          title: validData[0]?.title,
          locationGubun: validData[0]?.locationGubun,
          mbti: validData[0]?.mbti
        });
        
        // 사용 가능한 locationGubun 값들 확인
        const locationGubuns = [...new Set(validData.map((item: any) => item.locationGubun))];
        console.log("📍 사용 가능한 locationGubun:", locationGubuns);
        
        // 사용 가능한 mbti 값들 확인  
        const mbtis = [...new Set(validData.flatMap((item: any) => 
          Array.isArray(item.mbti) ? item.mbti : [item.mbti]
        ))];
        console.log("🧠 사용 가능한 MBTI:", mbtis);
      }
    } else if (showPetFilter && allPetData.length === 0 && (!petTourismData || petTourismData.length === 0)) {
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
      console.log(`📊 최종 데이터 개수: ${dataCount}개`);

      if (dataCount < 90 || dataCount > 99) {
        console.error(`❌ 비정상적인 데이터 개수 감지: ${dataCount}개 (정상 범위: 90-99개)`);
        toast.error(`데이터 오류: 예상 개수(90-99개)와 다른 ${dataCount}개가 로드됨`);
        return;
      }

      setAllPetData(validData);
      console.log(`✅ 지도에서 자체 로드한 데이터 ${validData.length}개 설정 완료`);
      
      // 전체 데이터에서 "all" MBTI 확인
      const finalAllMbtiPlaces = validData.filter((item: any) => item.mbti === 'all');
      console.log(`🔥 최종 "all" MBTI 장소들: ${finalAllMbtiPlaces.length}개`, finalAllMbtiPlaces.map((p: any) => p.title));
      
      toast.success(`반려동물 여행지 ${validData.length}개를 불러왔습니다!`);
      
    } catch (error) {
      console.error('반려동물 데이터 로드 중 오류:', error);
    }
  };

  // 초기 카테고리 자동 로드 (중복 실행 방지)
  useEffect(() => {
    if (showPetFilter && allPetData.length > 0 && selectedCategory && isMapLoaded && !isFiltering) {
      console.log(`✅ 초기 카테고리 자동 로드: ${selectedCategory}`);
      createMarkers(selectedCategory, selectedMbti);
    }
  }, [allPetData.length, isMapLoaded, showPetFilter, createMarkers, selectedMbti, selectedCategory, isFiltering]);

  // 카카오맵 장소 검색
  const searchPlaces = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.warning("검색어를 입력해주세요.");
      return;
    }

    if (!mapInstance.current) {
      toast.error("지도가 로드되지 않았습니다.");
      return;
    }

    setLoading(true);

    try {
      // 카카오맵 장소 검색 서비스 사용
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        const ps = new window.kakao.maps.services.Places();

        // 현재 지도 중심 좌표
        const center = mapInstance.current.getCenter();
        const searchOptions = {
          location: center,
          radius: 10000, // 10km 반경
          size: 15,
        };

        ps.keywordSearch(
          searchQuery,
          (data: any[], status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              // 기존 검색 마커 제거
              markers.current.forEach((marker) => marker.setMap(null));
              markers.current = [];

              // 새 마커 추가
              data.forEach((place: any) => {
                const position = new window.kakao.maps.LatLng(place.y, place.x);
                
                const marker = new window.kakao.maps.Marker({
                  position: position,
                  clickable: true,
                });

                marker.setMap(mapInstance.current);
                markers.current.push(marker);

                // 마커 클릭 이벤트
                window.kakao.maps.event.addListener(marker, "click", () => {
                  const content = `
                    <div style="padding: 12px; min-width: 200px; max-width: 240px; font-family: 'Malgun Gothic', sans-serif; position: relative;">
                      <button onclick="window.closeInfoWindow()" style="position: absolute; top: 6px; right: 6px; background: #f3f4f6; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; color: #6b7280;">×</button>
                      
                      <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; color: #2563eb; padding-right: 26px; line-height: 1.2;">${place.place_name}</div>
                      
                      <div style="font-size: 10px; color: #666; margin-bottom: 6px; background: #eff6ff; padding: 3px 6px; border-radius: 8px; display: inline-block;">
                        📍 ${place.category_name}
                      </div>
                      
                      <div style="font-size: 11px; color: #333; margin-bottom: 4px; line-height: 1.2;">${place.address_name}</div>
                      ${place.road_address_name ? `<div style="font-size: 10px; color: #666; margin-bottom: 4px;">${place.road_address_name}</div>` : ""}
                      ${place.phone ? `<div style="font-size: 10px; color: #666; margin-bottom: 6px;">📞 ${place.phone}</div>` : ""}
                      
                      ${place.place_url ? `
                        <div style="text-align: center; margin-top: 6px;">
                          <a href="${place.place_url}" target="_blank" style="color: #2563eb; font-size: 10px; text-decoration: none; background: #eff6ff; padding: 4px 8px; border-radius: 6px; display: inline-block; border: 1px solid #93c5fd;">
                            🔗 카카오맵에서 보기
                          </a>
                        </div>
                      ` : ""}
                    </div>
                  `;
                  infoWindow.current.setContent(content);
                  infoWindow.current.open(mapInstance.current, marker);

                  // 정보창 닫기 함수를 전역에 등록
                  (window as any).closeInfoWindow = () => {
                    infoWindow.current.close();
                  };
                });
              });

              // 첫 번째 검색 결과로 지도 이동
              if (data.length > 0) {
                const firstPlace = data[0];
                const moveLatLng = new window.kakao.maps.LatLng(firstPlace.y, firstPlace.x);
                mapInstance.current.panTo(moveLatLng);
                mapInstance.current.setLevel(3);
              }

              toast.success(`${data.length}개의 장소를 찾았습니다.`);
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
              toast.warning("검색 결과가 없습니다.");
            } else {
              toast.error("검색 중 오류가 발생했습니다.");
            }
          },
          searchOptions
        );
      }
    } catch (error) {
      console.error("장소 검색 오류:", error);
      toast.error("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // 검색 키 이벤트
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchPlaces();
    }
  };


  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-20">
      {/* Header */}
      <header className="header p-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-foreground hover:bg-muted p-2"
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