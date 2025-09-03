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
  source?: 'kakao' | 'tourism' | 'pet_tourism'; // 데이터 소스 구분
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
  const [petTourismMarkers, setPetTourismMarkers] = useState<any[]>([]); // 반려동물 여행지 전용 마커들
  const [generalAsPetMarkers, setGeneralAsPetMarkers] = useState<any[]>([]); // 일반 관광지를 반려동물 동반으로 표시하는 마커들

  // 반려동물 동반 가능한 일반 관광지 키워드 목록
  const petFriendlyKeywords = [
    '롯데프리미엄아울렛 동부산점',
    '몽작',
    '부산시민공원',
    '센텀 APEC나루공원',
    '신호공원',
    '오르디',
    '온천천시민공원',
    '칠암만장',
    '카페 만디',
    '포레스트3002',
    '홍법사(부산)',
    '감나무집',
    '광안리해변 테마거리',
    '광안리해수욕장',
    '구덕포끝집고기',
    '구포시장',
    '국립부산과학관',
    '그림하우스',
    '금강사(부산)',
    '다대포 꿈의 낙조분수',
    '다대포해수욕장',
    '대보름',
    '대저생태공원',
    '대저수문 생태공원',
    '더웨이브',
    '더펫텔프리미엄스위트',
    '덕미',
    '듀스포레',
    '드림서프라운지',
    '만달리',
    '맥도생태공원',
    '모닝듀 게스트 하우스(모닝듀)',
    '무명일기',
    '문탠로드',
    '민락수변공원',
    '밀락더마켓',
    '부산 감천문화마을',
    '부산 송도해상케이블카',
    '부산 송도해수욕장',
    '부산 암남공원',
    '부산북항 친수공원',
    '부산어린이대공원',
    '불란서그로서리',
    '브리타니',
    '비아조',
    '빅토리아 베이커리 가든',
    '삼락생태공원',
    '성안집',
    '송도 구름산책로',
    '송정물총칼국수',
    '송정해수욕장',
    '스노잉클라우드',
    '스포원파크',
    '신세계사이먼 부산 프리미엄 아울렛',
    '아르반호텔[한국관광 품질인증/Korea Quality]',
    '아미르공원',
    '알로이삥삥',
    '옐로우라이트하우스',
    '오구카페',
    '용소웰빙공원',
    '원시학',
    '웨스턴챔버',
    '웨이브온 커피',
    '윙민박',
    '유정1995 기장 본점',
    '을숙도 공원',
    '이바구캠프',
    '장림포구',
    '절영해안산책로',
    '죽성드림세트장',
    '카페베이스',
    '카페윤',
    '캐빈스위트광안',
    '캔버스',
    '캔버스 블랙',
    '태종대',
    '팝콘 호스텔 해운대점',
    '프루터리포레스트',
    '해동용궁사',
    '해운대 달맞이길',
    '해운대 동백섬',
    '해운대 블루라인파크',
    '해운대 영무파라드호텔',
    '해운대해수욕장',
    '해월전망대',
    '형제가든',
    '황령산',
    '황령산 전망대',
    '황령산레포츠공원',
    '회동수원지',
    '회동수원지 둘레길',
    'AJ하우스(AJ House)',
    'EL16.52',
    'JSTAY',
    'The Park Guest House'
  ];

  // 카카오 지도 SDK 로드 (재시도 로직 포함)
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: NodeJS.Timeout;

    const loadKakaoMap = async () => {
      try {
        // Supabase에서 카카오 JavaScript 키 가져오기
        const { data, error } = await supabase.functions.invoke('test-api-key');
        
        if (error || !data?.kakaoJsKey) {
          console.error('카카오 JS API 키를 가져올 수 없습니다:', error);
          toast.error('카카오 지도 API 키를 가져올 수 없습니다.');
          return;
        }

        const KAKAO_JS_KEY = data.kakaoJsKey;
        console.log('카카오 지도 로드 시작... (시도:', retryCount + 1, '/', maxRetries, ')');
        
        // 이미 로드된 경우 바로 초기화
        if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
          console.log('카카오 지도 이미 로드됨');
          initializeMap();
          setIsMapLoaded(true);
          return;
        }

        // 기존 스크립트들 완전 제거
        const existingScripts = document.querySelectorAll('script[src*="dapi.kakao.com"]');
        existingScripts.forEach(script => {
          script.remove();
          console.log('기존 스크립트 제거됨:', (script as HTMLScriptElement).src);
        });

        // window.kakao 객체 정리
        if (window.kakao) {
          delete window.kakao;
          console.log('기존 window.kakao 객체 제거됨');
        }

        // 잠시 대기 후 스크립트 로드
        await new Promise(resolve => setTimeout(resolve, 100));

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services,clusterer`;
        
        script.onload = () => {
          console.log('카카오 지도 스크립트 로드 성공');
          
          // 스크립트 로드 후 잠시 대기
          setTimeout(() => {
            if (window.kakao && window.kakao.maps) {
              window.kakao.maps.load(() => {
                console.log('카카오 지도 API 초기화 완료');
                initializeMap();
                setIsMapLoaded(true);
                retryCount = 0; // 성공시 재시도 카운터 리셋
              });
            } else {
              console.error('window.kakao.maps 객체가 없습니다');
              handleLoadError();
            }
          }, 200);
        };
        
        script.onerror = (error) => {
          console.error('카카오 지도 스크립트 로드 실패:', error);
          handleLoadError();
        };

        // 타임아웃 설정 (10초)
        const timeout = setTimeout(() => {
          console.error('카카오 지도 스크립트 로드 타임아웃');
          script.remove();
          handleLoadError();
        }, 10000);

        script.addEventListener('load', () => clearTimeout(timeout));
        script.addEventListener('error', () => clearTimeout(timeout));
        
        document.head.appendChild(script);
        console.log('카카오 지도 스크립트 태그 추가됨:', script.src);
        
      } catch (error) {
        console.error('카카오 지도 로드 중 예외 발생:', error);
        handleLoadError();
      }
    };

    const handleLoadError = () => {
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`재시도 예정 (${retryCount}/${maxRetries})`);
        retryTimeout = setTimeout(() => {
          loadKakaoMap();
        }, 2000 * retryCount); // 재시도 시마다 지연 시간 증가
      } else {
        console.error('카카오 지도 로드 최대 재시도 횟수 초과');
        toast.error('카카오 지도 로드에 실패했습니다. 페이지를 새로고침해주세요.');
      }
    };

    loadKakaoMap();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };

  }, []);

  // 지도 초기화
  const initializeMap = useCallback(() => {
    if (!mapRef.current) {
      console.error('지도 초기화 실패: mapRef가 없습니다.');
      return;
    }

    if (!window.kakao || !window.kakao.maps) {
      console.error('지도 초기화 실패: Kakao Maps API가 로드되지 않았습니다.');
      toast.error('지도 초기화에 실패했습니다.');
      return;
    }

    try {
      // 기존 지도 인스턴스가 있으면 정리
      if (mapInstance.current) {
        console.log('기존 지도 인스턴스 정리');
        mapInstance.current = null;
      }

      const options = {
        center: new window.kakao.maps.LatLng(35.1796, 129.0756), // 부산시청
        level: 5,
      };

      mapInstance.current = new window.kakao.maps.Map(mapRef.current, options);
      console.log('지도 인스턴스 생성 완료');
      
      // 클러스터러 초기화
      if (clusterer.current) {
        clusterer.current.clear();
      }
      
      clusterer.current = new window.kakao.maps.MarkerClusterer({
        map: mapInstance.current,
        averageCenter: true,
        minLevel: 6,
      });
      console.log('마커 클러스터러 생성 완료');

      // 인포윈도우 초기화
      if (infoWindow.current) {
        infoWindow.current.close();
      }

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

  // 95개 키워드로 반려동물 동반 여행지 모든 데이터 로드
  const loadGeneralTourismAsPet = useCallback(async () => {
    try {
      console.log('=== 95개 키워드로 반려동물 동반 여행지 로드 시작 ===');
      console.log('petFriendlyKeywords 개수:', petFriendlyKeywords.length);
      
      const response = await supabase.functions.invoke('combined-tour-api', {
        body: {
          areaCode: '6', // 부산
          numOfRows: '10', // 사용되지 않음
          pageNo: '1', // 사용되지 않음
          keyword: '',
          activeTab: 'pet',
          loadAllPetKeywords: true // 95개 키워드 모두 검색
        }
      });

      console.log('95개 키워드 검색 API 응답:', response);

      if (response.data?.petTourismData?.response?.body?.items?.item) {
        const allPetPlaces = response.data.petTourismData.response.body.items.item;
        console.log(`95개 키워드로 ${allPetPlaces.length}개의 반려동물 여행지 데이터를 가져왔습니다.`);
        
        // 처음 10개의 여행지 제목을 콘솔에 출력
        console.log('가져온 반려동물 여행지들 (처음 10개):');
        allPetPlaces.slice(0, 10).forEach((place: any, index: number) => {
          console.log(`${index + 1}. ${place.title} (키워드: ${place.searchKeyword || '알 수 없음'})`);
        });
        
        createGeneralTourismAsPetMarkers(allPetPlaces);
        toast.success(`95개 키워드로 ${allPetPlaces.length}개의 반려동물 동반 여행지를 지도에 표시했습니다!`);
      } else {
        console.log('95개 키워드 검색 결과가 없습니다.');
        console.log('Response structure:', JSON.stringify(response.data, null, 2));
        toast.warning('95개 키워드 검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('95개 키워드로 반려동물 여행지 로드 오류:', error);
      toast.error('95개 키워드 검색에 실패했습니다.');
    }
  }, [petFriendlyKeywords]);

  // 지도 초기화 후 반려동물 여행지 마커 로드
  useEffect(() => {
    console.log('useEffect 실행됨 - isMapLoaded:', isMapLoaded, 'petFriendlyKeywords.length:', petFriendlyKeywords.length);
    if (isMapLoaded && petFriendlyKeywords.length > 0) {
      console.log('지도 로드 완료! 95개 키워드 검색 함수 호출 시작...');
      // loadPetTourismMarkers() 제거 - 95개 키워드 검색만 사용
      loadGeneralTourismAsPet(); // 95개 키워드로 모든 반려동물 동반 여행지 표시
    } else {
      console.log('지도가 아직 로드되지 않거나 키워드가 없음...');
    }
  }, [isMapLoaded, petFriendlyKeywords.length, loadGeneralTourismAsPet]);

  // 일반 관광지를 반려동물 동반으로 표시하는 마커 생성
  const createGeneralTourismAsPetMarkers = useCallback((matchedPlaces: any[]) => {
    if (!mapInstance.current || !window.kakao) return;

    // 기존 일반->반려동물 마커들 제거
    generalAsPetMarkers.forEach(marker => {
      marker.setMap(null);
    });

    const newGeneralAsPetMarkers: any[] = [];

    matchedPlaces.forEach((place) => {
      if (!place.mapx || !place.mapy || place.mapx === '0' || place.mapy === '0') {
        return; // 좌표가 없는 경우 스킵
      }

      const position = new window.kakao.maps.LatLng(place.mapy, place.mapx);
      
      // 일반->반려동물 전용 마커 이미지 생성 (파란색 강아지 아이콘)
      const imageSize = new window.kakao.maps.Size(30, 30);
      const imageOption = { offset: new window.kakao.maps.Point(15, 30) };
      
      // 파란색 강아지 아이콘 이미지 (SVG를 base64로 인코딩)
      const blueDogIconSvg = `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="30" height="30">
          <circle cx="12" cy="12" r="10" fill="#E0F2FE" stroke="#3B82F6" stroke-width="2"/>
          <path d="M8 10c0-1.1.9-2 2-2s2 .9 2 2-2 3-2 3-2-1.9-2-3zm6 0c0-1.1.9-2 2-2s2 .9 2 2-2 3-2 3-2-1.9-2-3z" fill="#3B82F6"/>
          <circle cx="10" cy="10" r="1.5" fill="#333"/>
          <circle cx="14" cy="10" r="1.5" fill="#333"/>
          <path d="M12 13c-1 0-2 .5-2 1s1 1 2 1 2-.5 2-1-.5-1-2-1z" fill="#333"/>
        </svg>
      `)}`;
      
      const markerImage = new window.kakao.maps.MarkerImage(
        blueDogIconSvg,
        imageSize,
        imageOption
      );

      const marker = new window.kakao.maps.Marker({
        position: position,
        image: markerImage,
        clickable: true
      });

      marker.setMap(mapInstance.current);

      // 마커 클릭 이벤트 - 일반->반려동물 여행지 상세 정보 표시
      window.kakao.maps.event.addListener(marker, 'click', () => {
        showGeneralAsPetDetail(marker, place);
      });

      newGeneralAsPetMarkers.push(marker);
    });

    setGeneralAsPetMarkers(newGeneralAsPetMarkers);
    console.log(`${newGeneralAsPetMarkers.length}개의 일반->반려동물 동반 마커를 생성했습니다.`);
  }, [generalAsPetMarkers]);

  // 일반->반려동물 여행지 상세 정보 표시
  const showGeneralAsPetDetail = useCallback((marker: any, place: any) => {
    const content = `
      <div style="padding: 15px; min-width: 250px; max-width: 300px; font-family: 'Malgun Gothic', sans-serif;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 20px; margin-right: 8px;">🐕</span>
          <div style="font-weight: bold; font-size: 14px; color: #3B82F6;">${place.title}</div>
        </div>
        <div style="font-size: 12px; color: #666; margin-bottom: 3px; background: #E0F2FE; padding: 2px 6px; border-radius: 10px; display: inline-block;">반려동물 동반 여행지</div>
        ${place.searchKeyword ? `<div style="font-size: 10px; color: #888; margin-bottom: 3px;">검색 키워드: ${place.searchKeyword}</div>` : ''}
        <div style="font-size: 11px; color: #888; margin-bottom: 3px; line-height: 1.4;">${place.addr1 || ''}</div>
        ${place.tel ? `<div style="font-size: 11px; color: #888; margin-bottom: 8px;"><span style="color: #3B82F6;">📞</span> ${place.tel}</div>` : ''}
        ${place.firstimage ? `<div style="margin-bottom: 8px;"><img src="${place.firstimage}" alt="${place.title}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 6px;"/></div>` : ''}
        <div style="font-size: 10px; color: #999; margin-bottom: 8px; line-height: 1.3;">※ 반려동물 동반 가능 여부는 현장 확인 필요</div>
        <div style="text-align: center; margin-top: 8px;">
          <a href="https://korean.visitkorea.or.kr/detail/detail.do?cotid=${place.contentid}" target="_blank" style="color: #3B82F6; font-size: 11px; text-decoration: none; font-weight: bold;">🔗 상세보기</a>
        </div>
      </div>
    `;
    
    infoWindow.current.setContent(content);
    infoWindow.current.open(mapInstance.current, marker);
  }, []);

  // 반려동물 여행지 마커들 로드
  const loadPetTourismMarkers = useCallback(async () => {
    try {
      console.log('반려동물 여행지 마커 로드 시작...');
      
      const response = await supabase.functions.invoke('combined-tour-api', {
        body: {
          areaCode: '6', // 부산
          numOfRows: '50', // 43개 모두 가져오기 위해 여유있게
          pageNo: '1',
          keyword: '', // 키워드 없이 전체 목록
          activeTab: 'pet'
        }
      });

      if (response.data?.petTourismData?.response?.body?.items?.item) {
        const petPlaces = response.data.petTourismData.response.body.items.item;
        console.log(`${petPlaces.length}개의 반려동물 여행지 데이터를 가져왔습니다.`);
        
        createPetTourismMarkers(petPlaces);
        toast.success(`${petPlaces.length}개의 반려동물 동반 여행지를 지도에 표시했습니다.`);
      } else {
        console.log('반려동물 여행지 데이터가 없습니다.');
      }
    } catch (error) {
      console.error('반려동물 여행지 로드 오류:', error);
      toast.error('반려동물 여행지 로드에 실패했습니다.');
    }
  }, []);

  // 반려동물 여행지 마커 생성
  const createPetTourismMarkers = useCallback((petPlaces: any[]) => {
    if (!mapInstance.current || !window.kakao) return;

    // 기존 반려동물 마커들 제거
    petTourismMarkers.forEach(marker => {
      marker.setMap(null);
    });

    const newPetMarkers: any[] = [];

    petPlaces.forEach((place) => {
      if (!place.mapx || !place.mapy || place.mapx === '0' || place.mapy === '0') {
        return; // 좌표가 없는 경우 스킵
      }

      const position = new window.kakao.maps.LatLng(place.mapy, place.mapx);
      
      // 반려동물 전용 마커 이미지 생성 (강아지 아이콘)
      const imageSize = new window.kakao.maps.Size(30, 30);
      const imageOption = { offset: new window.kakao.maps.Point(15, 30) };
      
      // 강아지 아이콘 이미지 (SVG를 base64로 인코딩)
      const dogIconSvg = `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF6B6B" width="30" height="30">
          <circle cx="12" cy="12" r="10" fill="#FFE5E5" stroke="#FF6B6B" stroke-width="2"/>
          <path d="M8 10c0-1.1.9-2 2-2s2 .9 2 2-2 3-2 3-2-1.9-2-3zm6 0c0-1.1.9-2 2-2s2 .9 2 2-2 3-2 3-2-1.9-2-3z" fill="#FF6B6B"/>
          <circle cx="10" cy="10" r="1.5" fill="#333"/>
          <circle cx="14" cy="10" r="1.5" fill="#333"/>
          <path d="M12 13c-1 0-2 .5-2 1s1 1 2 1 2-.5 2-1-.5-1-2-1z" fill="#333"/>
        </svg>
      `)}`;
      
      const markerImage = new window.kakao.maps.MarkerImage(
        dogIconSvg,
        imageSize,
        imageOption
      );

      const marker = new window.kakao.maps.Marker({
        position: position,
        image: markerImage,
        clickable: true
      });

      marker.setMap(mapInstance.current);

      // 마커 클릭 이벤트 - 반려동물 여행지 상세 정보 표시
      window.kakao.maps.event.addListener(marker, 'click', () => {
        showPetTourismDetail(marker, place);
      });

      newPetMarkers.push(marker);
    });

    setPetTourismMarkers(newPetMarkers);
    console.log(`${newPetMarkers.length}개의 반려동물 여행지 마커를 생성했습니다.`);
  }, [petTourismMarkers]);

  // 반려동물 여행지 상세 정보 표시
  const showPetTourismDetail = useCallback((marker: any, place: any) => {
    const content = `
      <div style="padding: 15px; min-width: 250px; max-width: 300px; font-family: 'Malgun Gothic', sans-serif;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 20px; margin-right: 8px;">🐕</span>
          <div style="font-weight: bold; font-size: 14px; color: #FF6B6B;">${place.title}</div>
        </div>
        <div style="font-size: 12px; color: #666; margin-bottom: 3px; background: #FFE5E5; padding: 2px 6px; border-radius: 10px; display: inline-block;">반려동물 동반 여행지</div>
        <div style="font-size: 11px; color: #888; margin-bottom: 3px; line-height: 1.4;">${place.addr1 || ''}</div>
        ${place.tel ? `<div style="font-size: 11px; color: #888; margin-bottom: 8px;"><span style="color: #FF6B6B;">📞</span> ${place.tel}</div>` : ''}
        ${place.firstimage ? `<div style="margin-bottom: 8px;"><img src="${place.firstimage}" alt="${place.title}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 6px;"/></div>` : ''}
        <div style="text-align: center; margin-top: 8px;">
          <a href="https://korean.visitkorea.or.kr/detail/detail.do?cotid=${place.contentid}" target="_blank" style="color: #FF6B6B; font-size: 11px; text-decoration: none; font-weight: bold;">🔗 상세보기</a>
        </div>
      </div>
    `;
    
    infoWindow.current.setContent(content);
    infoWindow.current.open(mapInstance.current, marker);
  }, []);
  const convertTourismDataToPlace = useCallback((item: any, source: 'tourism' | 'pet_tourism'): Place => {
    return {
      id: `${source}_${item.contentid || Math.random()}`,
      place_name: item.title || '',
      category_name: source === 'tourism' ? '관광지' : '반려동물 동반 여행지',
      address_name: item.addr1 || '',
      road_address_name: item.addr2 || '',
      phone: item.tel || '',
      place_url: `https://korean.visitkorea.or.kr/detail/detail.do?cotid=${item.contentid}`,
      x: item.mapx || '0',
      y: item.mapy || '0',
      distance: '',
      source: source
    };
  }, []);

  // 여행지 데이터 검색
  const searchTourismPlaces = useCallback(async (keyword: string): Promise<Place[]> => {
    try {
      const results: Place[] = [];

      // 일반 여행지 검색
      const generalResponse = await supabase.functions.invoke('combined-tour-api', {
        body: {
          areaCode: '6', // 부산
          numOfRows: '10',
          pageNo: '1',
          keyword: keyword,
          activeTab: 'general'
        }
      });

      if (generalResponse.data?.tourismData?.response?.body?.items?.item) {
        const generalPlaces = generalResponse.data.tourismData.response.body.items.item.map(
          (item: any) => convertTourismDataToPlace(item, 'tourism')
        );
        results.push(...generalPlaces);
      }

      // 반려동물 여행지 검색
      const petResponse = await supabase.functions.invoke('combined-tour-api', {
        body: {
          areaCode: '6', // 부산
          numOfRows: '10',
          pageNo: '1',
          keyword: keyword,
          activeTab: 'pet'
        }
      });

      if (petResponse.data?.petTourismData?.response?.body?.items?.item) {
        const petPlaces = petResponse.data.petTourismData.response.body.items.item.map(
          (item: any) => convertTourismDataToPlace(item, 'pet_tourism')
        );
        results.push(...petPlaces);
      }

      return results;
    } catch (error) {
      console.error('여행지 데이터 검색 오류:', error);
      return [];
    }
  }, [convertTourismDataToPlace]);

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

      // 병렬로 카카오 검색과 여행지 검색 실행
      const [kakaoResult, tourismPlaces] = await Promise.all([
        // 카카오 키워드 검색
        fetch(
          `https://fffcagbbbikhfcydncjb.supabase.co/functions/v1/kakao-proxy?op=/v2/local/search/keyword.json&query=${encodeURIComponent(searchQuery)}&x=${lng}&y=${lat}&radius=${radius}&size=15`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmNhZ2JiYmlraGZjeWRuY2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzA2MzMsImV4cCI6MjA3MDY0NjYzM30.2ROotnYyQsgReZwOeBun76dOGPOFyOlwwEnDV3JMn28`,
              'Content-Type': 'application/json',
            },
          }
        ).then(async res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const data = await res.json();
          return data.documents?.map((place: any) => ({ ...place, source: 'kakao' })) || [];
        }).catch(error => {
          console.error('카카오 검색 실패:', error);
          return [];
        }),
        
        // 여행지 데이터 검색
        searchTourismPlaces(searchQuery)
      ]);

      // 결과 합치기
      const allPlaces = [...kakaoResult, ...tourismPlaces];

      console.log('통합 검색 결과:', allPlaces);

      if (allPlaces.length > 0) {
        setPlaces(allPlaces);
        displayMarkers(allPlaces);
        
        // 첫 번째 결과로 지도 이동
        const firstPlace = allPlaces[0];
        const moveLatLng = new window.kakao.maps.LatLng(firstPlace.y, firstPlace.x);
        mapInstance.current.panTo(moveLatLng);
        
        toast.success(`${allPlaces.length}개의 장소를 찾았습니다.`);
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
  }, [searchQuery, radius, searchTourismPlaces]);

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