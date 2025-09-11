import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

// Kakao Maps API 타입 정의
declare global {
  interface Window {
    kakao: any;
  }
}

interface TravelRecord {
  id: string;
  location_name: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  visit_date: string;
  memo?: string;
  rating?: number;
}

interface TravelRecordsMapProps {
  records: TravelRecord[];
  onRecordClick?: (record: TravelRecord) => void;
}

const TravelRecordsMap: React.FC<TravelRecordsMapProps> = ({ records, onRecordClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Kakao Maps API 로드
  useEffect(() => {
    const loadKakaoMaps = () => {
      if (window.kakao && window.kakao.maps) {
        setIsKakaoLoaded(true);
        setIsLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=c7cf9e7ecec81ad0090f5b7881b89e97&autoload=false';
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => {
          setIsKakaoLoaded(true);
          setIsLoading(false);
        });
      };
      script.onerror = () => {
        console.error('Failed to load Kakao Maps API');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    loadKakaoMaps();
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!isKakaoLoaded || !mapContainer.current) return;

    const validRecords = records.filter(record => 
      record.latitude && record.longitude
    );

    // 기본 중심점 (부산)
    let centerLat = 35.1796;
    let centerLng = 129.0756;
    let level = 8;

    // 기록이 있으면 첫 번째 기록을 중심으로
    if (validRecords.length > 0) {
      centerLat = validRecords[0].latitude!;
      centerLng = validRecords[0].longitude!;
      level = validRecords.length === 1 ? 3 : 6;
    }

    const mapOption = {
      center: new window.kakao.maps.LatLng(centerLat, centerLng),
      level: level,
    };

    // 지도 생성
    mapRef.current = new window.kakao.maps.Map(mapContainer.current, mapOption);

    // 줌 컨트롤 추가
    const zoomControl = new window.kakao.maps.ZoomControl();
    mapRef.current.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

  }, [isKakaoLoaded, records]);

  // 마커 추가
  useEffect(() => {
    if (!isKakaoLoaded || !mapRef.current) return;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const validRecords = records.filter(record => 
      record.latitude && record.longitude
    );

    if (validRecords.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    validRecords.forEach((record, index) => {
      const position = new window.kakao.maps.LatLng(record.latitude!, record.longitude!);
      
      // 로고 마커 이미지 생성
      const markerImageSrc = `data:image/svg+xml;base64,${btoa(`
        <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#60A5FA;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#93C5FD;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#FDE047;stop-opacity:1" />
            </linearGradient>
          </defs>
          <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 30 20 30s20-15 20-30C40 8.954 31.046 0 20 0z" fill="url(#grad)"/>
          <circle cx="20" cy="20" r="12" fill="white" opacity="0.9"/>
          <image href="/lovable-uploads/ac67abbc-77f6-49be-9553-8f14fcad6271.png" x="14" y="14" width="12" height="12"/>
        </svg>
      `)}`;
      
      const imageSize = new window.kakao.maps.Size(40, 50);
      const imageOption = { offset: new window.kakao.maps.Point(20, 50) };
      const markerImage = new window.kakao.maps.MarkerImage(markerImageSrc, imageSize, imageOption);

      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: position,
        image: markerImage,
      });

      marker.setMap(mapRef.current);

      // 정보창 생성
      const infoContent = `
        <div style="padding: 12px; min-width: 200px; font-family: inherit;">
          <div style="font-weight: bold; color: #333; margin-bottom: 8px; font-size: 14px;">
            ${record.location_name}
          </div>
          ${record.location_address ? `
            <div style="color: #666; font-size: 12px; margin-bottom: 4px;">
              📍 ${record.location_address}
            </div>
          ` : ''}
          <div style="color: #666; font-size: 12px; margin-bottom: 4px;">
            📅 ${new Date(record.visit_date).toLocaleDateString('ko-KR')}
          </div>
          ${record.rating ? `
            <div style="color: #FFB800; font-size: 12px; margin-bottom: 4px;">
              ${'⭐'.repeat(record.rating)} (${record.rating}/5)
            </div>
          ` : ''}
          ${record.memo ? `
            <div style="color: #444; font-size: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              💭 ${record.memo.length > 50 ? record.memo.substring(0, 50) + '...' : record.memo}
            </div>
          ` : ''}
        </div>
      `;

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoContent,
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 다른 정보창 닫기
        markersRef.current.forEach(m => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });
        
        infoWindow.open(mapRef.current, marker);
        
        if (onRecordClick) {
          onRecordClick(record);
        }
      });

      // 마커와 정보창 저장
      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // 모든 마커가 보이도록 지도 범위 조정
    if (validRecords.length > 1) {
      mapRef.current.setBounds(bounds);
    } else if (validRecords.length === 1) {
      mapRef.current.setCenter(new window.kakao.maps.LatLng(validRecords[0].latitude!, validRecords[0].longitude!));
      mapRef.current.setLevel(3);
    }

  }, [isKakaoLoaded, records, onRecordClick]);

  if (isLoading) {
    return (
      <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-md bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const validRecordsCount = records.filter(r => r.latitude && r.longitude).length;

  return (
    <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-md">
      <div ref={mapContainer} className="absolute inset-0 bg-muted" />
      
      {validRecordsCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm">
          <div className="text-center p-6">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">위치 정보가 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              여행 기록에 위치 정보를 추가하면<br />
              지도에서 확인할 수 있습니다
            </p>
          </div>
        </div>
      )}

      {validRecordsCount > 0 && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{validRecordsCount}개의 여행 기록</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelRecordsMap;