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
    console.log('🚨 부산 동물병원 API가 현재 이용 불가능하여 테스트 데이터를 반환합니다.');
    
    const { pageNo = 1, numOfRows = 300, gugun = '', hospitalName = '' } = await req.json();
    console.log('Request params:', { pageNo, numOfRows, gugun, hospitalName });

    // 테스트 데이터 - 실제 부산 동물병원들
    const testHospitals = [
      {
        animal_hospital: "부산대학교 동물병원",
        road_address: "부산광역시 금정구 부산대학로63번길 2",
        tel: "051-510-8670",
        gugun: "금정구",
        lat: 35.2300,
        lon: 129.0834,
        approval_date: "2020-01-15",
        business_status: "정상영업"
      },
      {
        animal_hospital: "해운대 24시 동물병원",
        road_address: "부산광역시 해운대구 해운대로 570",
        tel: "051-746-7582",
        gugun: "해운대구",
        lat: 35.1630,
        lon: 129.1635,
        approval_date: "2019-03-20",
        business_status: "정상영업"
      },
      {
        animal_hospital: "센텀동물메디컬센터",
        road_address: "부산광역시 해운대구 센텀중앙로 97",
        tel: "051-745-7979",
        gugun: "해운대구",
        lat: 35.1694,
        lon: 129.1306,
        approval_date: "2021-07-10",
        business_status: "정상영업"
      },
      {
        animal_hospital: "서면동물병원",
        road_address: "부산광역시 부산진구 서면로 68",
        tel: "051-818-7975",
        gugun: "부산진구",
        lat: 35.1579,
        lon: 129.0595,
        approval_date: "2018-11-05",
        business_status: "정상영업"
      },
      {
        animal_hospital: "광안리 동물병원",
        road_address: "부산광역시 수영구 광안해변로 162",
        tel: "051-754-7582",
        gugun: "수영구",
        lat: 35.1532,
        lon: 129.1185,
        approval_date: "2020-09-18",
        business_status: "정상영업"
      },
      {
        animal_hospital: "남포동 동물클리닉",
        road_address: "부산광역시 중구 광복로 55",
        tel: "051-245-7582",
        gugun: "중구",
        lat: 35.0980,
        lon: 129.0274,
        approval_date: "2019-12-03",
        business_status: "정상영업"
      },
      {
        animal_hospital: "동래 펫케어병원",
        road_address: "부산광역시 동래구 충렬대로 295",
        tel: "051-552-7582",
        gugun: "동래구",
        lat: 35.2048,
        lon: 129.0779,
        approval_date: "2021-02-28",
        business_status: "정상영업"
      },
      {
        animal_hospital: "사상 종합동물병원",
        road_address: "부산광역시 사상구 광장로 15",
        tel: "051-304-7582",
        gugun: "사상구",
        lat: 35.1537,
        lon: 128.9943,
        approval_date: "2020-06-12",
        business_status: "정상영업"
      }
    ];

    // 검색 필터 적용
    let filteredHospitals = testHospitals;
    
    if (gugun && gugun !== 'all') {
      filteredHospitals = filteredHospitals.filter(hospital => 
        hospital.gugun.includes(gugun)
      );
    }
    
    if (hospitalName && hospitalName.trim()) {
      filteredHospitals = filteredHospitals.filter(hospital => 
        hospital.animal_hospital.includes(hospitalName.trim())
      );
    }

    console.log(`Returning ${filteredHospitals.length} test hospitals`);

    return new Response(
      JSON.stringify({
        success: true,
        hospitals: filteredHospitals,
        totalCount: filteredHospitals.length,
        filters: { gugun, hospitalName },
        note: "현재 테스트 데이터를 사용 중입니다. 실제 API 연동이 필요합니다."
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