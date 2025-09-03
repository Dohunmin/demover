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
    const apiKey = Deno.env.get('BUSAN_ANIMAL_HOSPITAL_API_KEY');
    if (!apiKey) {
      console.error('BUSAN_ANIMAL_HOSPITAL_API_KEY not found');
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured',
          hospitals: []
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { pageNo = 1, numOfRows = 300, gugun = '', hospitalName = '' } = await req.json();

    console.log('Fetching animal hospital data with params:', { pageNo, numOfRows, gugun, hospitalName });

    // 부산 동물병원 OpenAPI 호출 (HTTPS 먼저 시도, 실패시 HTTP로 fallback)
    let apiUrl = `https://apis.data.go.kr/6260000/BusanAnimalHospService/getTblAnimalHospital?serviceKey=${apiKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&resultType=json`;
    
    console.log('HTTPS API URL:', apiUrl);

    let response;
    try {
      response = await fetch(apiUrl);
    } catch (httpsError) {
      console.log('HTTPS failed, trying HTTP:', httpsError.message);
      
      // HTTP로 재시도
      apiUrl = `http://apis.data.go.kr/6260000/BusanAnimalHospService/getTblAnimalHospital?serviceKey=${apiKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&resultType=json`;
      console.log('HTTP API URL:', apiUrl);
      
      response = await fetch(apiUrl);
    }
    
    if (!response.ok) {
      console.error('API Response Error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: `API call failed: ${response.status}`,
          hospitals: []
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('API Response Structure:', JSON.stringify(data, null, 2));

    let hospitals = [];
    
    // 다양한 API 응답 구조에 대응
    if (data) {
      // 구조 1: data.getTblAnimalHospital.item
      if (data.getTblAnimalHospital && data.getTblAnimalHospital.item) {
        hospitals = Array.isArray(data.getTblAnimalHospital.item) 
          ? data.getTblAnimalHospital.item 
          : [data.getTblAnimalHospital.item];
      }
      // 구조 2: data.response.body.items (일반적인 정부 API 구조)
      else if (data.response && data.response.body && data.response.body.items) {
        hospitals = Array.isArray(data.response.body.items) 
          ? data.response.body.items 
          : [data.response.body.items];
      }
      // 구조 3: data.items
      else if (data.items) {
        hospitals = Array.isArray(data.items) ? data.items : [data.items];
      }
      // 구조 4: data가 배열인 경우
      else if (Array.isArray(data)) {
        hospitals = data;
      }
      // 구조 5: data 자체가 단일 객체인 경우
      else if (typeof data === 'object' && data.animal_hospital) {
        hospitals = [data];
      }
    }

    console.log(`Raw hospitals count: ${hospitals.length}`);
    if (hospitals.length > 0) {
      console.log('First hospital sample:', JSON.stringify(hospitals[0], null, 2));
    }

    // 검색 필터 적용
    if (gugun || hospitalName) {
      hospitals = hospitals.filter(hospital => {
        const matchesGugun = !gugun || (hospital.gugun && hospital.gugun.includes(gugun));
        const matchesName = !hospitalName || (hospital.animal_hospital && hospital.animal_hospital.includes(hospitalName));
        return matchesGugun && matchesName;
      });
    }

    console.log(`Filtered hospitals count: ${hospitals.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        hospitals: hospitals,
        totalCount: hospitals.length,
        filters: { gugun, hospitalName }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        hospitals: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});