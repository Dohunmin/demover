import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 1. 한국관광공사 국문 관광정보 서비스 호출 (개별 처리)
    try {
      const tourismUrl = `https://apis.data.go.kr/B551011/KorService2/areaBasedList1?serviceKey=${apiKey}&_type=json&MobileOS=ETC&MobileApp=TestApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}`;
      console.log('Tourism API URL:', tourismUrl);
      
      const tourismResponse = await fetch(tourismUrl);
      console.log('Tourism API Response Status:', tourismResponse.status);
      
      if (tourismResponse.ok) {
        tourismData = await tourismResponse.json();
        console.log('Tourism API Success');
      } else {
        tourismError = `Tourism API failed with status: ${tourismResponse.status}`;
        console.error(tourismError);
      }
    } catch (error) {
      tourismError = `Tourism API error: ${error.message}`;
      console.error(tourismError);
    }

    // 2. 한국관광공사 반려동물 동반여행 서비스 호출 (개별 처리)
    try {
      const petTourismUrl = `https://apis.data.go.kr/B551011/KorPetTourService/areaBasedList1?serviceKey=${apiKey}&_type=json&MobileOS=ETC&MobileApp=TestApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}`;
      console.log('Pet Tourism API URL:', petTourismUrl);
      
      const petTourismResponse = await fetch(petTourismUrl);
      console.log('Pet Tourism API Response Status:', petTourismResponse.status);
      
      if (petTourismResponse.ok) {
        petTourismData = await petTourismResponse.json();
        console.log('Pet Tourism API Success');
      } else {
        petTourismError = `Pet Tourism API failed with status: ${petTourismResponse.status}`;
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