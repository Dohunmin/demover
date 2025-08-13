import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Navigation, Search, Phone, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

interface KakaoMapProps {
  onBack: () => void;
}

const KakaoMap: React.FC<KakaoMapProps> = ({ onBack }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const clusterer = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const infoWindow = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState('2000');
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMobileList, setShowMobileList] = useState(false);

  // 카카오 지도 SDK 로드
  useEffect(() => {
    const loadKakaoMap = async () => {
      try {
        // 카카오 JavaScript 키 - 여기에 실제 키를 입력해주세요
        const KAKAO_JS_KEY = 'f47e28e5e28b18fa82d5d85d0d4b6ee5'; // 실제 JavaScript 키로 교체
        
        if (!KAKAO_JS_KEY) {
          toast.error('카카오 JavaScript 키가 설정되지 않았습니다.');
          return;
        }

        // 기존 스크립트가 있다면 제거
        const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services,clusterer,drawing`;
        script.async = true;
        
        script.onload = () => {
          console.log('카카오 지도 스크립트 로드 완료');
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              console.log('카카오 지도 API 로드 완료');
              initializeMap();
              setIsMapLoaded(true);
            });
          } else {
            console.error('카카오 지도 객체를 찾을 수 없습니다.');
            toast.error('카카오 지도 API 로드에 실패했습니다.');
          }
        };
        
        script.onerror = (error) => {
          console.error('카카오 지도 스크립트 로드 에러:', error);
          toast.error('카카오 지도를 로드할 수 없습니다. API 키를 확인해주세요.');
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('카카오 지도 로드 중 오류:', error);
        toast.error('지도 로드 중 오류가 발생했습니다.');
      }
    };

    loadKakaoMap();

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      const script = document.querySelector('script[src*="dapi.kakao.com"]');
      if (script) {
        script.remove();
      }
    };
  }, []);

  // 지도 초기화
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.kakao || !window.kakao.maps) {
      console.error('지도 초기화 실패: 필요한 요소가 없습니다.');
      toast.error('지도 초기화에 실패했습니다.');
      return;
    }

    try {
      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울시청
        level: 5,
      };

      mapInstance.current = new window.kakao.maps.Map(mapRef.current, options);
      console.log('지도 인스턴스 생성 완료');
      
      // 클러스터러 초기화
      clusterer.current = new window.kakao.maps.MarkerClusterer({
        map: mapInstance.current,
        averageCenter: true,
        minLevel: 6,
      });
      console.log('마커 클러스터러 생성 완료');

      // 인포윈도우 초기화
      infoWindow.current = new window.kakao.maps.InfoWindow({
        removable: true,
      });
      console.log('인포윈도우 생성 완료');
      
      toast.success('지도가 성공적으로 로드되었습니다!');
    } catch (error) {
      console.error('지도 초기화 오류:', error);
      toast.error('지도 초기화 중 오류가 발생했습니다.');
    }
  }, []);

  // 장소 검색
  const searchPlaces = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.warning('검색어를 입력해주세요.');
      return;
    }
    
    if (!mapInstance.current) {
      toast.error('지도가 로드되지 않았습니다.');
      return;
    }

    setLoading(true);
    try {
      const center = mapInstance.current.getCenter();
      const lat = center.getLat();
      const lng = center.getLng();

      console.log('장소 검색 시작:', { query: searchQuery, lat, lng, radius });

      const response = await fetch(
        `https://fffcagbbbikhfcydncjb.supabase.co/functions/v1/kakao-proxy?op=/v2/local/search/keyword.json&query=${encodeURIComponent(searchQuery)}&x=${lng}&y=${lat}&radius=${radius}&size=15`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmNhZ2JiYmlraGZjeWRuY2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzA2MzMsImV4cCI6MjA3MDY0NjYzM30.2ROotnYyQsgReZwOeBun76dOGPOFyOlwwEnDV3JMn28`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('검색 응답:', data);

      if (data.documents && data.documents.length > 0) {
        setPlaces(data.documents);
        displayMarkers(data.documents);
        
        // 첫 번째 결과로 지도 이동
        const firstPlace = data.documents[0];
        const moveLatLng = new window.kakao.maps.LatLng(firstPlace.y, firstPlace.x);
        mapInstance.current.panTo(moveLatLng);
        
        toast.success(`${data.documents.length}개의 장소를 찾았습니다.`);
      } else {
        setPlaces([]);
        clearMarkers();
        toast.warning('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('장소 검색 실패:', error);
      toast.error('장소 검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, radius]);

  // 마커 표시
  const displayMarkers = useCallback((places: Place[]) => {
    clearMarkers();
    
    const newMarkers = places.map(place => {
      const markerPosition = new window.kakao.maps.LatLng(place.y, place.x);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        clickable: true,
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        showInfoWindow(marker, place);
        setSelectedPlace(place);
      });

      return marker;
    });

    markers.current = newMarkers;
    clusterer.current.addMarkers(newMarkers);
  }, []);

  // 마커 클리어
  const clearMarkers = useCallback(() => {
    if (clusterer.current) {
      clusterer.current.clear();
    }
    markers.current = [];
    if (infoWindow.current) {
      infoWindow.current.close();
    }
  }, []);

  // 인포윈도우 표시
  const showInfoWindow = useCallback((marker: any, place: Place) => {
    const content = `
      <div style="padding: 10px; min-width: 200px;">
        <div style="font-weight: bold; margin-bottom: 5px;">${place.place_name}</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 3px;">${place.category_name}</div>
        <div style="font-size: 11px; color: #888; margin-bottom: 3px;">${place.address_name}</div>
        ${place.phone ? `<div style="font-size: 11px; color: #888; margin-bottom: 5px;"><i class="phone-icon"></i> ${place.phone}</div>` : ''}
        <div style="text-align: center;">
          <a href="${place.place_url}" target="_blank" style="color: #007bff; font-size: 11px; text-decoration: none;">상세보기</a>
        </div>
      </div>
    `;
    
    infoWindow.current.setContent(content);
    infoWindow.current.open(mapInstance.current, marker);
  }, []);

  // 현재 위치 가져오기
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

            // 현재 위치 마커 표시
            const marker = new window.kakao.maps.Marker({
              position: locPosition,
            });
            marker.setMap(mapInstance.current);

            toast.success('현재 위치로 이동했습니다.');
          }
        },
        () => {
          toast.error('현재 위치를 가져올 수 없습니다.');
        }
      );
    } else {
      toast.error('위치 서비스를 지원하지 않는 브라우저입니다.');
    }
  }, []);

  // 장소 선택
  const selectPlace = useCallback((place: Place) => {
    setSelectedPlace(place);
    
    if (mapInstance.current) {
      const moveLatLng = new window.kakao.maps.LatLng(place.y, place.x);
      mapInstance.current.panTo(moveLatLng);

      // 해당 마커 찾아서 인포윈도우 표시
      const marker = markers.current.find((m, index) => places[index].id === place.id);
      if (marker) {
        showInfoWindow(marker, place);
      }
    }
    
    // 모바일에서는 지도 보기로 전환
    if (window.innerWidth < 768) {
      setShowMobileList(false);
    }
  }, [places, showInfoWindow]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchPlaces();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">지도 검색</h1>
        </div>
        
        {/* 검색 바 */}
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
            </SelectContent>
          </Select>
          <Button type="submit" disabled={loading || !isMapLoaded}>
            {loading ? '검색중...' : '검색'}
          </Button>
          <Button type="button" variant="outline" onClick={getCurrentLocation}>
            <Navigation className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex relative">
        {/* 데스크톱: 좌측 리스트 */}
        <div className={`w-80 bg-white border-r overflow-hidden md:flex flex-col ${showMobileList ? 'absolute inset-0 z-10' : 'hidden'}`}>
          <div className="p-4 border-b">
            <h2 className="font-semibold">검색 결과 ({places.length})</h2>
            {/* 모바일 닫기 버튼 */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden absolute top-2 right-2"
              onClick={() => setShowMobileList(false)}
            >
              ✕
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {places.map((place, index) => (
              <Card 
                key={place.id}
                className={`m-2 p-3 cursor-pointer hover:shadow-md transition-shadow ${
                  selectedPlace?.id === place.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => selectPlace(place)}
              >
                <h3 className="font-medium text-sm mb-1">{place.place_name}</h3>
                <p className="text-xs text-gray-600 mb-1">{place.category_name}</p>
                <p className="text-xs text-gray-500 mb-2">{place.address_name}</p>
                {place.phone && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <Phone className="w-3 h-3" />
                    {place.phone}
                  </div>
                )}
                {place.distance && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <MapPin className="w-3 h-3" />
                    {Math.round(Number(place.distance))}m
                  </div>
                )}
                <div className="flex justify-end mt-2">
                  <a 
                    href={place.place_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    상세보기 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            ))}
            {places.length === 0 && (
              <div className="text-center text-gray-500 p-8">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>검색 결과가 없습니다.</p>
                <p className="text-sm">다른 키워드로 검색해보세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* 지도 */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full"></div>
          
          {/* 모바일 리스트 토글 버튼 */}
          <Button
            className="md:hidden absolute top-4 left-4 z-10"
            onClick={() => setShowMobileList(true)}
          >
            결과 목록 ({places.length})
          </Button>
          
          {!isMapLoaded && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">지도를 불러오는 중...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KakaoMap;