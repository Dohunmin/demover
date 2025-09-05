import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// XML을 JSON으로 변환하는 함수
function parseXmlToJson(xmlString: string) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    function xmlToJson(node: any): any {
      const obj: any = {};
      
      if (node.nodeType === 1) { // Element
        if (node.attributes.length > 0) {
          for (let i = 0; i < node.attributes.length; i++) {
            const attribute = node.attributes.item(i);
            obj[attribute.nodeName] = attribute.nodeValue;
          }
        }
      } else if (node.nodeType === 3) { // Text
        return node.nodeValue?.trim();
      }

      if (node.hasChildNodes()) {
        for (let child of node.childNodes) {
          const nodeName = child.nodeName;
          
          if (nodeName === '#text') {
            const text = child.nodeValue?.trim();
            if (text) {
              return text;
            }
          } else {
            if (obj[nodeName] === undefined) {
              obj[nodeName] = xmlToJson(child);
            } else {
              if (!Array.isArray(obj[nodeName])) {
                obj[nodeName] = [obj[nodeName]];
              }
              obj[nodeName].push(xmlToJson(child));
            }
          }
        }
      }
      
      return obj;
    }

    return xmlToJson(xmlDoc);
  } catch (error) {
    console.error('XML 파싱 오류:', error);
    return { error: 'XML 파싱 실패', message: error.message };
  }
}

// 간단한 메모리 캐시
const cache = new Map();

function setCached(key: string, value: any, ttl: number) {
  const expiry = Date.now() + ttl;
  cache.set(key, { value, expiry });
}

function getCached(key: string) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

