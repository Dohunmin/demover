import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, MapPin, Phone, Star } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import PlaceReviewModal from './PlaceReviewModal';

interface PlaceLocationModalProps {
  place: {
    contentid?: string;
    contentId?: string;
    title: string;
    addr1: string;
    addr2?: string;
    tel?: string;
    mapx: string;
    mapy: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const PlaceLocationModal: React.FC<PlaceLocationModalProps> = ({
  place,
  isOpen,
  onClose
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    console.log('🔄 PlaceLocationModal useEffect 실행:', { 
      isOpen, 
      place: place ? {
        title: place.title,
        mapx: place.mapx,
        mapy: place.mapy,
        hasMapx: !!place.mapx,
        hasMapy: !!place.mapy
      } : null 
    });

    if (isOpen && place) {
      console.log('✅ 모달이 열림, 장소 정보:', place);
      
      if (!place.mapx || !place.mapy) {
        console.log('❌ 좌표 정보 없음:', { mapx: place.mapx, mapy: place.mapy });
        setMapError("위치 정보가 제공되지 않습니다.");
        return;
      }
      
      console.log('📍 좌표 정보 확인됨:', { mapx: place.mapx, mapy: place.mapy });
      
      // mapRef가 준비될 때까지 잠시 기다림
      setTimeout(() => {
        console.log('⏰ loadKakaoMap 호출 (지연 실행)');
        loadKakaoMap();
      }, 100);
    }

    return () => {
      // 정리
      console.log('🧹 PlaceLocationModal 정리 중...');
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
      setIsMapLoaded(false);
      setMapError(null);
    };
  }, [isOpen, place]);

  const loadKakaoMap = async () => {
    console.log('🚀 loadKakaoMap 호출됨:', { 
      hasMapRef: !!mapRef.current, 
      hasPlace: !!place,
      place: place ? { title: place.title, mapx: place.mapx, mapy: place.mapy } : null
    });
    
    if (!mapRef.current) {
      console.log('❌ mapRef.current가 없음, DOM 요소가 준비되지 않음');
      setMapError("지도 컨테이너를 찾을 수 없습니다.");
      return;
    }
    
    if (!place) {
      console.log('❌ place 데이터가 없음');
      setMapError("장소 정보가 없습니다.");
      return;
    }

    try {
      console.log('🔑 카카오 API 키 조회 시작...');
      const { data, error } = await supabase.functions.invoke('test-api-key');

      if (error) {
        console.error("❌ 카카오 API 키 조회 실패:", error);
        setMapError("지도를 불러올 수 없습니다.");
        return;
      }

      const KAKAO_JS_KEY = data.kakaoJsKey;
      console.log('✅ 카카오 API 키 조회 성공');

      // 카카오 지도가 이미 로드되어 있는지 확인
      if (window.kakao && window.kakao.maps) {
        console.log('✅ 카카오 지도 이미 로드됨, 바로 초기화');
        initializeMap();
        return;
      }

      console.log('🔄 카카오 지도 스크립트 로딩...');

      // 기존 스크립트가 있으면 제거하지 말고 기다림
      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
        console.log('⏳ 기존 스크립트 로딩 대기 중...');
        // 기존 스크립트가 로드될 때까지 대기
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.kakao && window.kakao.maps) {
            clearInterval(checkInterval);
            console.log('✅ 기존 스크립트로 카카오 지도 로드 완료');
            initializeMap();
          } else if (attempts > 50) { // 5초 대기
            clearInterval(checkInterval);
            setMapError("지도 로딩 시간이 초과되었습니다. 카카오 개발자 콘솔에서 도메인을 확인해주세요.");
          }
        }, 100);
        return;
      }

      // 새 스크립트 로드
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;

      document.head.appendChild(script);

      script.onload = () => {
        console.log('✅ 카카오 지도 스크립트 로딩 완료');
        
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            console.log('✅ 카카오 지도 SDK 초기화 완료');
            initializeMap();
          });
        } else {
          console.error('❌ 카카오 지도 객체를 찾을 수 없습니다');
          setMapError("카카오 지도를 로드할 수 없습니다.");
        }
      };

      script.onerror = () => {
        console.error('❌ 카카오 지도 스크립트 로딩 실패');
        setMapError("카카오 지도를 불러올 수 없습니다.");
      };

      // 스크립트 로드 완료 후 자동으로 지도 초기화됨
      document.head.appendChild(script);
    } catch (error) {
      console.error("❌ 카카오 지도 로딩 중 오류:", error);
      setMapError("지도를 불러올 수 없습니다.");
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !place) {
      console.log('❌ 지도 초기화 실패: mapRef 또는 place 없음');
      return;
    }

    try {
      console.log('🗺️ 지도 초기화 시작, 장소 정보:', place);
      
      const lat = parseFloat(place.mapy);
      const lng = parseFloat(place.mapx);

      console.log('📍 파싱된 좌표:', { lat, lng, original: { mapx: place.mapx, mapy: place.mapy } });

      if (isNaN(lat) || isNaN(lng)) {
        console.error('❌ 좌표값이 올바르지 않음:', { lat, lng, mapx: place.mapx, mapy: place.mapy });
        setMapError("위치 정보가 올바르지 않습니다.");
        return;
      }

      if (lat === 0 || lng === 0) {
        console.error('❌ 좌표값이 0:', { lat, lng });
        setMapError("위치 정보가 제공되지 않습니다.");
        return;
      }

      console.log('✅ 좌표 검증 완료, 지도 생성 중...');

      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3
      };

      mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options);
      console.log('✅ 지도 인스턴스 생성 완료');

      // 로고 마커 생성
      const position = new window.kakao.maps.LatLng(lat, lng);
      
      const markerImageSrc = "/lovable-uploads/paw-marker.png";
      
      const imageSize = new window.kakao.maps.Size(40, 40);
      const imageOption = { offset: new window.kakao.maps.Point(20, 40) };
      const markerImage = new window.kakao.maps.MarkerImage(markerImageSrc, imageSize, imageOption);
      
      markerRef.current = new window.kakao.maps.Marker({
        position: position,
        image: markerImage,
        map: mapInstanceRef.current
      });

      console.log('✅ 마커 생성 완료');

      // 인포윈도우 생성
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="
            padding: 15px 18px; 
            max-width: 400px; 
            min-width: 280px;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Malgun Gothic', sans-serif;
            background: white;
            border-radius: 8px;
          ">
            <h4 style="
              margin: 0 0 10px 0; 
              font-weight: bold; 
              font-size: 16px; 
              color: #333;
              line-height: 1.4;
              word-wrap: break-word;
              overflow-wrap: break-word;
            ">
              ${place.title}
            </h4>
            <div style="
              font-size: 13px; 
              color: #666; 
              margin-bottom: 8px;
              line-height: 1.5;
              word-wrap: break-word;
              overflow-wrap: break-word;
              display: flex;
              align-items: flex-start;
              gap: 6px;
            ">
              <span style="color: #4285f4; font-size: 14px;">📍</span>
              <span>${place.addr1} ${place.addr2 || ''}</span>
            </div>
            ${place.tel ? `
              <div style="
                font-size: 12px; 
                color: #666;
                line-height: 1.5;
                word-wrap: break-word;
                overflow-wrap: break-word;
                display: flex;
                align-items: center;
                gap: 6px;
              ">
                <span style="color: #34a853; font-size: 14px;">📞</span>
                <span>${place.tel}</span>
              </div>
            ` : ''}
          </div>
        `,
        removable: true
      });

      console.log('✅ 인포윈도우 생성 완료');

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(markerRef.current, 'click', () => {
        console.log('🖱️ 마커 클릭됨');
        infoWindow.open(mapInstanceRef.current, markerRef.current);
      });

      // 지도 크기 재조정
      setTimeout(() => {
        if (mapInstanceRef.current) {
          console.log('🔄 지도 크기 재조정');
          mapInstanceRef.current.relayout();
          
          // 지도 중심을 다시 설정
          const center = new window.kakao.maps.LatLng(lat, lng);
          mapInstanceRef.current.setCenter(center);
        }
      }, 300);

      setIsMapLoaded(true);
      console.log('✅ 지도 초기화 완료');
    } catch (error) {
      console.error('❌ 지도 초기화 실패:', error);
      setMapError("지도 초기화에 실패했습니다.");
    }
  };

  if (!place) return null;

  const contentId = place.contentid || place.contentId;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4">
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold text-gray-900 mb-2">
                {place.title}
              </DialogTitle>
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <MapPin className="w-4 h-4" />
                <span>{place.addr1} {place.addr2}</span>
              </div>
              {place.tel && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{place.tel}</span>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {mapError ? (
              <div className="h-80 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">{mapError}</p>
                </div>
              </div>
            ) : (
              <div 
                ref={mapRef} 
                className="w-full h-80 rounded-lg bg-gray-100"
                style={{ minHeight: '320px' }}
              />
            )}
            
            {/* 평점 버튼을 지도 아래로 이동 */}
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-2 text-sm"
              >
                <Star className="h-4 w-4" />
                평점
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 평점 모달 */}
      {showReviewModal && (
        <PlaceReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          place={{
            contentid: contentId,
            title: place.title
          }}
          onReviewUpdate={() => {}}
        />
      )}
    </>
  );
};

export default PlaceLocationModal;