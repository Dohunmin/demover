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

    // 부산광역시 동물병원 현황 API 호출
    const baseUrl = 'http://apis.data.go.kr/6260000/BusanAnimalHospService/getAnimalHospInfo';
    const params = new URLSearchParams({
      serviceKey: apiKey,
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      resultType: 'json'
    });

    // 구군 필터가 있으면 추가
    if (gugun && gugun !== 'all' && gugun.trim()) {
      params.append('gugun', gugun.trim());
    }

    // 병원명 필터가 있으면 추가
    if (hospitalName && hospitalName.trim()) {
      params.append('hospitalNm', hospitalName.trim());
    }

    const apiUrl = `${baseUrl}?${params.toString()}`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl);
    const responseText = await response.text();
    
    console.log('API Response Status:', response.status);
    console.log('API Response:', responseText);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    let apiData;
    try {
      apiData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON response from API');
    }

    // API 응답 확인
    if (!apiData || !apiData.getAnimalHospInfo) {
      console.error('Unexpected API response structure:', apiData);
      throw new Error('Invalid API response structure');
    }

    const hospitals = apiData.getAnimalHospInfo.item || [];
    
    // 병원 데이터 매핑
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

    console.log(`Successfully retrieved ${mappedHospitals.length} hospitals from API`);

    return new Response(
      JSON.stringify({
        success: true,
        hospitals: mappedHospitals,
        totalCount: apiData.getAnimalHospInfo.totalCount || mappedHospitals.length,
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