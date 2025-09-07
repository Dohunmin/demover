import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// 인메모리 캐시 (24시간 TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`🎯 캐시에서 데이터 로드: ${key}`);
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`💾 캐시에 데이터 저장: ${key} (${data.length}개)`);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// XML을 JSON으로 변환하는 간단한 파서
function parseXmlToJson(xmlText: string) {
  try {
    console.log("Parsing XML content:", xmlText.substring(0, 500));

    // SERVICE ERROR 체크
    if (
      xmlText.includes("SERVICE ERROR") ||
      xmlText.includes("NO_OPENAPI_SERVICE_ERROR")
    ) {
      const errorMatch = xmlText.match(/<errMsg>(.*?)<\/errMsg>/);
      const errorMsg = errorMatch ? errorMatch[1] : "Unknown service error";
      console.error("API Service Error:", errorMsg);
      return {
        error: true,
        message: errorMsg,
      };
    }

    // 정상 응답 파싱
    const result: any = {};

    // resultCode 추출
    const resultCodeMatch = xmlText.match(/<resultCode>(\d+)<\/resultCode>/);
    const resultMsgMatch = xmlText.match(/<resultMsg>([^<]*)<\/resultMsg>/);
    const totalCountMatch = xmlText.match(/<totalCount>(\d+)<\/totalCount>/);
    const numOfRowsMatch = xmlText.match(/<numOfRows>(\d+)<\/numOfRows>/);
    const pageNoMatch = xmlText.match(/<pageNo>(\d+)<\/pageNo>/);

    const header = {
      resultCode: resultCodeMatch ? resultCodeMatch[1] : "99",
      resultMsg: resultMsgMatch ? resultMsgMatch[1] : "UNKNOWN ERROR",
    };

    const body: any = {
      totalCount: totalCountMatch ? parseInt(totalCountMatch[1]) : 0,
      numOfRows: numOfRowsMatch ? parseInt(numOfRowsMatch[1]) : 0,
      pageNo: pageNoMatch ? parseInt(pageNoMatch[1]) : 1,
    };

    // items 파싱 - item 태그들을 찾아서 배열로 변환
    const itemRegex = /<item>(.*?)<\/item>/gs;
    const items = [];
    let itemMatch;

    while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
      const itemContent = itemMatch[1];
      const item: any = {};

      // 각 item 내의 필드들 파싱
      const fieldRegex = /<(\w+)>([^<]*)<\/\1>/g;
      let fieldMatch;

      while ((fieldMatch = fieldRegex.exec(itemContent)) !== null) {
        const [, fieldName, fieldValue] = fieldMatch;
        item[fieldName] = fieldValue;
      }

      if (Object.keys(item).length > 0) {
        items.push(item);
      }
    }

    if (items.length > 0) {
      body.items = { item: items };
    }

    result.response = { header, body };

    console.log("Parsed XML result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("XML parsing error:", error);
    return {
      error: true,
      message: `XML parsing failed: ${error.message}`,
    };
  }
}

