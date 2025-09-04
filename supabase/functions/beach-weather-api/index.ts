import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const beachMap: Record<string, number> = {
  "송도": 268,
  "해운대": 304,
  "송정": 305,
  "광안리": 306,
  "임랑": 307,
  "다대포": 308,
  "일광": 309,
};

function getLatestBaseTime(): string {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC → KST
  const hours = [2, 5, 8, 11, 14, 17, 20, 23];
  let baseHour = hours[0];
  for (const h of hours) {
    if (kstNow.getHours() >= h) baseHour = h;
  }
  return String(baseHour).padStart(2, "0") + "00";
}

function getBaseDate(): string {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC → KST
  return kstNow.toISOString().slice(0, 10).replace(/-/g, "");
}

serve(async (req) => {
  console.log("Beach weather API called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let beach_num: string | null = null;
    let beach_name: string | null = null;
    let numOfRows = "100";

    // POST 요청의 경우 body에서 파라미터 추출
    if (req.method === "POST") {
      try {
        const body = await req.json();
        beach_num = body.beach_num || null;
        beach_name = body.beach_name || null;
        numOfRows = body.numOfRows || "100";
      } catch (e) {
        // JSON 파싱 실패 시 URL 파라미터 사용
      }
    }

    // URL 파라미터에서도 확인 (GET 요청이나 POST에서 body 파싱 실패 시)
    if (!beach_num && !beach_name) {
      const url = new URL(req.url);
      beach_num = url.searchParams.get("beach_num");
      beach_name = url.searchParams.get("beach_name");
      numOfRows = url.searchParams.get("numOfRows") || numOfRows;
    }

    console.log(`Request params - beach_num: ${beach_num}, beach_name: ${beach_name}, numOfRows: ${numOfRows}`);

    // beach_name이 있으면 beach_num으로 변환
    if (!beach_num && beach_name) {
      beach_num = String(beachMap[beach_name] || "");
      console.log(`Converted beach_name '${beach_name}' to beach_num: ${beach_num}`);
    }

    if (!beach_num) {
      console.log("No beach_num provided");
      return new Response(JSON.stringify({ 
        error: "beach_num 또는 beach_name 파라미터가 필요합니다",
        availableBeaches: Object.keys(beachMap)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const baseDate = getBaseDate();
    const baseTime = getLatestBaseTime();
    
    console.log(`Using base_date: ${baseDate}, base_time: ${baseTime}`);

    const serviceKey = Deno.env.get("KMA_API_KEY");
    if (!serviceKey) {
      console.log("KMA_API_KEY not found");
      return new Response(JSON.stringify({ error: "API 키가 설정되지 않았습니다" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const endpoint = "http://apis.data.go.kr/1360000/BeachInfoservice/getVilageFcstBeach";
    const apiUrl = `${endpoint}?serviceKey=${serviceKey}&dataType=JSON&pageNo=1&numOfRows=${numOfRows}&base_date=${baseDate}&base_time=${baseTime}&beach_num=${beach_num}`;

    console.log(`Calling KMA API: ${apiUrl}`);

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.log(`KMA API response not ok: ${response.status} ${response.statusText}`);
      throw new Error(`기상청 API 호출 실패: ${response.status} ${response.statusText}`);
    }

    // 먼저 텍스트로 응답을 받아서 확인
    const responseText = await response.text();
    console.log("KMA API Raw Response:", responseText.substring(0, 500)); // 처음 500자만 로그

    let data;
    try {
      // JSON 파싱 시도
      data = JSON.parse(responseText);
      console.log("Successfully parsed as JSON");
    } catch (jsonError) {
      console.log("Failed to parse as JSON, checking for XML error response");
      
      // XML 오류 응답인지 확인
      if (responseText.includes("OpenAPI_ServiceResponse") || responseText.includes("<result>")) {
        console.log("Detected OpenAPI error response");
        // XML에서 에러 메시지 추출
        const errorMatch = responseText.match(/<errMsg>(.*?)<\/errMsg>/);
        const errorMsg = errorMatch ? errorMatch[1] : "알 수 없는 API 오류";
        throw new Error(`기상청 API 오류: ${errorMsg}`);
      }
      
      // JSON도 아니고 알려진 XML 오류도 아닌 경우
      throw new Error(`예상하지 못한 응답 형식: ${responseText.substring(0, 100)}`);
    }

    console.log("KMA API response processed successfully");

    // 해수욕장명 붙여주기
    const beachNameFromMap = Object.keys(beachMap).find(k => beachMap[k] == Number(beach_num));
    if (beachNameFromMap) {
      data["해수욕장명"] = beachNameFromMap;
      data["beach_name"] = beachNameFromMap;
    }

    // 요청 정보도 추가
    data["request_info"] = {
      beach_num: beach_num,
      beach_name: beachNameFromMap || beach_name,
      base_date: baseDate,
      base_time: baseTime
    };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in beach-weather-api:", error);
    return new Response(JSON.stringify({ 
      error: "서버 오류가 발생했습니다", 
      details: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});