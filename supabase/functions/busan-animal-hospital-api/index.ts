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
    console.log('Using API Key:', apiKey ? '***' + apiKey.slice(-4) : 'MISSING');

    // 부산 동물병원 OpenAPI 호출 - HTTP 사용 (HTTPS SSL 이슈로 인해)
    const apiUrl = `http://apis.data.go.kr/6260000/BusanAnimalHospService/getTblAnimalHospital?serviceKey=${apiKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&resultType=json`;
    
    console.log('API URL (without key):', apiUrl.replace(apiKey, '***'));

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PetTravelApp/1.0'
      }
    });
    
    console.log('API Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response Error:', response.status, response.statusText);
      console.error('Error Response Body:', errorText);
      
      // 에러 응답도 파싱해보기
      if (errorText.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) {
        console.error('API Key is not registered or invalid');
        return new Response(
          JSON.stringify({ 
            error: 'API key is not registered or invalid',
            hospitals: []
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `API call failed: ${response.status} - ${errorText}`,
          hospitals: []
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseText = await response.text();
    console.log('Raw API Response:', responseText.substring(0, 500) + '...');
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response was not valid JSON:', responseText.substring(0, 200));
      return new Response(
        JSON.stringify({ 
          error: 'API returned invalid JSON',
          hospitals: []
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('Parsed API Response Structure:', JSON.stringify(data, null, 2));

    let hospitals = [];
    
    // 부산 동물병원 API 응답 구조에 맞게 데이터 추출
    if (data && data.response && data.response.body && data.response.body.items) {
      const items = data.response.body.items.item;
      hospitals = Array.isArray(items) ? items : [items];
      console.log(`Extracted ${hospitals.length} hospitals from response.body.items.item`);
    }
    // Fallback: 다른 구조들 확인
    else if (data.getTblAnimalHospital && data.getTblAnimalHospital.item) {
      hospitals = Array.isArray(data.getTblAnimalHospital.item) 
        ? data.getTblAnimalHospital.item 
        : [data.getTblAnimalHospital.item];
      console.log(`Extracted ${hospitals.length} hospitals from getTblAnimalHospital.item`);
    }
    else if (data.items) {
      hospitals = Array.isArray(data.items) ? data.items : [data.items];
      console.log(`Extracted ${hospitals.length} hospitals from items`);
    }
    else if (Array.isArray(data)) {
      hospitals = data;
      console.log(`Extracted ${hospitals.length} hospitals from root array`);
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