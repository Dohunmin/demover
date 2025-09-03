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

    // 부산 동물병원 OpenAPI 호출
    const apiUrl = `https://apis.data.go.kr/6260000/BusanAnimalHospService/getTblAnimalHospital?serviceKey=${apiKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&resultType=json`;
    
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl);
    
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
    console.log('API Response:', JSON.stringify(data));

    let hospitals = [];
    
    // API 응답 구조에 따라 데이터 추출
    if (data && data.getTblAnimalHospital && data.getTblAnimalHospital.item) {
      hospitals = Array.isArray(data.getTblAnimalHospital.item) 
        ? data.getTblAnimalHospital.item 
        : [data.getTblAnimalHospital.item];
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