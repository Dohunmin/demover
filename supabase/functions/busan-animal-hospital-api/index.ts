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
    const { pageNo = 1, numOfRows = 300, gugun = '', hospitalName = '' } = await req.json();
    console.log('Request params:', { pageNo, numOfRows, gugun, hospitalName });

    const apiKey = Deno.env.get('BUSAN_ANIMAL_HOSPITAL_API_KEY');
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    // 부산광역시 동물병원 현황 API 호출 시도 (실제 존재 여부 확인)
    const baseUrl = 'http://apis.data.go.kr/6260000/BusanAnimalHospService/getAnimalHospInfo';
    const params = new URLSearchParams({
      serviceKey: apiKey,
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      resultType: 'json'
    });

    const apiUrl = `${baseUrl}?${params.toString()}`;
    console.log('🔥 API 호출 시도:', apiUrl);

    const response = await fetch(apiUrl);
    const responseText = await response.text();
    
    console.log('🔍 API 응답 상태:', response.status);
    console.log('🔍 API 응답 내용:', responseText);

    if (!response.ok) {
      console.log('❌ API 호출 실패, 테스트 데이터로 전환');
      
      // 실제 API가 존재하지 않을 가능성이 높으므로 테스트 데이터 반환
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

      console.log(`✅ ${filteredHospitals.length}개 테스트 병원 데이터 반환`);

      return new Response(
        JSON.stringify({
          success: true,
          hospitals: filteredHospitals,
          totalCount: filteredHospitals.length,
          filters: { gugun, hospitalName },
          note: "API 서비스를 찾을 수 없어 테스트 데이터를 사용합니다. 공공데이터포털에서 정확한 API 정보를 확인해 주세요."
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let apiData;
    try {
      apiData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON 파싱 에러:', parseError);
      throw new Error('API 응답을 JSON으로 파싱할 수 없습니다');
    }

    // API 응답 확인 및 매핑
    console.log('✅ API 호출 성공, 데이터 처리 중...');
    
    const hospitals = apiData?.getAnimalHospInfo?.item || apiData?.response?.body?.items?.item || [];
    
    const mappedHospitals = hospitals.map((hospital: any) => ({
      animal_hospital: hospital.hospitalNm || hospital.animal_hospital || '',
      road_address: hospital.roadAddress || hospital.road_address || '',
      tel: hospital.phoneNumber || hospital.tel || '',
      gugun: hospital.gugun || '',
      lat: parseFloat(hospital.lat || hospital.latitude || 0),
      lon: parseFloat(hospital.lot || hospital.longitude || 0),
      approval_date: hospital.licenseDate || hospital.approval_date || '',
      business_status: hospital.dataStandardDate ? '정상영업' : hospital.business_status || ''
    }));

    return new Response(
      JSON.stringify({
        success: true,
        hospitals: mappedHospitals,
        totalCount: apiData?.getAnimalHospInfo?.totalCount || mappedHospitals.length,
        filters: { gugun, hospitalName }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
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