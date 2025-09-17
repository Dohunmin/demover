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

    // 부산 동물병원 OpenAPI 호출 (XML 형태로 요청)
    const apiUrl = `http://apis.data.go.kr/6260000/BusanAnimalHospService/getTblAnimalHospital?serviceKey=${apiKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&resultType=xml`;
    
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

    const xmlText = await response.text();
    console.log('API Response XML:', xmlText);

    // XML 파싱 - 에러 체크
    if (xmlText.includes('<errMsg>') || xmlText.includes('SERVICE ERROR')) {
      console.error('API returned error response:', xmlText);
      return new Response(
        JSON.stringify({ 
          error: 'API service error - check API key configuration',
          hospitals: []
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let hospitals = [];
    
    // XML에서 병원 데이터 추출 (정규식 사용)
    const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/g);
    
    if (itemMatches) {
      hospitals = itemMatches.map(itemXml => {
        const extractValue = (tagName: string) => {
          const match = itemXml.match(new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`));
          return match ? match[1].trim() : '';
        };

        return {
          animal_hospital: extractValue('animal_hospital') || extractValue('ANIMAL_HOSPITAL'),
          road_address: extractValue('road_address') || extractValue('ROAD_ADDRESS'),
          tel: extractValue('tel') || extractValue('TEL'),
          gugun: extractValue('gugun') || extractValue('GUGUN'),
          lat: parseFloat(extractValue('lat') || extractValue('LAT')) || null,
          lon: parseFloat(extractValue('lon') || extractValue('LON')) || null,
          approval_date: extractValue('approval_date') || extractValue('APPROVAL_DATE') || extractValue('approval'),
          business_status: extractValue('business_status') || extractValue('BUSINESS_STATUS')
        };
      });
      console.log(`Parsed ${hospitals.length} hospitals from XML`);
    } else {
      // <item> 태그가 없는 경우 로그 출력
      console.log('No <item> tags found in XML');
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