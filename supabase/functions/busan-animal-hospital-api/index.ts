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

    // 부산 동물병원 OpenAPI 호출 (XML 형식으로 요청)
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
    console.log('API Response XML:', xmlText.substring(0, 500));

    // XML 파싱
    const parseXML = (xmlStr: string) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
      
      // XML 파싱 에러 체크
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.error('XML parsing error:', parserError.textContent);
        return null;
      }
      
      return xmlDoc;
    };

    const xmlDoc = parseXML(xmlText);
    if (!xmlDoc) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse XML response',
          hospitals: []
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('XML parsed successfully');

    let hospitals = [];
    
    // XML에서 동물병원 데이터 추출
    const items = xmlDoc.querySelectorAll('item');
    console.log(`Found ${items.length} hospital items in XML`);
    
    hospitals = Array.from(items).map(item => {
      const getTextContent = (tagName: string) => {
        const element = item.querySelector(tagName);
        return element ? element.textContent?.trim() || '' : '';
      };
      
      return {
        animal_hospital: getTextContent('animal_hospital'),
        road_address: getTextContent('road_address'),
        tel: getTextContent('tel'),
        gugun: getTextContent('gugun'),
        lat: parseFloat(getTextContent('lat')) || null,
        lon: parseFloat(getTextContent('lon')) || null,
        approval_date: getTextContent('approval_date'),
        business_status: getTextContent('business_status')
      };
    });

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