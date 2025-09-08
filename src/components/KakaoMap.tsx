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

  // 카테고리별 필터링
  const categories = [
    { id: "all", label: "전체", icon: MapPin },
    { id: "park", label: "공원", icon: TreePine },
    { id: "leisure", label: "레저", icon: Dumbbell },
    { id: "culture", label: "문화시설", icon: Building2 },
    { id: "brunch", label: "브런치", icon: Utensils },
    { id: "temple", label: "사찰", icon: Church },
    { id: "shopping", label: "쇼핑", icon: ShoppingBag },
    { id: "accommodation", label: "숙소", icon: Bed },
    { id: "restaurant", label: "식당", icon: UtensilsCrossed },
    { id: "market", label: "재래시장", icon: Store },
    { id: "cafe", label: "카페", icon: Coffee },
    { id: "theme-street", label: "테마거리", icon: MapPin },
    { id: "trekking", label: "트레킹", icon: Mountain },
    { id: "port", label: "항구", icon: Anchor },
    { id: "beach", label: "해수욕장", icon: Waves },
  ];

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

  // 카테고리 선택 핸들러 (locationGubun 기반 필터링)
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);

      if (showPetFilter && allPetData.length > 0) {
        console.log(`=== 카테고리 선택: ${categoryId} ===`);
        console.log("전체 데이터 개수:", allPetData.length);

        // 🔥 핵심: 모든 기존 마커들 완전히 제거
        setPetTourismMarkers((prevMarkers) => {
          prevMarkers.forEach((marker) => marker.setMap(null));
          return [];
        });
        
        // 일반 검색 마커 제거
        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = [];
        
        // 클러스터러 초기화
        if (clusterer.current) {
          clusterer.current.clear();
        }

        let filteredPlaces = [];

        if (categoryId === "all") {
          filteredPlaces = allPetData;
          console.log(`전체 데이터: ${allPetData.length}개`);
          
          // 전체 카테고리 선택 시 MBTI 필터 무시
          console.log("🔄 전체 카테고리 선택 - MBTI 필터 무시");
        } else {
      // locationGubun 기반 필터링 - sample-data.ts의 실제 값들 사용
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

          const targetLocationGubun =
            locationGubunMap[categoryId as keyof typeof locationGubunMap];

          if (targetLocationGubun) {
            console.log(
              `${categoryId} 카테고리 -> locationGubun: ${targetLocationGubun}`
            );

            filteredPlaces = allPetData.filter(
              (place) => place.locationGubun === targetLocationGubun
            );

            console.log(`locationGubun 매칭 결과: ${filteredPlaces.length}개`);

            // 매칭되지 않은 데이터 확인
            if (filteredPlaces.length === 0) {
              console.log("매칭되지 않은 데이터들의 locationGubun:");
              allPetData.slice(0, 10).forEach((place) => {
                console.log(
                  `- "${place.title}" -> locationGubun: "${place.locationGubun}"`
                );
              });
            }
          }
        }

        // MBTI 필터링 추가 적용 (전체 카테고리가 아닐 때만)
        if (selectedMbti && filteredPlaces.length > 0 && categoryId !== "all") {
          console.log(`MBTI 필터 적용: ${selectedMbti}`);
          filteredPlaces = filteredPlaces.filter((place) => {
            if (!place.mbti) return false;

            if (place.mbti === "all") return true;

            if (Array.isArray(place.mbti)) {
              return place.mbti.includes(selectedMbti);
            }

            return place.mbti === selectedMbti;
          });
          console.log(`MBTI 필터링 후: ${filteredPlaces.length}개`);
        }

        console.log(`필터링된 장소 ${filteredPlaces.length}개`);

        // 🔥 핵심: 새로운 마커들만 생성
        const newMarkers: any[] = [];

        filteredPlaces.forEach((place, index) => {
          console.log(`🔍 마커 생성 시도 ${index + 1}: ${place.title} (${place.mapx}, ${place.mapy})`);
          
          if (
            !place.mapx ||
            !place.mapy ||
            place.mapx === "0" ||
            place.mapy === "0"
          ) {
            console.log(`❌ 좌표 없음: ${place.title}`);
            return;
          }

          try {
            const position = new window.kakao.maps.LatLng(place.mapy, place.mapx);

            const imageSize = new window.kakao.maps.Size(30, 30);
            const imageOption = { offset: new window.kakao.maps.Point(15, 30) };

            const redMarkerSvg = `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#DC2626" width="30" height="30">
              <circle cx="12" cy="12" r="11" fill="white" stroke="#DC2626" stroke-width="2"/>
              <path d="M8 10c0-1.1.9-2 2-2s2 .9 2 2-2 3-2 3-2-1.9-2-3zm6 0c0-1.1.9-2 2-2s2 .9 2 2-2 3-2 3-2-1.9-2-3z" fill="#FFFFFF"/>
              <circle cx="10" cy="10" r="1.5" fill="#000"/>
              <circle cx="14" cy="10" r="1.5" fill="#000"/>
              <path d="M12 13c-1 0-2 .5-2 1s1 1 2 1 2-.5 2-1-.5-1-2-1z" fill="#000"/>
            </svg>
          `)}`;

            const markerImage = new window.kakao.maps.MarkerImage(
              redMarkerSvg,
              imageSize,
              imageOption
            );

            const marker = new window.kakao.maps.Marker({
              position: position,
              image: markerImage,
              clickable: true,
            });

            marker.setMap(mapInstance.current);
            newMarkers.push(marker);
            console.log(`✅ 마커 생성 성공: ${place.title}`);

            // 마커 클릭 이벤트
            window.kakao.maps.event.addListener(marker, "click", () => {
              const content = `
              <div style="padding: 15px; min-width: 280px; max-width: 320px; font-family: 'Malgun Gothic', sans-serif; position: relative;">
                <button onclick="window.closeInfoWindow()" style="position: absolute; top: 8px; right: 8px; background: #f3f4f6; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; color: #6b7280;">×</button>
                
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #DC2626; padding-right: 30px;">${
                  place.title
                }</div>
                
                <div style="font-size: 12px; color: #666; margin-bottom: 8px; background: #FEF2F2; padding: 4px 8px; border-radius: 12px; display: inline-block;">
                  🐾 반려동물 동반 가능
                </div>
                
                ${
                  place.locationGubun
                    ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px; background: #F3F4F6; padding: 4px 8px; border-radius: 12px; display: inline-block;">
                  📍 ${place.locationGubun}
                </div>`
                    : ""
                }
                
                <div style="font-size: 13px; color: #333; margin-bottom: 6px;">${
                  place.addr1
                }</div>
                ${
                  place.addr2
                    ? `<div style="font-size: 12px; color: #666; margin-bottom: 6px;">${place.addr2}</div>`
                    : ""
                }
                ${
                  place.tel
                    ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px;">📞 ${place.tel}</div>`
                    : ""
                }
                
                <div style="text-align: center;">
                  <button id="review-btn-${place.contentid}" 
                     style="color: #DC2626; font-size: 12px; text-decoration: none; background: #FEF2F2; padding: 6px 12px; border-radius: 8px; display: inline-block; border: 1px solid #FCA5A5; cursor: pointer;">
                    ⭐ 평점 및 후기
                  </button>
                </div>
              </div>
            `;
              infoWindow.current.setContent(content);
              infoWindow.current.open(mapInstance.current, marker);

              // 정보창 닫기 함수를 전역에 등록
              (window as any).closeInfoWindow = () => {
                infoWindow.current.close();
              };

              // 평점/후기 버튼 이벤트 리스너 추가
              setTimeout(() => {
                const reviewBtn = document.getElementById(
                  `review-btn-${place.contentid}`
                );
                if (reviewBtn) {
                  reviewBtn.addEventListener("click", () => {
                    setSelectedPlaceForReview(place);
                    setIsReviewModalOpen(true);
                  });
                }
              }, 100);
            });
          } catch (error) {
            console.error(`❌ 마커 생성 실패: ${place.title}`, error);
          }
        });

        // 🔥 핵심: 상태를 완전히 새 배열로 교체 (중복 방지)
        setPetTourismMarkers(newMarkers);

        const categoryLabels = {
          all: "전체",
          park: "공원",
          leisure: "레저",
          culture: "문화시설",
          brunch: "브런치",
          temple: "사찰",
          shopping: "쇼핑",
          accommodation: "숙소",
          restaurant: "식당",
          market: "재래시장",
          cafe: "카페",
          "theme-street": "테마거리",
          trekking: "트레킹",
          port: "항구",
          beach: "해수욕장",
        };

        toast.success(
          `${
            categoryLabels[categoryId as keyof typeof categoryLabels] ||
            categoryId
          } ${filteredPlaces.length}개를 지도에 표시했습니다.`
        );
      }
    },
    [showPetFilter, allPetData, selectedMbti]
  );

  // MBTI 필터링만 별도로 적용하는 함수
  const applyMbtiFilter = useCallback(() => {
    if (!showPetFilter || allPetData.length === 0) return;
    
    console.log(`🔍 MBTI 필터링 시작: selectedMbti=${selectedMbti}, selectedCategory=${selectedCategory}`);
    
    // 기존 마커들 제거
    setPetTourismMarkers((prevMarkers) => {
      prevMarkers.forEach((marker) => marker.setMap(null));
      return [];
    });
    
    let filteredPlaces = [];
    
    // 먼저 카테고리로 필터링
    if (selectedCategory === "all") {
      filteredPlaces = [...allPetData];
      console.log(`전체 카테고리: ${filteredPlaces.length}개`);
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
      
      const targetLocationGubun = locationGubunMap[selectedCategory as keyof typeof locationGubunMap];
      
      if (targetLocationGubun) {
        console.log(`🔍 카테고리 매칭:`, {
          선택한카테고리: selectedCategory,
          찾는locationGubun: targetLocationGubun,
          전체데이터수: allPetData.length
        });
        
        filteredPlaces = allPetData.filter(place => {
          const isMatch = place.locationGubun === targetLocationGubun;
          if (!isMatch && allPetData.indexOf(place) < 3) {
            console.log(`❌ 매칭 실패:`, {
              장소명: place.title,
              실제locationGubun: place.locationGubun,
              찾는locationGubun: targetLocationGubun
            });
          }
          return isMatch;
        });
        
        console.log(`✅ ${selectedCategory} 카테고리 필터링: ${filteredPlaces.length}개`);
        
        if (filteredPlaces.length === 0) {
          console.log("⚠️ 필터링 결과가 0개입니다. 실제 데이터의 locationGubun 값들:");
          const uniqueLocationGubuns = [...new Set(allPetData.map(p => p.locationGubun))];
          console.log(uniqueLocationGubuns);
        }
      }
    }
    
    // MBTI 필터링 (전체 카테고리가 아닐 때만 적용)
    if (selectedMbti && selectedCategory !== "all") {
      console.log(`MBTI 필터 적용: ${selectedMbti}`);
      const beforeCount = filteredPlaces.length;
      filteredPlaces = filteredPlaces.filter((place) => {
        // place.mbti가 없으면 제외
        if (!place.mbti) return false;
        
        // place.mbti가 "all"이면 모든 MBTI에 해당하므로 포함
        if (place.mbti === "all") return true;
        
        // place.mbti가 배열이면 selectedMbti가 포함되어 있는지 확인
        if (Array.isArray(place.mbti)) {
          return place.mbti.includes(selectedMbti);
        }
        
        // place.mbti가 문자열이면 정확히 매치하는지 확인
        return place.mbti === selectedMbti;
      });
      console.log(`MBTI 필터링: ${beforeCount}개 → ${filteredPlaces.length}개`);
    }
    
    // 마커 생성
    const newMarkers: any[] = [];
    filteredPlaces.forEach((place) => {
      if (!place.mapx || !place.mapy || place.mapx === "0" || place.mapy === "0") return;
      
      const position = new window.kakao.maps.LatLng(place.mapy, place.mapx);
      const imageSize = new window.kakao.maps.Size(30, 30);
      const imageOption = { offset: new window.kakao.maps.Point(15, 30) };
      
      const redMarkerSvg = `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#DC2626" width="30" height="30">
          <circle cx="12" cy="12" r="11" fill="white" stroke="#DC2626" stroke-width="2"/>
          <path d="M8 10c0-1.1.9-2 2-2s2 .9 2 2-2 3-2 3-2-1.9-2-3zm6 0c0-1.1.9-2 2-2s2 .9 2 2-2 3-2 3-2-1.9-2-3z" fill="#FFFFFF"/>
          <circle cx="10" cy="10" r="1.5" fill="#000"/>
          <circle cx="14" cy="10" r="1.5" fill="#000"/>
          <path d="M12 13c-1 0-2 .5-2 1s1 1 2 1 2-.5 2-1-.5-1-2-1z" fill="#000"/>
        </svg>
      `)}`;
      
      const markerImage = new window.kakao.maps.MarkerImage(redMarkerSvg, imageSize, imageOption);
      const marker = new window.kakao.maps.Marker({
        position: position,
        image: markerImage,
        clickable: true,
      });
      
      marker.setMap(mapInstance.current);
      newMarkers.push(marker);
      
      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, "click", () => {
        const content = `
          <div style="padding: 15px; min-width: 280px; max-width: 320px; font-family: 'Malgun Gothic', sans-serif; position: relative;">
            <button onclick="window.closeInfoWindow()" style="position: absolute; top: 8px; right: 8px; background: #f3f4f6; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; color: #6b7280;">×</button>
            
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #DC2626; padding-right: 30px;">${place.title}</div>
            
            <div style="font-size: 12px; color: #666; margin-bottom: 8px; background: #FEF2F2; padding: 4px 8px; border-radius: 12px; display: inline-block;">
              🐾 반려동물 동반 가능
            </div>
            
            ${place.locationGubun ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px; background: #F3F4F6; padding: 4px 8px; border-radius: 12px; display: inline-block;">📍 ${place.locationGubun}</div>` : ""}
            
            <div style="font-size: 13px; color: #333; margin-bottom: 6px;">${place.addr1}</div>
            ${place.addr2 ? `<div style="font-size: 12px; color: #666; margin-bottom: 6px;">${place.addr2}</div>` : ""}
            ${place.tel ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px;">📞 ${place.tel}</div>` : ""}
            
            <div style="text-align: center;">
              <button id="review-btn-${place.contentid}" 
                 style="color: #DC2626; font-size: 12px; text-decoration: none; background: #FEF2F2; padding: 6px 12px; border-radius: 8px; display: inline-block; border: 1px solid #FCA5A5; cursor: pointer;">
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
        
        setTimeout(() => {
          const reviewBtn = document.getElementById(`review-btn-${place.contentid}`);
          if (reviewBtn) {
            reviewBtn.addEventListener("click", () => {
              setSelectedPlaceForReview(place);
              setIsReviewModalOpen(true);
            });
          }
        }, 100);
      });
    });
    
    setPetTourismMarkers(newMarkers);
    console.log(`✅ 총 ${newMarkers.length}개 마커 생성 완료`);
  }, [selectedCategory, selectedMbti, allPetData, showPetFilter]);

  // MBTI 선택 핸들러 - 수정된 버전
  const handleMbtiSelect = useCallback(
    (mbtiId: string) => {
      console.log(`🧠 MBTI 선택: ${mbtiId}, 현재 카테고리: ${selectedCategory}`);
      
      if (mbtiId === "none") {
        setSelectedMbti(null);
        setIsMbtiModalOpen(false);
        toast.success("멍BTI 필터가 해제되었습니다.");
      } else {
        setSelectedMbti(mbtiId);
        setIsMbtiModalOpen(false);
        toast.success(`${mbtiId} MBTI 필터가 적용되었습니다.`);
      }
      
      // MBTI 변경 후 현재 선택된 카테고리로 다시 필터링
      setTimeout(() => {
        console.log(`🔄 MBTI 변경 후 카테고리 재필터링: ${selectedCategory}`);
        handleCategorySelect(selectedCategory);
      }, 100);
    },
    [selectedCategory, handleCategorySelect]
  );
  
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

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            script.remove();
            console.error(
              "카카오 지도 로딩 타임아웃 - 도메인 등록을 확인하세요"
            );
            reject(new Error("카카오 지도 로딩 타임아웃"));
          }, 15000);

          script.onload = () => {
            clearTimeout(timeout);
            console.log("카카오 스크립트 로드 성공");

            const checkKakao = () => {
              if (window.kakao && window.kakao.maps) {
                console.log("카카오 지도 초기화 시작");
                try {
                  window.kakao.maps.load(() => {
                    if (isMounted) {
                      initializeMap();
                      resolve();
                    }
                  });
                } catch (err) {
                  console.error("카카오 지도 로드 오류:", err);
                  reject(err);
                }
              } else {
                setTimeout(checkKakao, 100);
              }
            };
            checkKakao();
          };

          script.onerror = () => {
            clearTimeout(timeout);
            console.error("카카오 스크립트 로딩 실패");
            reject(new Error("카카오 스크립트 로딩 실패"));
          };

          document.head.appendChild(script);
        });

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

  // petTourismData가 있을 때 데이터 설정
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
    }
  }, [petTourismData, allPetData.length]);

  // 초기 카테고리가 설정되었거나 카테고리가 변경되었을 때 자동으로 마커 로드
  useEffect(() => {
    console.log("🔍 카테고리 자동 로드 체크:", {
      showPetFilter,
      allPetDataLength: allPetData.length,
      selectedCategory,
      isMapLoaded
    });
    
    if (showPetFilter && allPetData.length > 0 && selectedCategory && isMapLoaded) {
      console.log(`✅ 카테고리 자동 선택 실행: ${selectedCategory}`);
      handleCategorySelect(selectedCategory);
    }
  }, [selectedCategory, allPetData.length, isMapLoaded, showPetFilter]);

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
                    <div style="padding: 15px; min-width: 250px; max-width: 300px; font-family: 'Malgun Gothic', sans-serif; position: relative;">
                      <button onclick="window.closeInfoWindow()" style="position: absolute; top: 8px; right: 8px; background: #f3f4f6; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; color: #6b7280;">×</button>
                      
                      <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #2563eb; padding-right: 30px;">${place.place_name}</div>
                      
                      <div style="font-size: 12px; color: #666; margin-bottom: 8px; background: #eff6ff; padding: 4px 8px; border-radius: 12px; display: inline-block;">
                        📍 ${place.category_name}
                      </div>
                      
                      <div style="font-size: 13px; color: #333; margin-bottom: 6px;">${place.address_name}</div>
                      ${place.road_address_name ? `<div style="font-size: 12px; color: #666; margin-bottom: 6px;">${place.road_address_name}</div>` : ""}
                      ${place.phone ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px;">📞 ${place.phone}</div>` : ""}
                      
                      ${place.place_url ? `
                        <div style="text-align: center; margin-top: 8px;">
                          <a href="${place.place_url}" target="_blank" style="color: #2563eb; font-size: 12px; text-decoration: none; background: #eff6ff; padding: 6px 12px; border-radius: 8px; display: inline-block; border: 1px solid #93c5fd;">
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

  // 지도와 데이터 모두 로드된 후 자동으로 카테고리 마커 표시
  useEffect(() => {
    if (
      isMapLoaded &&
      showPetFilter &&
      allPetData.length > 0
    ) {
      const targetCategory = propSelectedCategory || initialCategory || "all";
      console.log(
        "🎯 자동으로 카테고리 마커 표시 시작 - 카테고리:",
        targetCategory,
        "데이터 개수:",
        allPetData.length
      );
      setSelectedCategory(targetCategory);
      handleCategorySelect(targetCategory);
    }
  }, [
    isMapLoaded,
    showPetFilter,
    allPetData.length,
    initialCategory,
    propSelectedCategory,
    handleCategorySelect,
  ]);

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
          onReviewUpdate={() => {
            setIsReviewModalOpen(false);
            setSelectedPlaceForReview(null);
          }}
        />
      )}
    </div>
  );
};

export default KakaoMap;