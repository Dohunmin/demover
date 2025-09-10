import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    const loadKakaoMap = async () => {
      if (!mapRef.current) return;

      try {
        console.log("카카오 지도 API 키 조회 중...");
        const { data, error } = await supabase.functions.invoke('test-api-key');

        if (error) {
          console.error("카카오 API 키 조회 실패:", error);
          setMapError("카카오 지도 API 키를 가져올 수 없습니다.");
          return;
        }

        const KAKAO_JS_KEY = data.kakaoJsKey;
        console.log("카카오 지도 스크립트 로딩 시작...");

        const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
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
            console.error("카카오 지도 로딩 타임아웃");
            reject(new Error("카카오 지도 로딩 타임아웃"));
          }, 15000);

          script.onload = () => {
            clearTimeout(timeout);
            console.log("카카오 지도 스크립트 로딩 완료");
            resolve();
          };

          script.onerror = () => {
            clearTimeout(timeout);
            script.remove();
            console.error("카카오 지도 스크립트 로딩 실패");
            reject(new Error("카카오 지도 스크립트 로딩 실패"));
          };

          document.head.appendChild(script);
        });

        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            console.log("카카오 지도 초기화 시작");
            initializeMap();
            setIsMapLoaded(true);
          });
        }
      } catch (error) {
        console.error("카카오 지도 로딩 중 오류:", error);
        setMapError("카카오 지도를 불러올 수 없습니다.");
      }
    };

    loadKakaoMap();

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
    if (isMapLoaded && mapInstanceRef.current) {
      updateMarkers();
    }
  }, [hospitals, isMapLoaded]);

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
    if (!mapInstanceRef.current) {
      console.log('❌ 지도 인스턴스가 없습니다');
      return;
    }

    console.log('🏥 동물병원 마커 업데이트 시작, 총 병원 수:', hospitals.length);

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

    console.log('✅ 유효한 좌표를 가진 병원 수:', validHospitals.length);

    if (validHospitals.length === 0) {
      console.log('❌ 유효한 병원 데이터가 없습니다');
      if (hospitals.length > 0) {
        console.log('🔍 첫 번째 병원 데이터 샘플:', hospitals[0]);
      }
      return;
    }

    console.log('🔍 첫 번째 유효한 병원:', validHospitals[0]);

    // 새 마커들 생성
    validHospitals.forEach((hospital, index) => {
      try {
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

        if (index === 0) {
          console.log('✅ 첫 번째 마커 생성 완료');
        }
      } catch (error) {
        console.error(`❌ 마커 생성 실패 (${index}번째):`, error, hospital);
      }
    });

    console.log('🎯 총 생성된 마커 수:', markersRef.current.length);

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
      console.log('🗺️ 지도 범위 조정 완료');
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