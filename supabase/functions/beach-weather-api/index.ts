import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const beachMap: Record<string, number> = {
  "송도": 268,
  "해운대": 304,
  "송정": 305,
  "광안리": 306,
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
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
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

    // Body 우선 파싱
    if (req.method === "POST") {
      try {
        const body = await req.json();
        beach_num = body.beach_num || null;
        beach_name = body.beach_name || null;
        numOfRows = body.numOfRows || "100";
      } catch (_) {
        // JSON 파싱 실패 시 GET query로 fallback
      }
    }

    // Query 파라미터 확인
    const url = new URL(req.url);
    if (!beach_num && !beach_name) {
      beach_num = url.searchParams.get("beach_num");
      beach_name = url.searchParams.get("beach_name");
      numOfRows = url.searchParams.get("numOfRows") || numOfRows;
    }

    // beach_name → beach_num 변환
    if (!beach_num && beach_name) {
      beach_num = String(beachMap[beach_name] || "");
    }

    if (!beach_num) {
      return new Response(
        JSON.stringify({
          error: "beach_num 또는 beach_name 파라미터가 필요합니다",
          availableBeaches: Object.keys(beachMap),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const baseDate = getBaseDate();
    const baseTime = getLatestBaseTime();
    const serviceKey = Deno.env.get("KMA_API_KEY");

    if (!serviceKey) {
      return new Response(
        JSON.stringify({ error: "API 키가 설정되지 않았습니다" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    const endpoint =
      "http://apis.data.go.kr/1360000/BeachInfoservice/getVilageFcstBeach";
    const apiUrl =
      `${endpoint}?serviceKey=${encodeURIComponent(serviceKey)}&dataType=JSON&pageNo=1&numOfRows=${numOfRows}&base_date=${baseDate}&base_time=${baseTime}&beach_num=${beach_num}`;

    console.log(`Calling KMA API: ${apiUrl}`);

    const response = await fetch(apiUrl);
    const rawText = await response.text();

    if (!response.ok) {
      console.error("KMA API error:", rawText);
      return new Response(
        JSON.stringify({ error: "기상청 API 호출 실패", raw: rawText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("JSON parse error:", e);
      return new Response(
        JSON.stringify({ error: "응답 파싱 실패", raw: rawText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    const beachNameFromMap = Object.keys(beachMap).find(
      (k) => beachMap[k] === Number(beach_num),
    );

    // 메타정보 추가
    data["request_info"] = {
      beach_num,
      beach_name: beachNameFromMap || beach_name,
      base_date: baseDate,
      base_time: baseTime,
    };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in beach-weather-api:", error);
    return new Response(
      JSON.stringify({ error: "서버 오류 발생", details: String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});