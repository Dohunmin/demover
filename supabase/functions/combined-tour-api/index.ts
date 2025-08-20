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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { areaCode = '6', numOfRows = '10', pageNo = '1', keyword = '', activeTab = 'general' } = await req.json().catch(() => ({}));
    
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

    // 1. 한국관광공사 국문 관광정보 서비스 호출 (일반 관광지)
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

    // 2. 한국관광공사 반려동물 동반 여행지 서비스 호출
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

    // 결과 확인 및 응답 구성
    if (!tourismData && !petTourismData) {
      throw new Error(`Both APIs failed. Tourism: ${tourismError}, Pet Tourism: ${petTourismError}`);
    }

    // 부분적으로라도 성공한 경우 데이터 반환
    const combinedData = {
      tourismData: tourismData || { error: tourismError },
      petTourismData: petTourismData || { error: petTourismError },
      requestParams: { areaCode, numOfRows, pageNo },
      timestamp: new Date().toISOString(),
      status: {
        tourism: tourismData ? 'success' : 'failed',
        petTourism: petTourismData ? 'success' : 'failed'
      }
    };

    console.log('Final response prepared:', {
      tourismSuccess: !!tourismData,
      petTourismSuccess: !!petTourismData
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