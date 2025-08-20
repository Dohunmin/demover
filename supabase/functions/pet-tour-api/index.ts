const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  // CORS 프리플라이트 처리
  if (req.method === "OPTIONS") {
    console.log("[OPTIONS] pet-tour-api CORS preflight");
    return new Response("ok", { headers: corsHeaders });
  }

  const debugId = crypto.randomUUID();
  
  try {
    console.log("[START] pet-tour-api", debugId, "Method:", req.method);
    console.log("[REQUEST] pet-tour-api", debugId, "URL:", req.url);
    
    // 요청 본문 파싱
    const body = req.method === "GET" ? {} : await req.json();
    console.log("[BODY] pet-tour-api", debugId, JSON.stringify(body));
    
    // 파라미터 추출
    const operation = body.op || 'areaBasedList1';
    const pageNo = body.pageNo || 1;
    const numOfRows = body.numOfRows || 100;
    const keyword = body.keyword || null;
    const areaCode = body.areaCode || null;
    const sigunguCode = body.sigunguCode || null;
    
    console.log("[PARAMS] pet-tour-api", debugId, { operation, pageNo, numOfRows, keyword, areaCode, sigunguCode });
    
    // API 키 가져오기
    const SERVICE_KEY_RAW = Deno.env.get('KOREA_TOUR_API_KEY');
    if (!SERVICE_KEY_RAW) {
      throw new Error('KOREA_TOUR_API_KEY not found in environment');
    }
    // 공백 문자 제거
    const SERVICE_KEY = SERVICE_KEY_RAW.trim();
    console.log("[KEY] pet-tour-api", debugId, "Service key length:", SERVICE_KEY.length);
    
    // 반려동물 동반 여행지 API 올바른 엔드포인트 사용
    const BASE_URL = "https://apis.data.go.kr/B551011/KorPetTourService";
    let finalUrl = `${BASE_URL}/areaBasedList2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&_type=xml&MobileOS=ETC&MobileApp=PetTravelApp&pageNo=${pageNo}&numOfRows=${numOfRows}`;
    
    if (areaCode) {
      finalUrl += `&areaCode=${areaCode}`;
    }
    if (sigunguCode) {
      finalUrl += `&sigunguCode=${sigunguCode}`;
    }
    if (keyword) {
      finalUrl += `&keyword=${encodeURIComponent(keyword)}`;
    }
    
    console.log("[URL] pet-tour-api", debugId, finalUrl);
    
    // 외부 API 호출 (HTTPS 실패 시 HTTP로 재시도)
    let response;
    try {
      response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          "Accept": "application/xml, text/xml, */*",
          "User-Agent": "PetTravelApp/1.0",
          "Connection": "keep-alive"
        },
        redirect: "follow"
      });
    } catch (httpsError) {
      console.log("[HTTPS_FAILED] pet-tour-api", debugId, httpsError.message);
      // HTTP로 재시도
      const httpUrl = finalUrl.replace('https://', 'http://');
      console.log("[HTTP_RETRY] pet-tour-api", debugId, httpUrl);
      response = await fetch(httpUrl, {
        method: 'GET',
        headers: {
          "Accept": "application/xml, text/xml, */*",
          "User-Agent": "PetTravelApp/1.0",
          "Connection": "keep-alive"
        },
        redirect: "follow"
      });
    }
    
    console.log("[STATUS] pet-tour-api", debugId, response.status, response.statusText);
    
    const responseText = await response.text();
    console.log("[RESPONSE_LENGTH] pet-tour-api", debugId, responseText.length);
    console.log("[RESPONSE_PREVIEW] pet-tour-api", debugId, responseText.substring(0, 200));
    
    // XML 응답을 그대로 반환하거나 에러 확인
    if (responseText.includes('SERVICE ERROR') || responseText.includes('INVALID_REQUEST_PARAMETER_ERROR')) {
      const errorMatch = responseText.match(/<errMsg>(.*?)<\/errMsg>/);
      const errorMsg = errorMatch ? errorMatch[1] : 'Unknown API error';
      throw new Error(`Pet Tourism API Error: ${errorMsg}`);
    }
    
    // 응답 반환
    return new Response(responseText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml"
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[ERROR] pet-tour-api", debugId, errorMessage);
    console.error("[ERROR_STACK] pet-tour-api", debugId, error instanceof Error ? error.stack : "No stack");
    
    return new Response(JSON.stringify({
      ok: false,
      func: "pet-tour-api",
      debugId: debugId,
      error: errorMessage
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } finally {
    console.log("[END] pet-tour-api", debugId);
  }
});