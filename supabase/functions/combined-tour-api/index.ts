import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// XML을 JSON으로 변환하는 간단한 파서
function parseXmlToJson(xmlText: string) {
  try {
    console.log('Parsing XML content:', xmlText.substring(0, 500));
    
    // SERVICE ERROR 체크
    if (xmlText.includes('SERVICE ERROR') || xmlText.includes('NO_OPENAPI_SERVICE_ERROR')) {
      const errorMatch = xmlText.match(/<errMsg>(.*?)<\/errMsg>/);
      const errorMsg = errorMatch ? errorMatch[1] : 'Unknown service error';
      console.error('API Service Error:', errorMsg);
      return {
        error: true,
        message: errorMsg
      };
    }
    
    // 정상 응답 파싱
    const result: any = {};
    
    // resultCode 추출
    const resultCodeMatch = xmlText.match(/<resultCode>(\d+)<\/resultCode>/);
    const resultMsgMatch = xmlText.match(/<resultMsg>([^<]*)<\/resultMsg>/);
    const totalCountMatch = xmlText.match(/<totalCount>(\d+)<\/totalCount>/);
    const numOfRowsMatch = xmlText.match(/<numOfRows>(\d+)<\/numOfRows>/);
    const pageNoMatch = xmlText.match(/<pageNo>(\d+)<\/pageNo>/);
    
    const header = {
      resultCode: resultCodeMatch ? resultCodeMatch[1] : '99',
      resultMsg: resultMsgMatch ? resultMsgMatch[1] : 'UNKNOWN ERROR'
    };
    
    const body: any = {
      totalCount: totalCountMatch ? parseInt(totalCountMatch[1]) : 0,
      numOfRows: numOfRowsMatch ? parseInt(numOfRowsMatch[1]) : 0,
      pageNo: pageNoMatch ? parseInt(pageNoMatch[1]) : 1
    };
    
    // items 파싱 - item 태그들을 찾아서 배열로 변환
    const itemRegex = /<item>(.*?)<\/item>/gs;
    const items = [];
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
      const itemContent = itemMatch[1];
      const item: any = {};
      
      // 각 item 내의 필드들 파싱
      const fieldRegex = /<(\w+)>([^<]*)<\/\1>/g;
      let fieldMatch;
      
      while ((fieldMatch = fieldRegex.exec(itemContent)) !== null) {
        const [, fieldName, fieldValue] = fieldMatch;
        item[fieldName] = fieldValue;
      }
      
      if (Object.keys(item).length > 0) {
        items.push(item);
      }
    }
    
    if (items.length > 0) {
      body.items = { item: items };
    }
    
    result.response = { header, body };
    
    console.log('Parsed XML result:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.error('XML parsing error:', error);
    return {
      error: true,
      message: `XML parsing failed: ${error.message}`
    };
  }
}

