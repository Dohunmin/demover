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

    // GET 방식으로 파라미터 받기
    const url = new URL(req.url);
    const pageNo = url.searchParams.get('pageNo') || '1';
    const numOfRows = url.searchParams.get('numOfRows') || '300';
    const gugun = url.searchParams.get('gugun') || '';
    const hospitalName = url.searchParams.get('hospitalName') || '';

    console.log('Fetching animal hospital data with params:', { pageNo, numOfRows, gugun, hospitalName });

    // 여러 API 엔드포인트 시도
    const possibleUrls = [
      // 표준 공공데이터 형식 1
      `http://apis.data.go.kr/6260000/BusanAnimalHospService/getTblAnimalHospital?serviceKey=${encodeURIComponent(apiKey)}&pageNo=${pageNo}&numOfRows=${numOfRows}&_type=json`,
      // 표준 공공데이터 형식 2  
      `http://apis.data.go.kr/6260000/BusanAnimalHospService/getTblAnimalHospital?serviceKey=${encodeURIComponent(apiKey)}&pageNo=${pageNo}&numOfRows=${numOfRows}&resultType=json`,
      // 부산시 형식 1
      `http://apis.data.go.kr/6260000/AnimalHospitalService/getAnimalHospitalList?serviceKey=${encodeURIComponent(apiKey)}&pageNo=${pageNo}&numOfRows=${numOfRows}&type=json`,
      // 부산시 형식 2
      `http://apis.data.go.kr/6260000/BusanOpenDataService/getAnimalHospital?serviceKey=${encodeURIComponent(apiKey)}&pageNo=${pageNo}&numOfRows=${numOfRows}&dataType=json`
    ];

    let response = null;
    let apiUrl = '';
    
    // 각 URL을 순서대로 시도
    for (const url of possibleUrls) {
      try {
        console.log(`Trying API URL: ${url}`);
        apiUrl = url;
        response = await fetch(url);
        
        if (response.ok) {
          console.log(`Success with URL: ${url}`);
          break;
        } else {
          console.log(`Failed with status ${response.status} for URL: ${url}`);
        }
      } catch (error) {
        console.log(`Error with URL ${url}:`, error.message);
      }
    }

    if (!response || !response.ok) {
      console.log('All API URLs failed, returning test data');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'All API endpoints failed',
          message: '부산시 동물병원 API 엔드포인트를 찾을 수 없습니다.',
          hospitals: [
            {
              animal_hospital: '테스트 동물병원',
              road_address: '부산광역시 해운대구 테스트로 123',
              tel: '051-123-4567',
              gugun: '해운대구',
              approval_date: '2024-01-01'
            }
          ],
          totalCount: 1,
          note: 'This is test data because the API is not accessible'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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

    // API가 XML을 반환하는지 JSON을 반환하는지 확인
    const responseText = await response.text();
    console.log('Raw API Response (first 500 chars):', responseText.substring(0, 500));
    
    let data;
    try {
      // JSON 파싱 시도
      data = JSON.parse(responseText);
      console.log('Successfully parsed as JSON');
    } catch (jsonError) {
      console.log('JSON parsing failed, response appears to be XML or HTML');
      console.log('Response content type:', response.headers.get('content-type'));
      
      // XML 응답인 경우 간단한 XML 파싱 (필요한 데이터만 추출)
      if (responseText.includes('<')) {
        // XML 파싱을 위한 기본적인 처리
        const hospitals = [];
        
        // 테스트용 더미 데이터 반환 (실제로는 XML 파서가 필요)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'API returns XML instead of JSON',
            message: 'API가 JSON 대신 XML을 반환합니다. XML 파싱이 필요합니다.',
            hospitals: [],
            rawResponse: responseText.substring(0, 1000)
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`JSON parsing failed: ${jsonError.message}`);
    }

    let hospitals = [];
    
    // 부산 동물병원 API 응답 구조에 맞게 데이터 추출
    if (data?.response?.body?.items) {
      const items = data.response.body.items.item;
      hospitals = Array.isArray(items) ? items : [items];
      console.log(`Extracted ${hospitals.length} hospitals from response.body.items.item`);
    }
    // Fallback: 다른 구조들 확인
    else if (data?.getTblAnimalHospital?.item) {
      const items = data.getTblAnimalHospital.item;
      hospitals = Array.isArray(items) ? items : [items];
      console.log(`Extracted ${hospitals.length} hospitals from getTblAnimalHospital.item`);
    }
    else if (data?.items) {
      const items = data.items;
      hospitals = Array.isArray(items) ? items : [items];
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