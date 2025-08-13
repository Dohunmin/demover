const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  // CORS 프리플라이트 처리
  if (req.method === "OPTIONS") {
    console.log("[OPTIONS] korea-tour-api CORS preflight");
    return new Response("ok", { headers: corsHeaders });
  }

  const debugId = crypto.randomUUID();
  
  try {
    console.log("[START] korea-tour-api", debugId, "Method:", req.method);
    console.log("[REQUEST] korea-tour-api", debugId, "URL:", req.url);
    
    // 요청 본문 파싱
    const body = req.method === "GET" ? {} : await req.json();
    console.log("[BODY] korea-tour-api", debugId, JSON.stringify(body));
    
    // 파라미터 추출
    const operation = body.op || 'areaBasedList1';
    const pageNo = body.pageNo || 1;
    const numOfRows = body.numOfRows || 10;
    const keyword = body.keyword || null;
    const areaCode = body.areaCode || null;
    const sigunguCode = body.sigunguCode || null;
    
    console.log("[PARAMS] korea-tour-api", debugId, { operation, pageNo, numOfRows, keyword, areaCode, sigunguCode });
    
    // API 키 가져오기
    const SERVICE_KEY_RAW = Deno.env.get('KTO_TOUR_SERVICE_KEY');
    if (!SERVICE_KEY_RAW) {
      throw new Error('KTO_TOUR_SERVICE_KEY not found in environment');
    }
    // 공백 문자 제거
    const SERVICE_KEY = SERVICE_KEY_RAW.trim();
    console.log("[KEY] korea-tour-api", debugId, "Service key length:", SERVICE_KEY.length);
    
    const url = new URL(`http://apis.data.go.kr/B551011/KorService1/${operation}`);
    // 서비스 키를 URL 인코딩하지 않고 직접 추가
    // 수동으로 URL 구성 (URL 인코딩 방지)
    let finalUrl = `http://apis.data.go.kr/B551011/KorService1/${operation}?serviceKey=${SERVICE_KEY}&_type=json&MobileOS=AND&MobileApp=TourGuide&pageNo=${pageNo}&numOfRows=${numOfRows}`;
    
    if (keyword) {
      finalUrl += `&keyword=${keyword}`;
    }
    if (areaCode) {
      finalUrl += `&areaCode=${areaCode}`;
    }
    if (sigunguCode) {
      finalUrl += `&sigunguCode=${sigunguCode}`;
    }
    
    console.log("[URL] korea-tour-api", debugId, finalUrl);
    
    // 외부 API 호출
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "User-Agent": "LovableRelay/1.0",
        "Connection": "keep-alive"
      },
      redirect: "follow"
    });
    
    console.log("[STATUS] korea-tour-api", debugId, response.status, response.statusText);
    
    const responseText = await response.text();
    console.log("[RESPONSE_LENGTH] korea-tour-api", debugId, responseText.length);
    console.log("[RESPONSE_PREVIEW] korea-tour-api", debugId, responseText.substring(0, 200));
    
    // SERVICE ERROR 체크
    if (responseText.includes('SERVICE ERROR') || responseText.includes('SERVICE_ERROR')) {
      console.error("[SERVICE_ERROR] korea-tour-api", debugId, "API returned SERVICE ERROR");
      return new Response(JSON.stringify({
        ok: false,
        func: "korea-tour-api",
        debugId: debugId,
        error: "한국관광공사 API 서비스 에러: 인증키가 유효하지 않거나 서비스 사용량을 초과했습니다.",
        raw_response: responseText.substring(0, 500)
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    
    // 응답 반환
    return new Response(responseText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[ERROR] korea-tour-api", debugId, errorMessage);
    console.error("[ERROR_STACK] korea-tour-api", debugId, error instanceof Error ? error.stack : "No stack");
    
    return new Response(JSON.stringify({
      ok: false,
      func: "korea-tour-api",
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
    console.log("[END] korea-tour-api", debugId);
  }
});