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
    const searchTime = baseDate + baseTime; // 예: 20250907 + 1400 = 202509071400
    const serviceKey = Deno.env.get("KMA_API_KEY");

    if (!serviceKey) {
      return new Response(
        JSON.stringify({ error: "API 키가 설정되지 않았습니다" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // 세 개의 API를 병렬로 호출
    const apiCalls = [
      // 1. 단기예보조회
      fetch(
        `http://apis.data.go.kr/1360000/BeachInfoservice/getVilageFcstBeach?serviceKey=${encodeURIComponent(
          serviceKey
        )}&dataType=JSON&pageNo=1&numOfRows=${numOfRows}&base_date=${baseDate}&base_time=${baseTime}&beach_num=${beach_num}`
      ),

      // 2. 일출일몰조회
      fetch(
        `http://apis.data.go.kr/1360000/BeachInfoservice/getSunInfoBeach?serviceKey=${encodeURIComponent(
          serviceKey
        )}&dataType=JSON&pageNo=1&numOfRows=${numOfRows}&Base_date=${baseDate}&beach_num=${beach_num}`
      ),

      // 3. 수온조회
      fetch(
        `http://apis.data.go.kr/1360000/BeachInfoservice/getTwBuoyBeach?serviceKey=${encodeURIComponent(
          serviceKey
        )}&dataType=JSON&pageNo=1&numOfRows=${numOfRows}&searchTime=${searchTime}&beach_num=${beach_num}`
      ),
    ];

    console.log(`Calling 3 KMA APIs for beach_num: ${beach_num}`);

    const responses = await Promise.allSettled(apiCalls);

    let data: any = null;
    let sunrise: string | null = null;
    let sunset: string | null = null;
    let tw: string | null = null;

    // 단기예보조회 결과 처리 (메인 응답)
    if (responses[0].status === "fulfilled" && responses[0].value.ok) {
      try {
        const rawText = await responses[0].value.text();
        console.log("=== 단기예보조회 API 응답 ===");
        console.log("Status:", responses[0].value.status);
        console.log(
          "Response:",
          rawText.substring(0, 500) + (rawText.length > 500 ? "..." : "")
        );
        data = JSON.parse(rawText);
      } catch (e) {
        console.error("단기예보조회 파싱 오류:", e);
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
    } else {
      console.error("단기예보조회 API 호출 실패");
      console.log("Response status:", responses[0].status);
      if (responses[0].status === "fulfilled") {
        console.log("HTTP status:", responses[0].value.status);
      }
      return new Response(
        JSON.stringify({ error: "단기예보조회 API 호출 실패" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // 일출일몰조회 결과 처리
    if (responses[1].status === "fulfilled" && responses[1].value.ok) {
      try {
        const rawText = await responses[1].value.text();
        console.log("=== 일출일몰조회 API 응답 ===");
        console.log("Status:", responses[1].value.status);
        console.log(
          "Response:",
          rawText.substring(0, 500) + (rawText.length > 500 ? "..." : "")
        );
        const sunData = JSON.parse(rawText);

        // 일출일몰 데이터에서 sunrise, sunset 추출
        if (
          sunData?.response?.body?.items?.item &&
          sunData.response.body.items.item.length > 0
        ) {
          const sunItem = sunData.response.body.items.item[0];
          sunrise = sunItem.sunrise || null;
          sunset = sunItem.sunset || null;
          console.log("추출된 일출일몰 데이터:", { sunrise, sunset });
        } else {
          console.log("일출일몰 데이터 없음");
        }
      } catch (e) {
        console.error("일출일몰조회 파싱 오류:", e);
      }
    } else {
      console.error("일출일몰조회 API 호출 실패");
      console.log("Response status:", responses[1].status);
      if (responses[1].status === "fulfilled") {
        console.log("HTTP status:", responses[1].value.status);
      }
    }

    // 수온조회 결과 처리
    if (responses[2].status === "fulfilled" && responses[2].value.ok) {
      try {
        const rawText = await responses[2].value.text();
        console.log("=== 수온조회 API 응답 ===");
        console.log("Status:", responses[2].value.status);
        console.log(
          "Response:",
          rawText.substring(0, 500) + (rawText.length > 500 ? "..." : "")
        );
        const twData = JSON.parse(rawText);

        // 수온 데이터에서 tw 추출
        if (
          twData?.response?.body?.items?.item &&
          twData.response.body.items.item.length > 0
        ) {
          const twItem = twData.response.body.items.item[0];
          tw = twItem.tw || null;
          console.log("추출된 수온 데이터:", { tw });
        } else {
          console.log("수온 데이터 없음");
        }
      } catch (e) {
        console.error("수온조회 파싱 오류:", e);
      }
    } else {
      console.error("수온조회 API 호출 실패");
      console.log("Response status:", responses[2].status);
      if (responses[2].status === "fulfilled") {
        console.log("HTTP status:", responses[2].value.status);
      }
    }

    const beachNameFromMap = Object.keys(beachMap).find(
      (k) => beachMap[k] === Number(beach_num)
    );

    // 단기예보조회 데이터에서 sky, tmp, wav 값들 추출
    const weatherData: Record<string, unknown> = {};
    if (
      data?.response?.body?.items?.item &&
      Array.isArray(data.response.body.items.item)
    ) {
      // 각 category별로 최신 값 저장
      data.response.body.items.item.forEach((item: unknown) => {
        if (item.category === "SKY") weatherData.sky = item.fcstValue;
        if (item.category === "TMP") weatherData.tmp = item.fcstValue;
        if (item.category === "WAV") weatherData.wav = item.fcstValue;
      });
      console.log("추출된 단기예보 데이터:", weatherData);
    }

    // 기존 응답에 추가 정보 병합
    if (
      data?.response?.body?.items?.item &&
      Array.isArray(data.response.body.items.item)
    ) {
      // 각 아이템에 sunrise, sunset, tw, sky, tmp, wav 추가
      data.response.body.items.item = data.response.body.items.item.map(
        (item: unknown) => ({
          ...item,
          sunrise,
          sunset,
          tw,
          sky: weatherData.sky || null,
          tmp: weatherData.tmp || null,
          wav: weatherData.wav || null,
        })
      );
    }

    // 메타정보 추가
    data["request_info"] = {
      beach_num,
      beach_name: beachNameFromMap || beach_name,
      base_date: baseDate,
      base_time: baseTime,
      additional_data: {
        sunrise: sunrise ? "포함됨" : "없음",
        sunset: sunset ? "포함됨" : "없음",
        tw: tw ? "포함됨" : "없음",
        sky: weatherData.sky ? "포함됨" : "없음",
        tmp: weatherData.tmp ? "포함됨" : "없음",
        wav: weatherData.wav ? "포함됨" : "없음",
      },
    };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in beach-weather-api:", error);
    return new Response(
      JSON.stringify({ error: "서버 오류 발생", details: String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
