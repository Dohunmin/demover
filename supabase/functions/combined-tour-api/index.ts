import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// XML을 JSON으로 변환하는 간단한 파서
function parseXmlToJson(xmlText: string) {
  try {
    // OpenAPI_ServiceResponse 구조 파싱
    const headerMatch = xmlText.match(/<header>(.*?)<\/header>/s);
    const bodyMatch = xmlText.match(/<body>(.*?)<\/body>/s);
    
    if (!headerMatch || !bodyMatch) {
      throw new Error('Invalid XML structure');
    }
    
    const header = parseXmlNode(headerMatch[1]);
    const body = parseXmlNode(bodyMatch[1]);
    
    return {
      response: {
        header,
        body
      }
    };
  } catch (error) {
    console.error('XML parsing error:', error);
    return null;
  }
}

function parseXmlNode(xmlContent: string) {
  const result: any = {};
  
  // resultCode, resultMsg 등 단순 태그 파싱
  const simpleTagRegex = /<(\w+)>([^<]*)<\/\1>/g;
  let match;
  
  while ((match = simpleTagRegex.exec(xmlContent)) !== null) {
    const [, tagName, value] = match;
    result[tagName] = value;
  }
  
  // items 구조 파싱
  const itemsMatch = xmlContent.match(/<items>(.*?)<\/items>/s);
  if (itemsMatch) {
    const itemsContent = itemsMatch[1];
    const itemRegex = /<item>(.*?)<\/item>/gs;
    const items = [];
    
    let itemMatch;
    while ((itemMatch = itemRegex.exec(itemsContent)) !== null) {
      const itemContent = itemMatch[1];
      const itemData = parseXmlNode(itemContent);
      items.push(itemData);
    }
    
    result.items = { item: items };
  }
  
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { areaCode = '1', numOfRows = '10', pageNo = '1' } = await req.json().catch(() => ({}));
    
    const apiKey = Deno.env.get('KOREA_TOUR_API_KEY');
    if (!apiKey) {
      throw new Error('KOREA_TOUR_API_KEY not found in environment variables');
    }

    console.log('Calling Korean Tourism APIs with params:', { areaCode, numOfRows, pageNo });

    // 응답 데이터 초기화
    let tourismData = null;
    let petTourismData = null;
    let tourismError = null;
    let petTourismError = null;

    // 1. 한국관광공사 국문 관광정보 서비스 호출 (일반 관광지)
    try {
      const encodedApiKey = encodeURIComponent(apiKey);
      const tourismUrl = `http://apis.data.go.kr/B551011/KorService1/areaBasedList1?serviceKey=${encodedApiKey}&_type=json&MobileOS=ETC&MobileApp=TestApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}`;
      console.log('Tourism API URL:', tourismUrl);
      
      const tourismResponse = await fetch(tourismUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Supabase-Edge-Function)',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      console.log('Tourism API Response Status:', tourismResponse.status);
      
      if (tourismResponse.ok) {
        const responseText = await tourismResponse.text();
        console.log('Tourism API Raw Response:', responseText.substring(0, 200));
        
        // XML 응답인지 확인
        if (responseText.trim().startsWith('<?xml') || responseText.trim().startsWith('<OpenAPI_ServiceResponse>')) {
          // XML 파싱 로직 (간단한 정규식 사용)
          tourismData = parseXmlToJson(responseText);
        } else {
          try {
            tourismData = JSON.parse(responseText);
          } catch (jsonError) {
            console.error('JSON Parse Error:', jsonError);
            tourismError = `Tourism API JSON parse error: ${jsonError.message}`;
          }
        }
        console.log('Tourism API Success');
      } else {
        const responseText = await tourismResponse.text();
        tourismError = `Tourism API failed with status: ${tourismResponse.status}, body: ${responseText}`;
        console.error(tourismError);
      }
    } catch (error) {
      tourismError = `Tourism API error: ${error.message}`;
      console.error(tourismError);
    }

    // 2. 한국관광공사 국문 관광정보 서비스 호출 (반려동물 동반 여행지 - contentTypeId=39)
    try {
      const encodedApiKey = encodeURIComponent(apiKey);
      const petTourismUrl = `http://apis.data.go.kr/B551011/KorService1/areaBasedList1?serviceKey=${encodedApiKey}&_type=json&MobileOS=ETC&MobileApp=TestApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&contentTypeId=39`;
      console.log('Pet Tourism API URL:', petTourismUrl);
      
      const petTourismResponse = await fetch(petTourismUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Supabase-Edge-Function)',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      console.log('Pet Tourism API Response Status:', petTourismResponse.status);
      
      if (petTourismResponse.ok) {
        const responseText = await petTourismResponse.text();
        console.log('Pet Tourism API Raw Response:', responseText.substring(0, 200));
        
        // XML 응답인지 확인
        if (responseText.trim().startsWith('<?xml') || responseText.trim().startsWith('<OpenAPI_ServiceResponse>')) {
          // XML 파싱 로직 (간단한 정규식 사용)
          petTourismData = parseXmlToJson(responseText);
        } else {
          try {
            petTourismData = JSON.parse(responseText);
          } catch (jsonError) {
            console.error('JSON Parse Error:', jsonError);
            petTourismError = `Pet Tourism API JSON parse error: ${jsonError.message}`;
          }
        }
        console.log('Pet Tourism API Success');
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