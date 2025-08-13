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

    // 1. 한국관광공사 국문 관광정보 서비스 호출
    const tourismUrl = `https://apis.data.go.kr/B551011/KorService2/areaBasedList1?serviceKey=${apiKey}&_type=json&MobileOS=ETC&MobileApp=TestApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}`;
    
    // 2. 한국관광공사 반려동물 동반여행 서비스 호출  
    const petTourismUrl = `https://apis.data.go.kr/B551011/KorPetTourService/areaBasedList1?serviceKey=${apiKey}&_type=json&MobileOS=ETC&MobileApp=TestApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}`;

    console.log('Tourism API URL:', tourismUrl);
    console.log('Pet Tourism API URL:', petTourismUrl);

    // 두 API를 병렬로 호출
    const [tourismResponse, petTourismResponse] = await Promise.all([
      fetch(tourismUrl),
      fetch(petTourismUrl)
    ]);

    console.log('Tourism API Response Status:', tourismResponse.status);
    console.log('Pet Tourism API Response Status:', petTourismResponse.status);

    if (!tourismResponse.ok) {
      throw new Error(`Tourism API failed with status: ${tourismResponse.status}`);
    }

    if (!petTourismResponse.ok) {
      throw new Error(`Pet Tourism API failed with status: ${petTourismResponse.status}`);
    }

    // JSON 응답 파싱
    const tourismData = await tourismResponse.json();
    const petTourismData = await petTourismResponse.json();

    console.log('Tourism API Response:', JSON.stringify(tourismData, null, 2));
    console.log('Pet Tourism API Response:', JSON.stringify(petTourismData, null, 2));

    // 결합된 응답 반환
    const combinedData = {
      tourismData,
      petTourismData,
      requestParams: { areaCode, numOfRows, pageNo },
      timestamp: new Date().toISOString()
    };

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