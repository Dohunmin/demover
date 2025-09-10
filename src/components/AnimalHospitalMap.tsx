import React, { useEffect, useRef } from 'react';

interface AnimalHospital {
  animal_hospital: string;
  road_address: string;
  tel: string;
  approval: string;
  gugun: string;
  lat: string;
  lon: string;
}

interface AnimalHospitalMapProps {
  hospitals: AnimalHospital[];
}

declare global {
  interface Window {
    kakao: any;
  }
}

const AnimalHospitalMap: React.FC<AnimalHospitalMapProps> = ({ hospitals }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 카카오 지도 API 키 확인
    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
    console.log('Kakao API Key available:', !!apiKey);
    
    if (!apiKey) {
      console.error('VITE_KAKAO_MAP_API_KEY is not set');
      setMapError('카카오 지도 API 키가 설정되지 않았습니다.');
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    
    script.onload = () => {
      console.log('Kakao Maps script loaded');
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          console.log('Kakao Maps loaded successfully');
          initializeMap();
        });
      } else {
        console.error('Kakao Maps not available after script load');
        setMapError('카카오 지도를 불러올 수 없습니다.');
      }
    };

    script.onerror = (error) => {
      console.error('Failed to load Kakao Maps script:', error);
      setMapError('카카오 지도 스크립트 로딩에 실패했습니다.');
    };

    if (!document.querySelector('script[src*="dapi.kakao.com"]')) {
      document.head.appendChild(script);
    } else {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          console.log('Kakao Maps already loaded');
          initializeMap();
        });
      }
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach(({ marker }) => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers();
    }
  }, [hospitals]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    try {
      console.log('Initializing map with hospitals:', hospitals.length);
      
      const container = mapRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(35.1595, 129.0519), // 부산 중심
        level: 7 // 확대 레벨
      };

      mapInstanceRef.current = new window.kakao.maps.Map(container, options);
      console.log('Map instance created successfully');
      updateMarkers();
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;

    // 기존 마커들 제거
    markersRef.current.forEach(({ marker }) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 유효한 좌표를 가진 병원들만 필터링
    const validHospitals = hospitals.filter(hospital => 
      hospital.lat && hospital.lon && 
      !isNaN(parseFloat(hospital.lat)) && 
      !isNaN(parseFloat(hospital.lon))
    );

    if (validHospitals.length === 0) return;

    // 새 마커들 생성
    validHospitals.forEach(hospital => {
      const position = new window.kakao.maps.LatLng(
        parseFloat(hospital.lat), 
        parseFloat(hospital.lon)
      );

      const marker = new window.kakao.maps.Marker({
        position: position,
        map: mapInstanceRef.current
      });

      // 인포윈도우 생성
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 220px; max-width: 280px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px; color: #333; line-height: 1.3;">
              🏥 ${hospital.animal_hospital || '병원명 정보 없음'}
            </h4>
            <div style="font-size: 10px; color: #666; margin-bottom: 6px; background: #F3F4F6; padding: 3px 6px; border-radius: 8px; display: inline-block;">
              📍 ${hospital.gugun || '구/군 정보 없음'}
            </div>
            <div style="font-size: 11px; color: #333; margin-bottom: 4px; line-height: 1.2;">
              <strong>주소:</strong> ${hospital.road_address || '주소 정보 없음'}
            </div>
            ${hospital.tel ? `
              <div style="font-size: 11px; color: #333; margin-bottom: 4px;">
                <strong>전화:</strong> ${hospital.tel}
              </div>
            ` : ''}
            ${hospital.approval ? `
              <div style="font-size: 10px; color: #666; margin-top: 6px;">
                승인일: ${hospital.approval.slice(0, 10)}
              </div>
            ` : ''}
          </div>
        `,
        removable: true
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 다른 인포윈도우들 닫기
        markersRef.current.forEach(({ infoWindow: info }) => {
          info.close();
        });
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push({ marker, infoWindow });
    });

    // 모든 마커가 보이도록 지도 범위 조정
    if (validHospitals.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds();
      validHospitals.forEach(hospital => {
        bounds.extend(new window.kakao.maps.LatLng(
          parseFloat(hospital.lat), 
          parseFloat(hospital.lon)
        ));
      });
      mapInstanceRef.current.setBounds(bounds);
    }
  };

  return (
    <div className="w-full h-full rounded-lg relative" style={{ minHeight: '400px' }}>
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center p-6">
            <div className="text-muted-foreground text-sm mb-2">⚠️ 지도 로딩 오류</div>
            <div className="text-xs text-muted-foreground mb-4">{mapError}</div>
            <div className="text-xs text-muted-foreground">
              브라우저 개발자 도구(F12) 콘솔에서 자세한 오류를 확인하세요.
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              총 {hospitals.filter(h => h.lat && h.lon).length}개 병원의 위치 정보 보유
            </div>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default AnimalHospitalMap;