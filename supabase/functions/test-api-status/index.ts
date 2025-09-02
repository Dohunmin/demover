const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  // CORS 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SERVICE_KEY = Deno.env.get('KOREA_TOUR_API_KEY');
    if (!SERVICE_KEY) {
      throw new Error('KOREA_TOUR_API_KEY not found');
    }

    console.log("[API_TEST] Testing Korea Tourism API endpoints");

    const testResults = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // 1. 일반 목록 API 테스트
    try {
      const listUrl = `http://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=6&numOfRows=5&pageNo=1&_type=xml`;
      console.log("[LIST_TEST] Testing list API:", listUrl);
      
      const listResponse = await fetch(listUrl);
      const listText = await listResponse.text();
      
      testResults.tests.push({
        name: "일반 목록 API",
        url: listUrl,
        status: listResponse.status,
        success: listText.includes('<resultCode>0000</resultCode>'),
        error: listText.includes('SERVICE ERROR') ? listText.match(/<errMsg>(.*?)<\/errMsg>/)?.[1] : null,
        preview: listText.substring(0, 200)
      });
    } catch (error) {
      testResults.tests.push({
        name: "일반 목록 API",
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }

    // 2. 키워드 검색 API 테스트 (단순 키워드)
    try {
      const searchUrl = `http://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&MobileOS=ETC&MobileApp=PetTravelApp&keyword=${encodeURIComponent('해운대')}&areaCode=6&numOfRows=5&pageNo=1&_type=xml`;
      console.log("[SEARCH_TEST] Testing search API:", searchUrl);
      
      const searchResponse = await fetch(searchUrl);
      const searchText = await searchResponse.text();
      
      testResults.tests.push({
        name: "키워드 검색 API (해운대)",
        url: searchUrl,
        status: searchResponse.status,
        success: searchText.includes('<resultCode>0000</resultCode>'),
        error: searchText.includes('SERVICE ERROR') ? searchText.match(/<errMsg>(.*?)<\/errMsg>/)?.[1] : null,
        preview: searchText.substring(0, 200)
      });
    } catch (error) {
      testResults.tests.push({
        name: "키워드 검색 API (해운대)",
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }

    // 3. 반려동물 목록 API 테스트
    try {
      const petUrl = `http://apis.data.go.kr/B551011/KorPetTourService/areaBasedList2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=6&numOfRows=5&pageNo=1&_type=xml`;
      console.log("[PET_TEST] Testing pet API:", petUrl);
      
      const petResponse = await fetch(petUrl);
      const petText = await petResponse.text();
      
      testResults.tests.push({
        name: "반려동물 목록 API",
        url: petUrl,
        status: petResponse.status,
        success: petText.includes('<resultCode>0000</resultCode>'),
        error: petText.includes('SERVICE ERROR') ? petText.match(/<errMsg>(.*?)<\/errMsg>/)?.[1] : null,
        preview: petText.substring(0, 200)
      });
    } catch (error) {
      testResults.tests.push({
        name: "반려동물 목록 API",
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }

    // 4. API 키 상태 확인을 위한 간단한 호출
    try {
      const keyTestUrl = `http://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=1&numOfRows=1&pageNo=1&_type=xml`;
      console.log("[KEY_TEST] Testing API key validity");
      
      const keyResponse = await fetch(keyTestUrl);
      const keyText = await keyResponse.text();
      
      testResults.tests.push({
        name: "API 키 유효성 테스트",
        status: keyResponse.status,
        success: keyText.includes('<resultCode>0000</resultCode>'),
        error: keyText.includes('SERVICE ERROR') ? keyText.match(/<errMsg>(.*?)<\/errMsg>/)?.[1] : null,
        keyStatus: keyText.includes('INVALID_REQUEST_PARAMETER_ERROR') ? 'INVALID_KEY' : 
                  keyText.includes('SERVICE_TIMEOUT_ERROR') ? 'QUOTA_EXCEEDED' :
                  keyText.includes('<resultCode>0000</resultCode>') ? 'VALID' : 'UNKNOWN'
      });
    } catch (error) {
      testResults.tests.push({
        name: "API 키 유효성 테스트",
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }

    console.log("[API_TEST] Test results:", JSON.stringify(testResults, null, 2));

    return new Response(JSON.stringify(testResults), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("[API_TEST] Error:", error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});