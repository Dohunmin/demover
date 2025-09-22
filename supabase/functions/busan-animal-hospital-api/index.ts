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

    // 부산 동물병원 OpenAPI 호출 (HTTP 직접 사용 - Deno TLS 호환성 문제로 인해)
    const apiUrl = `http://apis.data.go.kr/6260000/BusanAnimalHospService/getTblAnimalHospital?serviceKey=${apiKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&resultType=json`;
    
    console.log('HTTP API URL:', apiUrl);

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

    let data;
    let hospitals = [];
    
    // 응답 텍스트를 먼저 가져와서 JSON/XML 판단
    const responseText = await response.text();
    console.log('Raw response (first 500 chars):', responseText.substring(0, 500));
    
    try {
      // JSON 파싱 시도
      data = JSON.parse(responseText);
      console.log('✅ JSON 파싱 성공');
    } catch (jsonError) {
      console.log('⚠️ JSON 파싱 실패 → XML fallback');
      
      // XML 파싱 시도
      try {
        const xmlParser = new DOMParser();
        const xmlDoc = xmlParser.parseFromString(responseText, 'text/xml');
        
        // XML 에러 체크
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
          throw new Error('XML parsing failed: ' + parseError.textContent);
        }
        
        // XML을 JSON으로 변환
        const items = Array.from(xmlDoc.querySelectorAll('item'));
        hospitals = items.map(item => {
          const hospital: any = {};
          Array.from(item.children).forEach(child => {
            hospital[child.tagName] = child.textContent;
          });
          return hospital;
        });
        
        console.log(`✅ XML 파싱 성공: ${hospitals.length}개 병원 데이터 추출`);
        
        // 바로 필터링하고 리턴하도록 data를 null로 설정
        data = null;
      } catch (xmlError) {
        console.error('XML 파싱도 실패:', xmlError);
        throw new Error('Both JSON and XML parsing failed');
      }
    }
    
    // JSON 데이터가 있는 경우에만 구조 체크
    if (data) {
      // 부산 동물병원 API 응답 구조에 맞게 데이터 추출
      if (data.response && data.response.body && data.response.body.items) {
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