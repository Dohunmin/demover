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
    if (isOpen && place && place.mapx && place.mapy) {
      loadKakaoMap();
    }

    return () => {
      // 정리
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, place]);

  const loadKakaoMap = async () => {
    if (!mapRef.current || !place) return;

    try {
      const { data, error } = await supabase.functions.invoke('test-api-key');

      if (error) {
        console.error("카카오 API 키 조회 실패:", error);
        setMapError("지도를 불러올 수 없습니다.");
        return;
      }

      const KAKAO_JS_KEY = data.kakaoJsKey;

      // 기존 스크립트 제거
      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      if (window.kakao) {
        delete window.kakao;
      }

      // 새 스크립트 로드
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          script.remove();
          reject(new Error("카카오 지도 로딩 타임아웃"));
        }, 10000);

        script.onload = () => {
          clearTimeout(timeout);
          resolve();
        };

        script.onerror = () => {
          clearTimeout(timeout);
          script.remove();
          reject(new Error("카카오 지도 스크립트 로딩 실패"));
        };

        document.head.appendChild(script);
      });

      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          initializeMap();
        });
      }
    } catch (error) {
      console.error("카카오 지도 로딩 중 오류:", error);
      setMapError("지도를 불러올 수 없습니다.");
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !place) return;

    try {
      const lat = parseFloat(place.mapy);
      const lng = parseFloat(place.mapx);

      if (isNaN(lat) || isNaN(lng)) {
        setMapError("위치 정보가 올바르지 않습니다.");
        return;
      }

      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3
      };

      mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options);

      // 마커 생성
      const position = new window.kakao.maps.LatLng(lat, lng);
      markerRef.current = new window.kakao.maps.Marker({
        position: position,
        map: mapInstanceRef.current
      });

      // 인포윈도우 생성
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px; color: #333;">
              ${place.title}
            </h4>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
              📍 ${place.addr1} ${place.addr2 || ''}
            </div>
            ${place.tel ? `
              <div style="font-size: 11px; color: #666;">
                📞 ${place.tel}
              </div>
            ` : ''}
          </div>
        `,
        removable: true
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(markerRef.current, 'click', () => {
        infoWindow.open(mapInstanceRef.current, markerRef.current);
      });

      // 지도 크기 재조정
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.relayout();
        }
      }, 300);

      setIsMapLoaded(true);
    } catch (error) {
      console.error('지도 초기화 실패:', error);
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
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReviewModal(true)}
                  className="flex items-center gap-2 text-sm"
                >
                  <Star className="h-4 w-4" />
                  평점
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6">
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