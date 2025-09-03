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
  '롯데프리미엄아울렛 동부산점', '동백섬', '더베이101', '해운대시장', '누리마루APEC하우스', '해운대해수욕장', '센텀시티', '광안리해수욕장',
  '광안대교', '영화의전당', '부산시립미술관', '부산박물관', '부산현대미술관', '부산문화회관', '부산시민공원', '용두산공원', 
  '태종대', '흰여울문화마을', '감천문화마을', '부산항대교', '자갈치시장', '국제시장', '보수동책방골목', '40계단문화관', 
  '망미동먹거리거리', '서면', '남포동', '부산역', '부산항', '송도해수욕장', '송도케이블카', '송도구름산책로', '암남공원',
  '다대포해수욕장', '몰운대', '낙동강하구에코센터', '을숙도', '강서습지생태공원', '대저생태공원', '화명생태공원', '삼락생태공원',
  '온천천', '수영강', '동래온천', '금정산', '범어사', '금정산성', '동래읍성', '복천박물관', '동래향교', '부산어린이대공원',
  '기장군', '해동용궁사', '국립부산과학관', '아홉산숲', '정관신도시', '일광해수욕장', '임랑해수욕장', '죽성드림세트장',
  '기장시장', '용궁사', '장안사', '불광사', '개운포구', '연화리마을', '이가리닻바위', '죽도공원', '대변항', '월전리',
  '구포시장', '덕천공원', '만덕고개', '화명공원', '북구청', '구포역', '덕포역', '만덕터널', '낙동강', '금곡동',
  '아시아드주경기장', '부산종합운동장', '학장동', '신평동', '다대동', '괴정동', '하단동', '장림동', '구덕운동장', '승학산',
  '을숙도문화회관', '부산진시장', '서부산유통지구', '홈플러스 사하점', '부산외국어고등학교', '신라대학교', '몰운대전망대',
  '구덕터널', '신평·장림생태공원', '하단역', '다대역', '신평역', '괴정역', '서대신역', '동대신역', '부산진역', '초량역'
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