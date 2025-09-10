import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const beachMap: Record<string, number> = {
  송도: 268,
  해운대: 304,
  송정: 305,
  광안리: 306,
  다대포: 308,
  일광: 309,
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
  
  // API 키 로딩 상태 확인
  const serviceKey = Deno.env.get("KMA_API_KEY");
  if (serviceKey) {
    console.log("✅ KMA API Key loaded successfully.");
  } else {
    console.log("❌ FATAL: KMA_API_KEY environment variable not found!");
    return new Response(
      JSON.stringify({ 
        error: "API 키가 설정되지 않았습니다",
        fatal: "KMA_API_KEY environment variable not found"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

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
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const baseDate = getBaseDate();
    const baseTime = getLatestBaseTime();
    const searchTime = baseDate + baseTime;

    // 세 개의 API를 병렬로 호출
    console.log(`🚀 Starting 3 parallel KMA API calls for beach_num: ${beach_num}`);
    
    const apiCalls = [
      // 1. 단기예보조회 (메인 API)
      fetch(
        `http://apis.data.go.kr/1360000/BeachInfoservice/getVilageFcstBeach?serviceKey=${encodeURIComponent(
          serviceKey
        )}&dataType=JSON&pageNo=1&numOfRows=${numOfRows}&base_date=${baseDate}&base_time=${baseTime}&beach_num=${beach_num}`
      ),

      // 2. 일출일몰조회 (보조 API)
      fetch(
        `http://apis.data.go.kr/1360000/BeachInfoservice/getSunInfoBeach?serviceKey=${encodeURIComponent(
          serviceKey
        )}&dataType=JSON&pageNo=1&numOfRows=${numOfRows}&Base_date=${baseDate}&beach_num=${beach_num}`
      ),

      // 3. 수온조회 (보조 API)
      fetch(
        `http://apis.data.go.kr/1360000/BeachInfoservice/getTwBuoyBeach?serviceKey=${encodeURIComponent(
          serviceKey
        )}&dataType=JSON&pageNo=1&numOfRows=${numOfRows}&searchTime=${searchTime}&beach_num=${beach_num}`
      ),
    ];

    const responses = await Promise.allSettled(apiCalls);
    
    // 각 API 호출 결과 상세 로깅
    const apiNames = ["Short-term forecast", "Sunrise/Sunset", "Water temperature"];
    const errors: string[] = [];
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const apiName = apiNames[i];
      
      if (response.status === 'fulfilled') {
        if (response.value.ok) {
          console.log(`✅ ${apiName} API call successful. Status: ${response.value.status}`);
        } else {
          console.log(`❌ ${apiName} API call failed. HTTP Status: ${response.value.status}`);
          if (i > 0) { // 보조 API 실패
            errors.push(`Failed to fetch ${apiName.toLowerCase()} information.`);
          }
        }
      } else {
        console.log(`❌ ${apiName} API call was rejected. Error:`, response.reason);
        if (i > 0) { // 보조 API 실패
          errors.push(`Failed to fetch ${apiName.toLowerCase()} data.`);
        }
      }
    }

    // 메인 API (단기예보조회) 실패 시 500 에러 반환
    if (responses[0].status !== 'fulfilled' || !responses[0].value.ok) {
      console.log("💥 CRITICAL: Main forecast API failed, returning 500 error");
      let errorDetail = "단기예보조회 API 호출 실패";
      if (responses[0].status === 'fulfilled') {
        errorDetail += ` (HTTP ${responses[0].value.status})`;
      } else {
        errorDetail += ` (${responses[0].reason})`;
      }
      
      return new Response(
        JSON.stringify({ 
          error: "단기예보조회 API 호출 실패",
          details: errorDetail,
          fatal: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    let data: any = null;
    let sunrise: string | null = null;
    let sunset: string | null = null;
    let tw: string | null = null;

    // 메인 API (단기예보조회) 결과 처리
    try {
      const rawText = await responses[0].value.text();
      console.log("📊 단기예보조회 API 응답 파싱 중...");
      data = JSON.parse(rawText);
      console.log("✅ 단기예보조회 데이터 파싱 성공");
    } catch (e) {
      console.error("💥 단기예보조회 파싱 오류:", e);
      return new Response(
        JSON.stringify({
          error: "단기예보조회 파싱 실패",
          details: String(e),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // 보조 API들 결과 처리 (일출일몰조회)
    if (responses[1].status === "fulfilled" && responses[1].value.ok) {
      try {
        const rawText = await responses[1].value.text();
        console.log("📅 일출일몰조회 데이터 처리 중...");
        const sunData = JSON.parse(rawText);

        if (
          sunData?.response?.body?.items?.item &&
          sunData.response.body.items.item.length > 0
        ) {
          const sunItem = sunData.response.body.items.item[0];
          sunrise = sunItem.sunrise || null;
          sunset = sunItem.sunset || null;
          console.log("✅ 일출일몰 데이터 추출 성공:", { sunrise, sunset });
        } else {
          console.log("⚠️ 일출일몰 데이터 없음");
        }
      } catch (e) {
        console.error("❌ 일출일몰조회 파싱 오류:", e);
        errors.push("Failed to parse sunrise/sunset data.");
      }
    }

    // 보조 API들 결과 처리 (수온조회)
    if (responses[2].status === "fulfilled" && responses[2].value.ok) {
      try {
        const rawText = await responses[2].value.text();
        console.log("🌊 수온조회 데이터 처리 중...");
        const twData = JSON.parse(rawText);

        if (
          twData?.response?.body?.items?.item &&
          twData.response.body.items.item.length > 0
        ) {
          const twItem = twData.response.body.items.item[0];
          tw = twItem.tw || null;
          console.log("✅ 수온 데이터 추출 성공:", { tw });
        } else {
          console.log("⚠️ 수온 데이터 없음");
        }
      } catch (e) {
        console.error("❌ 수온조회 파싱 오류:", e);
        errors.push("Failed to parse water temperature data.");
      }
    }

    const beachNameFromMap = Object.keys(beachMap).find(
      (k) => beachMap[k] === Number(beach_num)
    );

    // 단기예보조회 데이터에서 주요 값들 추출
    const weatherData: Record<string, unknown> = {};
    if (
      data?.response?.body?.items?.item &&
      Array.isArray(data.response.body.items.item)
    ) {
      data.response.body.items.item.forEach((item: any) => {
        if (item.category === "SKY") weatherData.sky = item.fcstValue;
        if (item.category === "TMP") weatherData.tmp = item.fcstValue;
        if (item.category === "WAV") weatherData.wav = item.fcstValue;
      });
      console.log("📋 추출된 단기예보 데이터:", weatherData);
    }

    // 최종 응답 구조 생성 (중복 제거된 깔끔한 구조)
    const finalResponse: any = {
      response: data.response,
      weather_summary: {
        sky: weatherData.sky || null,
        temperature: weatherData.tmp || null,
        wave_height: weatherData.wav || null,
        sunrise: sunrise,
        sunset: sunset,
        water_temperature: tw,
      },
      request_info: {
        beach_num,
        beach_name: beachNameFromMap || beach_name,
        base_date: baseDate,
        base_time: baseTime,
        timestamp: new Date().toISOString(),
      }
    };

    // 에러가 있으면 추가
    if (errors.length > 0) {
      finalResponse.errors = errors;
      console.log("⚠️ 일부 보조 API 실패, 에러 포함하여 응답:", errors);
    } else {
      console.log("✅ 모든 API 호출 성공");
    }

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("💥 Critical error in beach-weather-api:", error);
    return new Response(
      JSON.stringify({ 
        error: "서버 내부 오류 발생", 
        details: String(error),
        fatal: true,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