// 반려동물 동반 가능한 키워드 목록
const petFriendlyKeywords = [
  "롯데프리미엄아울렛 동부산점",
  "몽작",
  "부산시민공원",
  "센텀 APEC나루공원",
  "신호공원",
  "오르디",
  "온천천시민공원",
  "칠암만장",
  "카페 만디",
  "포레스트3002",
  "홍법사(부산)",
  "감나무집",
  "광안리해변 테마거리",
  "광안리해수욕장",
  "구덕포끝집고기",
  "구포시장",
  "국립부산과학관",
  "그림하우스",
  "금강사(부산)",
  "다대포 꿈의 낙조분수",
  "다대포해수욕장",
  "대보름",
  "대저생태공원",
  "대저수문 생태공원",
  "더웨이브",
  "더펫텔프리미엄스위트",
  "덕미",
  "듀스포레",
  "드림서프라운지",
  "만달리",
  "맥도생태공원",
  "모닝듀 게스트 하우스(모닝듀)",
  "무명일기",
  "문탠로드",
  "민락수변공원",
  "밀락더마켓",
  "부산 감천문화마을",
  "부산 송도해상케이블카",
  "부산 송도해수욕장",
  "부산 암남공원",
  "부산북항 친수공원",
  "부산 어린이대공원",
  "불란서그로서리",
  "브리타니",
  "비아조",
  "빅토리아 베이커리 가든",
  "삼락생태공원",
  "성안집",
  "송도 구름산책로",
  "송정물총칼국수",
  "송정해수욕장",
  "스노잉클라우드",
  "스포원파크",
  "신세계사이먼 부산 프리미엄 아울렛",
  "아르반호텔[한국관광 품질인증/Korea Quality]",
  "아미르공원",
  "알로이삥삥",
  "옐로우라이트하우스",
  "오구카페",
  "용소웰빙공원",
  "원시학",
  "웨스턴챔버",
  "웨이브온 커피",
  "윙민박",
  "유정1995 기장 본점",
  "을숙도 공원",
  "이바구캠프",
  "장림포구",
  "절영해안산책로",
  "죽성드림세트장",
  "카페베이스",
  "카페윤",
  "캐빈스위트광안",
  "캔버스",
  "캔버스 블랙",
  "태종대",
  "팝콘 호스텔 해운대점",
  "프루터리포레스트",
  "해동용궁사",
  "해운대 달맞이길",
  "해운대 동백섬",
  "해운대 블루라인파크",
  "해운대 영무파라드호텔",
  "해운대해수욕장",
  "해월전망대",
  "형제가든",
  "황령산",
  "황령산 전망대",
  "황령산레포츠공원",
  "회동수원지",
  "회동수원지 둘레길",
  "AJ하우스(AJ House)",
  "EL16.52",
  "JSTAY",
  "The Park Guest House",
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      areaCode = "6",
      numOfRows = "10",
      pageNo = "1",
      keyword = "",
      loadAllPetKeywords = false,
    } = await req.json().catch(() => ({}));

    const apiKey = Deno.env.get("KOREA_TOUR_API_KEY");
    if (!apiKey) {
      throw new Error("KOREA_TOUR_API_KEY not found in environment variables");
    }

    console.log("Pet Tourism API 호출 시작:", {
      areaCode,
      numOfRows,
      pageNo,
      keyword,
      loadAllPetKeywords,
    });

    let petTourismData = null;

    if (loadAllPetKeywords) {
      // 캐시 확인
      const cacheKey = "pet_friendly_places_busan_v3";
      const cachedData = getCached(cacheKey);

      if (cachedData) {
        console.log(`🎯 캐시에서 데이터 사용: ${cachedData.length}개`);
        petTourismData = {
          response: {
            header: {
              resultCode: "0000",
              resultMsg: "OK",
            },
            body: {
              totalCount: cachedData.length,
              numOfRows: cachedData.length,
              pageNo: 1,
              items: {
                item: cachedData,
              },
            },
          },
        };
      } else {
        console.log("=== 반려동물 여행지 전체 로딩 시작 ===");
        
        try {
          let decodedApiKey = apiKey;
          try {
            decodedApiKey = decodeURIComponent(apiKey);
          } catch (e) {
            decodedApiKey = apiKey;
          }

          const allResults = [];
          let successCount = 0;
          let errorCount = 0;

          // 키워드를 20개씩 청크로 나누어 병렬 처리 (더 빠른 속도)
          const chunkSize = 20;

          for (let i = 0; i < petFriendlyKeywords.length; i += chunkSize) {
            const chunk = petFriendlyKeywords.slice(i, i + chunkSize);
            const chunkIndex = Math.floor(i / chunkSize) + 1;
            const totalChunks = Math.ceil(petFriendlyKeywords.length / chunkSize);

            console.log(`📦 청크 ${chunkIndex}/${totalChunks} 처리 중... (키워드 ${i + 1}-${Math.min(i + chunkSize, petFriendlyKeywords.length)})`);

            // 각 청크를 병렬 처리
            const chunkPromises = chunk.map(async (keywordItem, index) => {
              const searchUrl = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(
                decodedApiKey
              )}&MobileOS=ETC&MobileApp=PetTravelApp&keyword=${encodeURIComponent(
                keywordItem
              )}&areaCode=${areaCode}&numOfRows=20&pageNo=1&_type=xml`;

              try {
                console.log(`🔍 [${i + index + 1}/${petFriendlyKeywords.length}] "${keywordItem}" 검색 중...`);

                const response = await fetch(searchUrl).catch(async (httpsError) => {
                  const httpUrl = searchUrl.replace("https://", "http://");
                  return await fetch(httpUrl);
                });

                if (response.ok) {
                  const responseText = await response.text();
                  const parsedData = parseXmlToJson(responseText);

                  if (parsedData?.response?.body?.items?.item) {
                    const items = Array.isArray(parsedData.response.body.items.item)
                      ? parsedData.response.body.items.item
                      : [parsedData.response.body.items.item];

                    const mappedItems = items.map((item) => ({
                      ...item,
                      searchKeyword: keywordItem,
                    }));

                    console.log(`✅ "${keywordItem}": ${mappedItems.length}개 결과 찾음`);
                    successCount++;
                    return mappedItems;
                  } else {
                    successCount++;
                    return [];
                  }
                } else {
                  console.log(`❌ "${keywordItem}": HTTP ${response.status} 오류`);
                  errorCount++;
                  return [];
                }
              } catch (error) {
                console.log(`💥 "${keywordItem}" 검색 실패: ${error.message}`);
                errorCount++;
                return [];
              }
            });

            const chunkResults = await Promise.all(chunkPromises);

            // 결과 집계
            for (const items of chunkResults) {
              if (items && items.length > 0) {
                allResults.push(...items);
              }
            }

            // 청크 간 짧은 간격 (API Rate Limiting 방지)
            if (chunkIndex < totalChunks) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }

          console.log(`=== 반려동물 여행지 검색 완료 ===`);
          console.log(`검색된 키워드: ${successCount}개`);
          console.log(`실패한 키워드: ${errorCount}개`);
          console.log(`수집된 장소: ${allResults.length}개`);

          // 중복 제거 (contentid 기준)
          const uniqueResults = allResults.reduce((acc, current) => {
            const exists = acc.find((item) => item.contentid === current.contentid);
            if (!exists) {
              acc.push(current);
            }
            return acc;
          }, []);

          console.log(`중복 제거 후 최종 장소: ${uniqueResults.length}개`);

          // 캐시에 저장
          setCache(cacheKey, uniqueResults);

          petTourismData = {
            response: {
              header: {
                resultCode: "0000",
                resultMsg: "OK",
              },
              body: {
                totalCount: uniqueResults.length,
                numOfRows: uniqueResults.length,
                pageNo: 1,
                items: {
                  item: uniqueResults,
                },
              },
            },
          };
        } catch (error) {
          console.error("반려동물 여행지 검색 실패:", error);
          throw error;
        }
      }
    } else {
      // 개별 키워드 검색 또는 일반 목록 조회
      let decodedApiKey = apiKey;
      try {
        decodedApiKey = decodeURIComponent(apiKey);
      } catch (e) {
        decodedApiKey = apiKey;
      }

      let searchUrl;
      if (keyword && keyword.trim()) {
        searchUrl = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(
          decodedApiKey
        )}&MobileOS=ETC&MobileApp=PetTravelApp&keyword=${encodeURIComponent(
          keyword.trim()
        )}&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
      } else {
        searchUrl = `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodeURIComponent(
          decodedApiKey
        )}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
      }

      console.log("Pet Search URL:", searchUrl);

      const response = await fetch(searchUrl).catch(async (httpsError) => {
        console.log("HTTPS failed, trying HTTP:", httpsError.message);
        const httpUrl = searchUrl.replace("https://", "http://");
        return await fetch(httpUrl);
      });

      if (response.ok) {
        const responseText = await response.text();
        petTourismData = parseXmlToJson(responseText);
        
        if (petTourismData?.error) {
          throw new Error(`Pet Tourism API service error: ${petTourismData.message}`);
        }
      } else {
        const responseText = await response.text();
        throw new Error(`Pet Tourism API failed with status: ${response.status}, body: ${responseText}`);
      }
    }

    // 응답 반환
    return new Response(JSON.stringify(petTourismData), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Pet Tourism API error:", errorMessage);
    
    return new Response(JSON.stringify({
      error: true,
      message: errorMessage
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});