// 반려동물 동반 가능한 키워드 목록
const petFriendlyKeywords = [
  '롯데프리미엄아울렛 동부산점', '몽작', '부산시민공원', '센텀 APEC나루공원', '신호공원', '오르디', '온천천시민공원', '칠암만장',
  '카페 만디', '포레스트3002', '홍법사(부산)', '감나무집', '광안리해변 테마거리', '광안리해수욕장', '구덕포끝집고기',
  '구포시장', '국립부산과학관', '그림하우스', '금강사(부산)', '다대포 꿈의 낙조분수', '다대포해수욕장', '대보름',
  '대저생태공원', '대저수문 생태공원', '더웨이브', '더펫텔프리미엄스위트', '덕미', '듀스포레', '드림서프라운지',
  '만달리', '맥도생태공원', '모닝듀 게스트 하우스(모닝듀)', '무명일기', '문탠로드', '민락수변공원', '밀락더마켓',
  '부산 감천문화마을', '부산 송도해상케이블카', '부산 송도해수욕장', '부산 암남공원', '부산 자갈치시장', '부산 태종대',
  '부산어촌민속관', '비프앤리프', '사직야구장', '서면', '성지곡수원지', '송도용궁구름다리', '송도해수욕장', '수변공원',
  '신세계센텀시티', '심심', '아미산전망대', '암남공원', '엘시티', '오션뷰펜션부산', '온천천', '용두산공원', '용미리',
  '원효대사 설법바위', '유엔기념공원', '을숙도생태공원', '을숙도철새공원', '이기대공원', '이기대도시자연공원', '임시야구장',
  '자갈치시장', '자갈치시장(관광특구)', '전포카페거리', '정관신도시', '조방원', '진해군항제', '차이나타운(부산)',
  '천마산공원', '초량이바구길', '컨벤션센터(벡스코)', '태종대', '파인트리', '팔레드시즈', '포차거리', '피씨방', 
  '하단', '해동용궁사', '해운대', '해운대구청', '해운대백병원', '해운대해수욕장', '회동수원지', '황령산', '형제가든',
  '홍법사', '화명생태공원', '화명신도시', '황령산', '낙동강', '다대포', '동래', '부산진', '사상', '사하', 
  '서구', '수영', '연제', '영도', '중구', '해운대', '기장'
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { areaCode, numOfRows, pageNo, keyword, activeTab, loadAllPetKeywords } = await req.json();
    
    console.log('=== Combined Tour API 호출 ===', {
      areaCode, numOfRows, pageNo, keyword, activeTab, loadAllPetKeywords
    });

    const apiKey = Deno.env.get('KOREA_TOUR_API_KEY');
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다');
    }

    let tourismData = null;
    let petTourismData = null;
    let tourismError = null;
    let petTourismError = null;

    // 1. 한국관광공사 일반 관광지 서비스 호출 (일반 관광지만)
    if (activeTab === "general") {
      try {
        let decodedApiKey = apiKey;
        try {
          decodedApiKey = decodeURIComponent(apiKey);
        } catch (e) {
          decodedApiKey = apiKey;
        }

        let tourismUrl;
        if (keyword && keyword.trim()) {
          tourismUrl = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=TravelApp&keyword=${encodeURIComponent(keyword.trim())}&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
        } else {
          tourismUrl = `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=TravelApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
        }
        console.log('Tourism API URL:', tourismUrl);

        const tourismResponse = await fetch(tourismUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/xml, text/xml, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('Tourism API Response Status:', tourismResponse.status);
        
        if (tourismResponse.ok) {
          const responseText = await tourismResponse.text();
          console.log('Tourism API Raw Response:', responseText.substring(0, 300));
          
          tourismData = parseXmlToJson(responseText);
          if (tourismData?.error) {
            tourismError = `Tourism API service error: ${tourismData.message}`;
            tourismData = null;
          }
          
          if (tourismData) {
            console.log('Tourism API Success');
          }
        } else {
          const responseText = await tourismResponse.text();
          tourismError = `Tourism API failed with status: ${tourismResponse.status}, body: ${responseText}`;
          console.error(tourismError);
        }
      } catch (error) {
        tourismError = `Tourism API error: ${error.message}`;
        console.error(tourismError);
      }
    }

    // 2. 한국관광공사 반려동물 동반 여행지 서비스 호출 (반려동물만)
    if (activeTab === "pet") {
      if (loadAllPetKeywords) {
        // 페이징 방식으로 모든 반려동물 여행지 수집
        console.log('=== 반려동물 여행지 페이징 수집 시작 ===');
        
        try {
          let decodedApiKey = apiKey;
          try {
            decodedApiKey = decodeURIComponent(apiKey);
          } catch (e) {
            decodedApiKey = apiKey;
          }
          
          const allResults = [];
          let currentPage = 1;
          const itemsPerPage = 100;
          const maxPages = 5; // 최대 5페이지까지
          
          while (currentPage <= maxPages) {
            console.log(`📄 페이지 ${currentPage} 수집 중...`);
            
            const pageUrl = `https://apis.data.go.kr/B551011/KorPetTourService/areaBasedList?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=${areaCode}&numOfRows=${itemsPerPage}&pageNo=${currentPage}&_type=xml`;
            
            try {
              const response = await fetch(pageUrl).catch(async (httpsError) => {
                const httpUrl = pageUrl.replace('https://', 'http://');
                return await fetch(httpUrl);
              });
              
              if (response.ok) {
                const responseText = await response.text();
                const parsedData = parseXmlToJson(responseText);
                
                if (parsedData?.response?.body?.items?.item) {
                  const items = Array.isArray(parsedData.response.body.items.item) 
                    ? parsedData.response.body.items.item 
                    : [parsedData.response.body.items.item];
                  
                  console.log(`✅ 페이지 ${currentPage}: ${items.length}개 수집`);
                  allResults.push(...items);
                  
                  if (items.length < itemsPerPage) {
                    console.log(`🏁 마지막 페이지 도달`);
                    break;
                  }
                } else {
                  console.log(`📭 페이지 ${currentPage}: 데이터 없음`);
                  break;
                }
              } else {
                console.log(`❌ 페이지 ${currentPage}: 오류 ${response.status}`);
                break;
              }
            } catch (error) {
              console.log(`💥 페이지 ${currentPage} 수집 실패: ${error.message}`);
              break;
            }
            
            currentPage++;
            
            // 페이지 간 딜레이
            if (currentPage <= maxPages) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
          
          console.log(`🎉 페이징 수집 완료! 총 ${allResults.length}개`);
          
          // 중복 제거 (contentid 기준)
          const uniqueResults = [];
          const seenIds = new Set();
          
          for (const item of allResults) {
            if (!seenIds.has(item.contentid)) {
              seenIds.add(item.contentid);
              uniqueResults.push(item);
            }
          }
          
          console.log(`중복 제거 후: ${uniqueResults.length}개`);
          
          petTourismData = {
            response: {
              header: { resultCode: "0000", resultMsg: "OK" },
              body: {
                totalCount: uniqueResults.length,
                numOfRows: uniqueResults.length,
                pageNo: 1,
                items: { item: uniqueResults }
              }
            }
          };
          
        } catch (error) {
          console.error('페이징 수집 중 오류:', error);
          petTourismError = `페이징 수집 오류: ${error.message}`;
        }
      } else {
        // 기존 방식: 단일 API 호출
        try {
          let decodedApiKey = apiKey;
          try {
            decodedApiKey = decodeURIComponent(apiKey);
          } catch (e) {
            decodedApiKey = apiKey;
          }
          
          let petTourismUrl;
          if (keyword && keyword.trim()) {
            petTourismUrl = `https://apis.data.go.kr/B551011/KorPetTourService/searchKeyword?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=PetTravelApp&keyword=${encodeURIComponent(keyword.trim())}&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
          } else {
            petTourismUrl = `https://apis.data.go.kr/B551011/KorPetTourService/areaBasedList?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
          }
          console.log('Pet Tourism API URL:', petTourismUrl);
          
          const petTourismResponse = await fetch(petTourismUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/xml, text/xml, */*',
              'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache'
            }
          }).catch(async (httpsError) => {
            console.log('Pet Tourism HTTPS failed, trying HTTP:', httpsError.message);
            const httpUrl = petTourismUrl.replace('https://', 'http://');
            return await fetch(httpUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/xml, text/xml, */*',
                'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache'
              }
            });
          });
          console.log('Pet Tourism API Response Status:', petTourismResponse.status);
          
          if (petTourismResponse.ok) {
            const responseText = await petTourismResponse.text();
            console.log('Pet Tourism API Raw Response:', responseText.substring(0, 300));
            
            petTourismData = parseXmlToJson(responseText);
            if (petTourismData?.error) {
              petTourismError = `Pet Tourism API service error: ${petTourismData.message}`;
              petTourismData = null;
            }
            
            if (petTourismData) {
              console.log('Pet Tourism API Success');
            }
          } else {
            const responseText = await petTourismResponse.text();
            petTourismError = `Pet Tourism API failed with status: ${petTourismResponse.status}, body: ${responseText}`;
            console.error(petTourismError);
          }
        } catch (error) {
          petTourismError = `Pet Tourism API error: ${error.message}`;
          console.error(petTourismError);
        }
      }
    }

    // 결과 확인 및 응답 구성
    if (activeTab === "general" && !tourismData) {
      throw new Error(`General Tourism API failed: ${tourismError}`);
    }
    
    if (activeTab === "pet" && !petTourismData) {
      throw new Error(`Pet Tourism API failed: ${petTourismError}`);
    }

    // 요청된 탭에 따라 해당 데이터만 반환
    const combinedData = {
      tourismData: activeTab === "general" ? (tourismData || { error: tourismError }) : null,
      petTourismData: activeTab === "pet" ? (petTourismData || { error: petTourismError }) : null,
      requestParams: { areaCode, numOfRows, pageNo, activeTab },
      timestamp: new Date().toISOString(),
      status: {
        tourism: activeTab === "general" ? (tourismData ? 'success' : 'failed') : 'not_requested',
        petTourism: activeTab === "pet" ? (petTourismData ? 'success' : 'failed') : 'not_requested'
      }
    };

    console.log('Final response prepared:', {
      activeTab,
      tourismSuccess: activeTab === "general" ? !!tourismData : 'not_requested',
      petTourismSuccess: activeTab === "pet" ? !!petTourismData : 'not_requested'
    });

    return new Response(JSON.stringify(combinedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in combined-tour-api function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});