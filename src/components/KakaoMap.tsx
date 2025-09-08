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

interface Place {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  x: string;
  y: string;
  distance: string;
  source?: "kakao" | "tourism" | "pet_tourism";
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
    initialCategory || "all"
  );

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

  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState("2000");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showMobileList, setShowMobileList] = useState(false);
  const [petTourismMarkers, setPetTourismMarkers] = useState<any[]>([]);
  const [generalAsPetMarkers, setGeneralAsPetMarkers] = useState<any[]>([]);
  const [showPetMarkers, setShowPetMarkers] = useState(true);
  const [bookmarkMarkers, setBookmarkMarkers] = useState<any[]>([]);
  const [isPetDataLoaded, setIsPetDataLoaded] = useState(false);
  const [allPetData, setAllPetData] = useState<any[]>([]);
  const [selectedPlaceForReview, setSelectedPlaceForReview] =
    useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedMbti, setSelectedMbti] = useState<string | null>(null);
  const [isMbtiModalOpen, setIsMbtiModalOpen] = useState(false);

  // 즐겨찾기 장소 마커 표시 함수
  const displayBookmarkedMarkers = useCallback(() => {
    if (
      !mapInstance.current ||
      !bookmarkedPlaces ||
      bookmarkedPlaces.length === 0
    )
      return;

    console.log("즐겨찾기 마커 표시:", bookmarkedPlaces.length, "개");

    // 기존 마커 제거
    markers.current.forEach((marker) => marker.setMap(null));
    markers.current = [];

    if (clusterer.current) {
      clusterer.current.clear();
    }

    const bounds = new window.kakao.maps.LatLngBounds();
    const newMarkers: any[] = [];

    bookmarkedPlaces.forEach((place) => {
      if (
        !place.mapx ||
        !place.mapy ||
        place.mapx === "0" ||
        place.mapy === "0"
      )
        return;

      const position = new window.kakao.maps.LatLng(place.mapy, place.mapx);
      bounds.extend(position);

      const imageSize = new window.kakao.maps.Size(30, 30);
      const imageOption = { offset: new window.kakao.maps.Point(15, 30) };

      // 즐겨찾기 타입에 따라 다른 색상의 마커
      const markerColor = place.bookmark_type === "pet" ? "#DC2626" : "#2563EB";
      const markerIcon = place.bookmark_type === "pet" ? "🐾" : "📍";

      const bookmarkMarkerSvg = `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${markerColor}" width="30" height="30">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `)}`;

      const markerImage = new window.kakao.maps.MarkerImage(
        bookmarkMarkerSvg,
        imageSize,
        imageOption
      );

      const marker = new window.kakao.maps.Marker({
        position: position,
        image: markerImage,
        clickable: true,
      });

      marker.setMap(mapInstance.current);

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, "click", () => {
        const content = `
          <div style="padding: 15px; min-width: 250px; max-width: 300px; font-family: 'Malgun Gothic', sans-serif;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: ${markerColor};">${
          place.title
        }</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 8px; background: ${
              place.bookmark_type === "pet" ? "#FEF2F2" : "#EFF6FF"
            }; padding: 4px 8px; border-radius: 12px; display: inline-block;">
              ${markerIcon} ${
          place.bookmark_type === "pet" ? "반려동물 동반 가능" : "일반 관광지"
        }
            </div>
            <div style="text-align: center; margin-top: 10px;">
              <button id="review-btn-${place.content_id}" 
                 style="color: ${markerColor}; font-size: 12px; text-decoration: none; background: ${
          place.bookmark_type === "pet" ? "#FEF2F2" : "#EFF6FF"
        }; padding: 6px 12px; border-radius: 8px; display: inline-block; border: 1px solid ${
          place.bookmark_type === "pet" ? "#FCA5A5" : "#93C5FD"
        }; cursor: pointer;">
                ⭐ 평점 및 후기
              </button>
            </div>
          </div>
        `;
        infoWindow.current.setContent(content);
        infoWindow.current.open(mapInstance.current, marker);

        // 평점/후기 버튼 이벤트 리스너 추가
        setTimeout(() => {
          const reviewBtn = document.getElementById(
            `review-btn-${place.content_id}`
          );
          if (reviewBtn) {
            reviewBtn.addEventListener("click", () => {
              setSelectedPlaceForReview({
                contentid: place.content_id,
                title: place.title,
              });
              setIsReviewModalOpen(true);
            });
          }
        }, 100);
      });

      newMarkers.push(marker);
    });

    markers.current = newMarkers;

    // 지도 영역을 모든 마커가 보이도록 조정
    if (newMarkers.length > 0) {
      mapInstance.current.setBounds(bounds);
    }

    toast.success(
      `즐겨찾기 ${bookmarkedPlaces.length}개를 지도에 표시했습니다.`
    );
  }, [bookmarkedPlaces]);

  // 카테고리 선택 핸들러 (locationGubun 기반 필터링)
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);

      if (showPetFilter && allPetData.length > 0) {
        console.log(`=== 카테고리 선택: ${categoryId} ===`);
        console.log("전체 데이터 개수:", allPetData.length);

        // 🔥 핵심: 모든 기존 마커들 완전히 제거
        // 반려동물 관광지 마커 제거
        setPetTourismMarkers((prevMarkers) => {
          prevMarkers.forEach((marker) => marker.setMap(null));
          return [];
        });
        
        // 일반 검색 마커 제거
        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = [];
        
        // 일반->반려동물 마커 제거
        setGeneralAsPetMarkers((prevMarkers) => {
          prevMarkers.forEach((marker) => marker.setMap(null));
          return [];
        });
        
        // 북마크 마커 제거
        setBookmarkMarkers((prevMarkers) => {
          prevMarkers.forEach((marker) => marker.setMap(null));
          return [];
        });
        
        // 클러스터러 초기화
        if (clusterer.current) {
          clusterer.current.clear();
        }

        let filteredPlaces = [];

        if (categoryId === "all") {
          filteredPlaces = allPetData;
          console.log(`전체 데이터: ${allPetData.length}개`);
        } else {
          // locationGubun 기반 필터링
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

        // MBTI 필터링 추가 적용
        if (selectedMbti && filteredPlaces.length > 0) {
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

        filteredPlaces.forEach((place) => {
          if (
            !place.mapx ||
            !place.mapy ||
            place.mapx === "0" ||
            place.mapy === "0"
          )
            return;

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

          // 마커 클릭 이벤트
          window.kakao.maps.event.addListener(marker, "click", () => {
            // MBTI 정보 포맷팅
            let mbtiDisplay = "";
            if (place.mbti) {
              if (Array.isArray(place.mbti)) {
                mbtiDisplay = place.mbti.join(", ");
              } else if (place.mbti === "all") {
                mbtiDisplay = "모든 MBTI";
              } else {
                mbtiDisplay = place.mbti;
              }
            }

            const content = `
            <div style="padding: 15px; min-width: 280px; max-width: 320px; font-family: 'Malgun Gothic', sans-serif;">
              <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #DC2626;">${
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
              
              ${
                mbtiDisplay
                  ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px; background: #EFF6FF; padding: 4px 8px; border-radius: 12px; display: inline-block;">
                🧠 MBTI: ${mbtiDisplay}
              </div>`
                  : ""
              }
              
              ${
                place.holiday
                  ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px; background: #FEF3C7; padding: 4px 8px; border-radius: 12px; display: inline-block;">
                🗓️ 휴무일: ${place.holiday}
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

          newMarkers.push(marker);
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

  // prop으로 받은 selectedCategory 변경 시 내부 상태 업데이트
  useEffect(() => {
    if (propSelectedCategory && propSelectedCategory !== selectedCategory) {
      setSelectedCategory(propSelectedCategory);
      // 즉시 카테고리 필터링 적용
      if (showPetFilter && allPetData.length > 0) {
        handleCategorySelect(propSelectedCategory);
      }
    }
  }, [propSelectedCategory, selectedCategory, showPetFilter, allPetData.length, handleCategorySelect]);

  // MBTI 선택 핸들러
  const handleMbtiSelect = useCallback(
    (mbtiId: string) => {
      setSelectedMbti(mbtiId);
      setIsMbtiModalOpen(false);

      // 현재 선택된 카테고리로 다시 필터링
      handleCategorySelect(selectedCategory);

      toast.success(`${mbtiId} MBTI 필터가 적용되었습니다.`);
    },
    [selectedCategory, handleCategorySelect]
  );

  // MBTI 필터 초기화
  const clearMbtiFilter = useCallback(() => {
    setSelectedMbti(null);
    handleCategorySelect(selectedCategory);
    toast.success("MBTI 필터가 해제되었습니다.");
  }, [selectedCategory, handleCategorySelect]);

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
              setIsMapLoaded(true);
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
                      setIsMapLoaded(true);
                      resolve();
                    }
                  });
                } catch (error) {
                  console.error("카카오 지도 초기화 오류:", error);
                  reject(error);
                }
              } else {
                setTimeout(checkKakao, 100);
              }
            };

            checkKakao();
          };

          script.onerror = (event) => {
            clearTimeout(timeout);
            script.remove();
            console.error(
              "카카오 지도 스크립트 로드 실패 - 카카오 개발자 콘솔에서 도메인 등록을 확인하세요:",
              window.location.origin
            );
            toast.error(
              "카카오 지도를 불러올 수 없습니다. 도메인 등록을 확인해주세요."
            );
            reject(new Error("도메인 미등록으로 인한 카카오 지도 로드 실패"));
          };

          document.head.appendChild(script);
        });
      } catch (error) {
        console.error("카카오 지도 로드 실패:", error);
        if (isMounted) {
          toast.error(
            `지도 로드 실패: ${error.message}. 페이지를 새로고침해주세요.`
          );
        }
      }
    };

    loadKakaoMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // 지도 초기화
  const initializeMap = useCallback(() => {
    if (!mapRef.current) {
      console.error("지도 초기화 실패: mapRef가 없습니다.");
      return;
    }

    if (!window.kakao || !window.kakao.maps) {
      console.error("지도 초기화 실패: Kakao Maps API가 로드되지 않았습니다.");
      toast.error("지도 초기화에 실패했습니다.");
      return;
    }

    try {
      if (mapInstance.current) {
        console.log("기존 지도 인스턴스 정리");
        mapInstance.current = null;
      }

      const options = {
        center: new window.kakao.maps.LatLng(35.1796, 129.0756),
        level: 5,
      };

      mapInstance.current = new window.kakao.maps.Map(mapRef.current, options);
      console.log("지도 인스턴스 생성 완료");

      if (clusterer.current) {
        clusterer.current.clear();
        clusterer.current = null;
      }

      if (
        window.kakao.maps.MarkerClusterer &&
        typeof window.kakao.maps.MarkerClusterer === "function"
      ) {
        try {
          clusterer.current = new window.kakao.maps.MarkerClusterer({
            map: mapInstance.current,
            averageCenter: true,
            minLevel: 6,
          });
          console.log("마커 클러스터러 생성 완료");
        } catch (clustererError) {
          console.warn(
            "마커 클러스터러를 사용할 수 없습니다. 일반 마커로 표시됩니다:",
            clustererError
          );
          clusterer.current = null;
        }
      } else {
        console.warn(
          "MarkerClusterer가 로드되지 않았습니다. 일반 마커로 표시됩니다."
        );
        clusterer.current = null;
      }

      if (infoWindow.current) {
        infoWindow.current.close();
      }

      infoWindow.current = new window.kakao.maps.InfoWindow({
        removable: true,
      });
      console.log("인포윈도우 생성 완료");

      toast.success("지도가 성공적으로 로드되었습니다!");

      // 즐겨찾기 장소가 있는 경우 (Records 페이지)
      if (bookmarkedPlaces && bookmarkedPlaces.length > 0) {
        console.log("즐겨찾기 마커 표시 시작");
        setTimeout(() => {
          displayBookmarkedMarkers();
        }, 300);
      }
      // 반려동물 필터가 활성화된 경우 자동으로 데이터 로드
      else if (showPetFilter) {
        setTimeout(() => {
          loadPetTourismMarkers();
        }, 500);
      }
    } catch (error) {
      console.error("지도 초기화 오류:", error);
      toast.error("지도 초기화 중 오류가 발생했습니다.");
    }
  }, [showPetFilter, bookmarkedPlaces]);

  // 반려동물 여행지 데이터 로드
  const loadPetTourismMarkers = useCallback(async () => {
    if (isPetDataLoaded || !mapInstance.current) return;

    console.log("=== 반려동물 여행지 마커 로딩 시작 ===");
    setLoading(true);

    try {
      // Props에서 전달받은 데이터 사용
      if (petTourismData && petTourismData.length > 0) {
        console.log("📊 Props에서 전달받은 데이터 사용:");
        console.log("- 전달받은 데이터 길이:", petTourismData.length);

        // 좌표 없는 데이터 확인
        const validData = petTourismData.filter(
          (item: any) => item.mapx && item.mapy && item.mapx !== "0" && item.mapy !== "0"
        );
        console.log("- 유효한 좌표 데이터:", validData.length);
        console.log("- 좌표 없는 데이터:", petTourismData.length - validData.length);

        // 마커 생성
        const newMarkers: any[] = [];

        validData.forEach((place) => {
          const position = new window.kakao.maps.LatLng(
            parseFloat(place.mapy),
            parseFloat(place.mapx)
          );

          const marker = new window.kakao.maps.Marker({
            position,
            clickable: true,
          });

          marker.setMap(mapInstance.current);

          // 클릭 이벤트
          window.kakao.maps.event.addListener(marker, "click", () => {
            let mbtiDisplay = "";
            if (place.mbti) {
              if (Array.isArray(place.mbti)) {
                mbtiDisplay = place.mbti.join(", ");
              } else if (place.mbti === "all") {
                mbtiDisplay = "모든 MBTI";
              } else {
                mbtiDisplay = place.mbti;
              }
            }

            const content = `
            <div style="padding: 15px; min-width: 280px; max-width: 320px; font-family: 'Malgun Gothic', sans-serif;">
              <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #DC2626;">${
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
              
              ${
                mbtiDisplay
                  ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px; background: #EFF6FF; padding: 4px 8px; border-radius: 12px; display: inline-block;">
                🧠 MBTI: ${mbtiDisplay}
              </div>`
                  : ""
              }
              
              ${
                place.holiday
                  ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px; background: #FEF3C7; padding: 4px 8px; border-radius: 12px; display: inline-block;">
                🗓️ 휴무일: ${place.holiday}
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

          newMarkers.push(marker);
        });

        setPetTourismMarkers(newMarkers);
        setAllPetData(validData);
        
        setIsPetDataLoaded(true);
        console.log("✅ 반려동물 여행지 마커 생성 완료");
        return;
      }

      console.log("❌ Props에서 데이터를 전달받지 못함, API 호출로 대체");
      
      // 기존 API 호출 방식 (백업용)
      const { data, error } = await supabase.functions.invoke(
        "combined-tour-api",
        {
          body: {
            areaCode: "6",
            numOfRows: "10",
            pageNo: "1",
            keyword: "",
            activeTab: "pet",
            loadAllPetKeywords: true,
          },
        }
      );

      if (error) {
        console.error("반려동물 여행지 로딩 오류:", error);
        toast.error("반려동물 여행지를 불러오는데 실패했습니다.");
        return;
      }

      console.log("🔍 API 원본 응답 분석:");
      console.log("- data.petTourismData 존재 여부:", !!data.petTourismData);
      console.log(
        "- response.header.resultCode:",
        data.petTourismData?.response?.header?.resultCode
      );
      console.log(
        "- response.body.totalCount:",
        data.petTourismData?.response?.body?.totalCount
      );
      console.log(
        "- response.body.items 존재 여부:",
        !!data.petTourismData?.response?.body?.items
      );

      if (
        data.petTourismData &&
        !data.petTourismData.error &&
        data.petTourismData.response?.header?.resultCode === "0000" &&
        data.petTourismData.response?.body?.items?.item
      ) {
        const items = data.petTourismData.response.body.items.item;
        console.log("📊 원본 items 분석:");
        console.log(
          "- items 타입:",
          Array.isArray(items) ? "Array" : typeof items
        );
        console.log(
          "- items 길이:",
          Array.isArray(items) ? items.length : "단일 객체"
        );

        const processedData = Array.isArray(items) ? items : [items];
        console.log("🔧 처리된 데이터 분석:");
        console.log("- processedData 길이:", processedData.length);

        // 좌표 없는 데이터 확인
        const validData = processedData.filter(
          (item) =>
            item.mapx && item.mapy && item.mapx !== "0" && item.mapy !== "0"
        );
        const invalidData = processedData.filter(
          (item) =>
            !item.mapx || !item.mapy || item.mapx === "0" || item.mapy === "0"
        );

        console.log("📍 좌표 유효성 분석:");
        console.log("- 유효한 좌표를 가진 데이터:", validData.length);
        console.log("- 유효하지 않은 좌표를 가진 데이터:", invalidData.length);

        if (invalidData.length > 0) {
          console.log("❌ 좌표가 없는 데이터들:");
          invalidData.slice(0, 5).forEach((item, index) => {
            console.log(
              `  ${index + 1}. ${item.title} - mapx: ${item.mapx}, mapy: ${
                item.mapy
              }`
            );
          });
        }

        console.log(
          `🎉 최종 로딩 완료: ${processedData.length}개 (유효 좌표: ${validData.length}개)`
        );

        // 첫 10개 데이터 샘플 출력
        console.log("📝 데이터 샘플:");
        processedData.slice(0, 10).forEach((place, index) => {
          console.log(
            `  ${index + 1}. ${place.title} (${place.mapx}, ${place.mapy})`
          );
        });

        setAllPetData(processedData);
        setIsPetDataLoaded(true);

        toast.success("반려동물 여행지를 불러왔습니다!");
      } else {
        console.warn("API 응답에 데이터가 없습니다:", data);
        toast.warning("반려동물 여행지 데이터를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("반려동물 여행지 로딩 실패:", error);
      toast.error("반려동물 여행지를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [isPetDataLoaded]);

  // 지도 로드 후 반려동물 데이터 로드
  useEffect(() => {
    if (isMapLoaded && showPetFilter && !isPetDataLoaded) {
      loadPetTourismMarkers();
    }
  }, [isMapLoaded, showPetFilter, isPetDataLoaded, loadPetTourismMarkers]);

  // 지도와 데이터 모두 로드된 후 자동으로 카테고리 마커 표시
  useEffect(() => {
    if (
      isMapLoaded &&
      showPetFilter &&
      isPetDataLoaded &&
      allPetData.length > 0
    ) {
      const targetCategory = initialCategory || "all";
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
    isPetDataLoaded,
    allPetData.length,
    initialCategory,
    handleCategorySelect,
  ]);

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
      if (showPetFilter && allPetData.length > 0) {
        // 반려동물 데이터에서 검색
        const filteredPlaces = allPetData.filter(
          (place) =>
            place.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            place.addr1?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filteredPlaces.length > 0) {
          petTourismMarkers.forEach((marker) => marker.setMap(null));

          const newMarkers: any[] = [];

          filteredPlaces.forEach((place) => {
            if (!place.mapx || !place.mapy) return;

            const position = new window.kakao.maps.LatLng(
              place.mapy,
              place.mapx
            );
            const marker = new window.kakao.maps.Marker({ position });
            marker.setMap(mapInstance.current);
            newMarkers.push(marker);
          });

          setPetTourismMarkers(newMarkers);

          const firstPlace = filteredPlaces[0];
          if (firstPlace.mapx && firstPlace.mapy) {
            const moveLatLng = new window.kakao.maps.LatLng(
              firstPlace.mapy,
              firstPlace.mapx
            );
            mapInstance.current.panTo(moveLatLng);
          }

          toast.success(
            `${filteredPlaces.length}개의 반려동물 여행지를 찾았습니다.`
          );
        } else {
          petTourismMarkers.forEach((marker) => marker.setMap(null));
          setPetTourismMarkers([]);
          toast.warning("검색 결과가 없습니다.");
        }

        return;
      }

      // 카카오맵 장소 검색 서비스 사용
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        const ps = new window.kakao.maps.services.Places();

        // 현재 지도 중심 좌표
        const center = mapInstance.current.getCenter();
        const searchOptions = {
          location: center,
          radius: parseInt(radius),
          size: 15,
        };

        ps.keywordSearch(
          searchQuery,
          (data: any[], status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const places = data.map((place: any) => ({
                id: place.id,
                place_name: place.place_name,
                category_name: place.category_name,
                address_name: place.address_name,
                road_address_name: place.road_address_name,
                phone: place.phone,
                place_url: place.place_url,
                x: place.x,
                y: place.y,
                distance: place.distance,
                source: "kakao" as const,
              }));

              setPlaces(places);
              displayMarkers(places);

              if (places.length > 0) {
                const firstPlace = places[0];
                const moveLatLng = new window.kakao.maps.LatLng(
                  firstPlace.y,
                  firstPlace.x
                );
                mapInstance.current.panTo(moveLatLng);
                toast.success(`${places.length}개의 장소를 찾았습니다.`);
              }
            } else if (
              status === window.kakao.maps.services.Status.ZERO_RESULT
            ) {
              setPlaces([]);
              clearMarkers();
              toast.warning("검색 결과가 없습니다.");
            } else {
              console.error("카카오맵 검색 오류:", status);
              toast.error("장소 검색에 실패했습니다.");
            }
            setLoading(false);
          },
          searchOptions
        );
      } else {
        // 카카오맵 서비스를 사용할 수 없는 경우 프록시 사용
        const center = mapInstance.current.getCenter();
        const lat = center.getLat();
        const lng = center.getLng();

        const { data, error } = await supabase.functions.invoke("kakao-proxy", {
          body: {
            op: "/v2/local/search/keyword.json",
            query: searchQuery,
            x: lng.toString(),
            y: lat.toString(),
            radius: radius,
            size: "15",
          },
        });

        if (error) throw error;

        const places =
          data.documents?.map((place: any) => ({
            ...place,
            source: "kakao",
          })) || [];

        if (places.length > 0) {
          setPlaces(places);
          displayMarkers(places);

          const firstPlace = places[0];
          const moveLatLng = new window.kakao.maps.LatLng(
            firstPlace.y,
            firstPlace.x
          );
          mapInstance.current.panTo(moveLatLng);

          toast.success(`${places.length}개의 장소를 찾았습니다.`);
        } else {
          setPlaces([]);
          clearMarkers();
          toast.warning("검색 결과가 없습니다.");
        }
        setLoading(false);
      }
    } catch (error) {
      console.error("장소 검색 실패:", error);
      toast.error("장소 검색에 실패했습니다.");
      setLoading(false);
    }
  }, [searchQuery, radius, showPetFilter, allPetData, petTourismMarkers]);

  const displayMarkers = useCallback((places: Place[]) => {
    clearMarkers();

    const newMarkers = places.map((place) => {
      const markerPosition = new window.kakao.maps.LatLng(place.y, place.x);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        clickable: true,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        showInfoWindow(marker, place);
        setSelectedPlace(place);
      });

      return marker;
    });

    markers.current = newMarkers;

    if (clusterer.current) {
      clusterer.current.addMarkers(newMarkers);
    } else {
      newMarkers.forEach((marker) => {
        marker.setMap(mapInstance.current);
      });
    }
  }, []);

  const clearMarkers = useCallback(() => {
    if (clusterer.current) {
      clusterer.current.clear();
    } else {
      markers.current.forEach((marker) => {
        marker.setMap(null);
      });
    }
    markers.current = [];
    if (infoWindow.current) {
      infoWindow.current.close();
    }
  }, []);

  const showInfoWindow = useCallback((marker: unknown, place: Place) => {
    const content = `
      <div style="padding: 10px; min-width: 200px;">
        <div style="font-weight: bold; margin-bottom: 5px;">${
          place.place_name
        }</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 3px;">${
          place.category_name
        }</div>
        <div style="font-size: 11px; color: #888; margin-bottom: 3px;">${
          place.address_name
        }</div>
        ${
          place.phone
            ? `<div style="font-size: 11px; color: #888; margin-bottom: 5px;"><i class="phone-icon"></i> ${place.phone}</div>`
            : ""
        }
        <div style="text-align: center;">
          <button id="review-btn-${place.id}" 
             style="color: #007bff; font-size: 11px; text-decoration: none; background: #f8f9fa; padding: 4px 8px; border-radius: 4px; display: inline-block; border: 1px solid #dee2e6; cursor: pointer;">
            ⭐ 평점 및 후기
          </button>
        </div>
      </div>
    `;

    infoWindow.current.setContent(content);
    infoWindow.current.open(mapInstance.current, marker);

    // 평점/후기 버튼 이벤트 리스너 추가
    setTimeout(() => {
      const reviewBtn = document.getElementById(`review-btn-${place.id}`);
      if (reviewBtn) {
        reviewBtn.addEventListener("click", () => {
          setSelectedPlaceForReview(place);
          setIsReviewModalOpen(true);
        });
      }
    }, 100);
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation({ lat, lng });

          if (mapInstance.current) {
            const locPosition = new window.kakao.maps.LatLng(lat, lng);
            mapInstance.current.panTo(locPosition);

            const marker = new window.kakao.maps.Marker({
              position: locPosition,
            });
            marker.setMap(mapInstance.current);

            toast.success("현재 위치로 이동했습니다.");
          }
        },
        () => {
          toast.error("현재 위치를 가져올 수 없습니다.");
        }
      );
    } else {
      toast.error("위치 서비스를 지원하지 않는 브라우저입니다.");
    }
  }, []);

  const selectPlace = useCallback(
    (place: Place) => {
      setSelectedPlace(place);

      if (mapInstance.current) {
        const moveLatLng = new window.kakao.maps.LatLng(place.y, place.x);
        mapInstance.current.panTo(moveLatLng);

        const marker = markers.current.find(
          (m, index) => places[index].id === place.id
        );
        if (marker) {
          showInfoWindow(marker, place);
        }
      }

      if (window.innerWidth < 768) {
        setShowMobileList(false);
      }
    },
    [places, showInfoWindow]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchPlaces();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">지도 검색</h1>
        </div>

        {showPetFilter && (
          <div className="mt-4">
            {/* 카테고리 및 멍bti 필터 */}
            <div className="overflow-x-auto">
              <div className="flex gap-1 pb-2 min-w-max px-1">
                {/* 전체 버튼 */}
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategorySelect("all")}
                  className="flex items-center gap-1 whitespace-nowrap text-xs px-2 py-1 flex-shrink-0 min-w-fit"
                >
                  <MapPin className="w-3 h-3" />
                  전체
                </Button>

                {/* 멍bti 필터 버튼 */}
                <Dialog
                  open={isMbtiModalOpen}
                  onOpenChange={setIsMbtiModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant={selectedMbti ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-1 whitespace-nowrap text-xs px-2 py-1 flex-shrink-0 min-w-fit"
                    >
                      멍bti {selectedMbti && `(${selectedMbti})`}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader className="text-center pb-4">
                      <DialogTitle className="text-xl font-bold text-gray-800">
                        멍bti 선택하기
                      </DialogTitle>
                      <p className="text-sm text-gray-600 mt-2">
                        우리 강아지와 잘 맞는 멍bti를 선택해보세요!
                      </p>
                    </DialogHeader>

                    <div className="grid grid-cols-4 gap-3 mt-6">
                      {mbtiData.map((mbti, index) => (
                         <Button
                          key={mbti.id}
                          variant={
                            selectedMbti === mbti.id ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleMbtiSelect(mbti.id)}
                          title={mbti.label} // 툴팁으로 전체 이름 표시
                          className={`
                            relative flex items-center justify-center p-4 h-16 text-sm font-bold
                            transition-all duration-200 hover:scale-105 hover:shadow-md
                            ${
                              selectedMbti === mbti.id
                                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
                                : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                            }
                            rounded-xl
                          `}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs opacity-70">
                              #{index + 1}
                            </span>
                            <span className="font-bold">{mbti.id}</span>
                          </div>
                          {selectedMbti === mbti.id && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </Button>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {selectedMbti
                            ? `선택됨: ${selectedMbti}`
                            : "멍bti를 선택해주세요"}
                        </span>
                        {selectedMbti && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMbti(null);
                              setIsMbtiModalOpen(false);
                              handleCategorySelect(selectedCategory);
                            }}
                            className="text-xs text-gray-500 hover:text-red-500"
                          >
                            선택 해제
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* 나머지 카테고리 버튼들 (공원부터) */}
                {categories.slice(1).map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    variant={selectedCategory === id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategorySelect(id)}
                    className="flex items-center gap-1 whitespace-nowrap text-xs px-2 py-1 flex-shrink-0 min-w-fit"
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </Button>
                ))}

                {/* MBTI 필터 해제 버튼 */}
                {selectedMbti && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearMbtiFilter}
                    className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
                  >
                    ✕ MBTI 해제
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="장소를 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="500">500m</SelectItem>
              <SelectItem value="1000">1km</SelectItem>
              <SelectItem value="2000">2km</SelectItem>
              <SelectItem value="5000">5km</SelectItem>
              <SelectItem value="10000">10km</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
          <Button variant="outline" onClick={getCurrentLocation}>
            <Navigation className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <div className="flex-1 flex">
        <div ref={mapRef} className="flex-1" />

        {places.length > 0 && (
          <div
            className={`${
              showMobileList
                ? "absolute inset-0 bg-white z-10"
                : "hidden md:block"
            } w-full md:w-80 border-l bg-white overflow-y-auto`}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">검색 결과 ({places.length})</h2>
                {showMobileList && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileList(false)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3">
              {places.map((place) => (
                <Card
                  key={place.id}
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => selectPlace(place)}
                >
                  <h3 className="font-medium text-sm">{place.place_name}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {place.category_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {place.address_name}
                  </p>
                  {place.phone && (
                    <div className="flex items-center gap-1 mt-2">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {place.phone}
                      </span>
                    </div>
                  )}
                  {place.place_url && (
                    <div className="flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3 text-blue-500" />
                      <a
                        href={place.place_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        상세보기
                      </a>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {places.length > 0 && (
          <Button
            className="md:hidden fixed bottom-20 left-4 z-20"
            onClick={() => setShowMobileList(true)}
          >
            목록 보기 ({places.length})
          </Button>
        )}
      </div>


      {/* 평점/후기 모달 */}
      {selectedPlaceForReview && (
        <PlaceReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedPlaceForReview(null);
          }}
          onReviewUpdate={() => {
            // 평점 업데이트 시 필요하면 추가 로직 구현
          }}
          place={{
            contentid:
              selectedPlaceForReview.contentid || selectedPlaceForReview.id,
            title:
              selectedPlaceForReview.title || selectedPlaceForReview.place_name,
          }}
        />
      )}
    </div>
  );
};

export default KakaoMap;