// 반려동물 동반 가능한 키워드 목록
const petFriendlyKeywords = [
  '롯데프리미엄아울렛 동부산점', '몽작', '부산시민공원', '센텀 APEC나루공원', '신호공원', '오르디', '온천천시민공원', '칠암만장',
  '카페 만디', '포레스트3002', '홍법사(부산)', '감나무집', '광안리해변 테마거리', '광안리해수욕장', '구덕포끝집고기',
  '구포시장', '국립부산과학관', '그림하우스', '금강사(부산)', '다대포 꿈의 낙조분수', '다대포해수욕장', '대보름',
  '대저생태공원', '대저수문 생태공원', '더웨이브', '더펫텔프리미엄스위트', '덕미', '듀스포레', '드림서프라운지', '만달리',
  '맥도생태공원', '모닝듀 게스트 하우스(모닝듀)', '무명일기', '문탠로드', '민락수변공원', '밀락더마켓', '부산 감천문화마을',
  '부산 송도해상케이블카', '부산 송도해수욕장', '부산 암남공원', '부산북항 친수공원', '부산어린이대공원', '불란서그로서리',
  '브리타니', '비아조', '빅토리아 베이커리 가든', '삼락생태공원', '성안집', '송도 구름산책로', '송정물총칼국수',
  '송정해수욕장', '스노잉클라우드', '스포원파크', '신세계사이먼 부산 프리미엄 아울렛', '아르반호텔[한국관광 품질인증/Korea Quality]',
  '아미르공원', '알로이삥삥', '옐로우라이트하우스', '오구카페', '용소웰빙공원', '원시학', '웨스턴챔버', '웨이브온 커피',
  '윙민박', '유정1995 기장 본점', '을숙도 공원', '이바구캠프', '장림포구', '절영해안산책로', '죽성드림세트장',
  '카페베이스', '카페윤', '캐빈스위트광안', '캔버스', '캔버스 블랙', '태종대', '팝콘 호스텔 해운대점', '프루터리포레스트',
  '해동용궁사', '해운대 달맞이길', '해운대 동백섬', '해운대 블루라인파크', '해운대 영무파라드호텔', '해운대해수욕장',
  '해월전망대', '형제가든', '황령산', '황령산 전망대', '황령산레포츠공원', '회동수원지', '회동수원지 둘레길',
  'AJ하우스(AJ House)', 'EL16.52', 'JSTAY', 'The Park Guest House'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { areaCode = '6', numOfRows = '10', pageNo = '1', keyword = '', activeTab = 'general', loadAllPetKeywords = false } = await req.json().catch(() => ({}));
    
    const apiKey = Deno.env.get('KOREA_TOUR_API_KEY');
    if (!apiKey) {
      throw new Error('KOREA_TOUR_API_KEY not found in environment variables');
    }

    console.log('Calling Korean Tourism APIs with params:', { areaCode, numOfRows, pageNo, keyword, activeTab });

    // 응답 데이터 초기화
    let tourismData = null;
    let petTourismData = null;
    let tourismError = null;
    let petTourismError = null;

    // activeTab에 따라 해당하는 API만 호출
    if (activeTab === "general") {
      // 1. 한국관광공사 국문 관광정보 서비스 호출 (일반 관광지만)
      try {
        // API 키 디코딩 시도 (중복 인코딩 문제 해결)
        let decodedApiKey = apiKey;
        try {
          decodedApiKey = decodeURIComponent(apiKey);
        } catch (e) {
          // 디코딩 실패 시 원본 사용
          decodedApiKey = apiKey;
        }
        
        // 키워드가 있으면 검색 API 사용, 없으면 지역별 목록 API 사용
        let tourismUrl;
        if (keyword && keyword.trim()) {
          // 검색 기반 정보 서비스 API 사용
          tourismUrl = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=PetTravelApp&keyword=${encodeURIComponent(keyword.trim())}&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
        } else {
          // 지역 기반 목록 API 사용
          tourismUrl = `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
        }
        console.log('Tourism API URL:', tourismUrl);
        
        // HTTPS 요청 시도
        let tourismResponse = await fetch(tourismUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/xml, text/xml, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
          }
        }).catch(async (httpsError) => {
          console.log('HTTPS failed, trying HTTP:', httpsError.message);
          // HTTPS 실패 시 HTTP로 재시도
          const httpUrl = tourismUrl.replace('https://', 'http://');
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
        console.log('Tourism API Response Status:', tourismResponse.status);
        
        if (tourismResponse.ok) {
          const responseText = await tourismResponse.text();
          console.log('Tourism API Raw Response:', responseText.substring(0, 300));
          
          // 항상 XML로 파싱 시도 (API가 XML을 반환함)
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

    if (activeTab === "pet") {
      // 2. 한국관광공사 반려동물 동반 여행지 서비스 호출 (반려동물만)
      if (loadAllPetKeywords) {
        // 95개 키워드로 모든 반려동물 여행지 검색
        console.log('Loading all pet-friendly places using', petFriendlyKeywords.length, 'keywords');
        
        try {
          let decodedApiKey = apiKey;
          try {
            decodedApiKey = decodeURIComponent(apiKey);
          } catch (e) {
            decodedApiKey = apiKey;
          }
          
          const allResults = [];
          let totalSearched = 0;
          
          // 키워드를 청크로 나누어 병렬 처리 (API 한도 고려해서 5개씩)
          const chunkSize = 5;
          for (let i = 0; i < petFriendlyKeywords.length; i += chunkSize) {
            const chunk = petFriendlyKeywords.slice(i, i + chunkSize);
            
            const promises = chunk.map(async (keywordItem) => {
              const searchUrl = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=PetTravelApp&keyword=${encodeURIComponent(keywordItem)}&areaCode=${areaCode}&numOfRows=20&pageNo=1&_type=xml`;
              
              try {
                const response = await fetch(searchUrl).catch(async (httpsError) => {
                  const httpUrl = searchUrl.replace('https://', 'http://');
                  return await fetch(httpUrl);
                });
                
                if (response.ok) {
                  const responseText = await response.text();
                  const parsedData = parseXmlToJson(responseText);
                  
                  if (parsedData?.response?.body?.items?.item) {
                    const items = Array.isArray(parsedData.response.body.items.item) 
                      ? parsedData.response.body.items.item 
                      : [parsedData.response.body.items.item];
                    
                    return items.map(item => ({
                      ...item,
                      searchKeyword: keywordItem // 어떤 키워드로 찾았는지 표시
                    }));
                  }
                }
                return [];
              } catch (error) {
                console.log(`Keyword "${keywordItem}" search failed:`, error.message);
                return [];
              }
            });
            
            const chunkResults = await Promise.all(promises);
            chunkResults.forEach(result => {
              if (result.length > 0) {
                allResults.push(...result);
              }
            });
            
            totalSearched += chunk.length;
            console.log(`Processed ${totalSearched}/${petFriendlyKeywords.length} keywords`);
            
            // API 한도를 고려한 딜레이 (1초)
            if (i + chunkSize < petFriendlyKeywords.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          // 중복 제거 (contentid 기준)
          const uniqueResults = [];
          const seenIds = new Set();
          
          for (const item of allResults) {
            if (!seenIds.has(item.contentid)) {
              seenIds.add(item.contentid);
              uniqueResults.push(item);
            }
          }
          
          console.log(`Found ${allResults.length} total results, ${uniqueResults.length} unique results`);
          
          // 응답 형태로 구성
          petTourismData = {
            response: {
              header: {
                resultCode: "0000",
                resultMsg: "OK"
              },
              body: {
                totalCount: uniqueResults.length,
                numOfRows: uniqueResults.length,
                pageNo: 1,
                items: {
                  item: uniqueResults
                }
              }
            }
          };
          
        } catch (error) {
          petTourismError = `Pet keywords search error: ${error.message}`;
          console.error(petTourismError);
        }
        
      } else {
        // 기존 방식: 단일 API 호출
      try {
        // API 키 디코딩 시도 (중복 인코딩 문제 해결)
        let decodedApiKey = apiKey;
        try {
          decodedApiKey = decodeURIComponent(apiKey);
        } catch (e) {
          // 디코딩 실패 시 원본 사용
          decodedApiKey = apiKey;
        }
        
        // 키워드가 있으면 검색 API 사용, 없으면 지역별 목록 API 사용
        let petTourismUrl;
        if (keyword && keyword.trim()) {
          // 반려동물 검색 기반 정보 서비스 API 사용
          petTourismUrl = `https://apis.data.go.kr/B551011/KorPetTourService/searchKeyword?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=PetTravelApp&keyword=${encodeURIComponent(keyword.trim())}&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
        } else {
          // 반려동물 지역 기반 목록 API 사용
          petTourismUrl = `https://apis.data.go.kr/B551011/KorPetTourService/areaBasedList?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
        }
        console.log('Pet Tourism API URL:', petTourismUrl);
        
        // HTTPS 요청 시도
        let petTourismResponse = await fetch(petTourismUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/xml, text/xml, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
          }
        }).catch(async (httpsError) => {
          console.log('Pet Tourism HTTPS failed, trying HTTP:', httpsError.message);
          // HTTPS 실패 시 HTTP로 재시도
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
          
          // 항상 XML로 파싱 시도 (API가 XML을 반환함)
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