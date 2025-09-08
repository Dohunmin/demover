import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sampleData } from "./sample-data.ts";

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

function setCache(key: string, data: unknown) {
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
    const result: unknown = {};

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

    const body: unknown = {
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
      const item: unknown = {};

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

// 반려동물 동반 가능한 키워드 목록 (52개로 최적화)
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
  "구덕포끝집고기",
  "그림하우스",
  "대보름",
  "대저생태공원",
  "대저수문 생태공원",
  "더웨이브",
  "덕미",
  "듀스포레",
  "만달리",
  "맥도생태공원",
  "모닝듀 게스트 하우스(모닝듀)",
  "무명일기",
  "불란서그로서리",
  "브리타니",
  "비아조",
  "성안집",
  "송정물총칼국수",
  "스노잉클라우드",
  "알로이삥삥",
  "오구카페",
  "웨스턴챔버",
  "웨이브온 커피",
  "윙민박",
  "유정1995 기장 본점",
  "을숙도 공원",
  "이바구캠프",
  "카페베이스",
  "팝콘 호스텔 해운대점",
  "프루터리포레스트",
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
  "The Park Guest House"
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
      activeTab = "general",
      loadAllPetKeywords = false,
    } = await req.json().catch(() => ({}));

    const apiKey = Deno.env.get("KOREA_TOUR_API_KEY");
    if (!apiKey) {
      throw new Error("KOREA_TOUR_API_KEY not found in environment variables");
    }

    console.log("Calling Korean Tourism APIs with params:", {
      areaCode,
      numOfRows,
      pageNo,
      keyword,
      activeTab,
    });

    // 응답 데이터 초기화
    let tourismData = null;
    let petTourismData = null;
    let tourismError = null;
    let petTourismError = null;

    // activeTab에 따라 해당하는 API만 호출
    if (activeTab === "general") {
      // 1. 한국관광공사 국문 관광정보 서비스 호출 (일반 관광지만)
      try {
        // API 키 디코딩 시도 (중복 인코딩 문제 해결)
        let decodedApiKey = apiKey;
        try {
          decodedApiKey = decodeURIComponent(apiKey);
        } catch (e) {
          // 디코딩 실패 시 원본 사용
          decodedApiKey = apiKey;
        }

        // 키워드가 있으면 검색 API 사용, 없으면 지역별 목록 API 사용
        let tourismUrl;
        if (keyword && keyword.trim()) {
          // 검색 기반 정보 서비스 API 사용
          tourismUrl = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(
            decodedApiKey
          )}&MobileOS=ETC&MobileApp=PetTravelApp&keyword=${encodeURIComponent(
            keyword.trim()
          )}&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
        } else {
          // 지역 기반 목록 API 사용
          tourismUrl = `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodeURIComponent(
            decodedApiKey
          )}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
        }
        console.log("Tourism API URL:", tourismUrl);

        // HTTPS 요청 시도
        let tourismResponse = await fetch(tourismUrl, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "application/xml, text/xml, */*",
            "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
          },
        }).catch(async (httpsError) => {
          console.log("HTTPS failed, trying HTTP:", httpsError.message);
          // HTTPS 실패 시 HTTP로 재시도
          const httpUrl = tourismUrl.replace("https://", "http://");
          return await fetch(httpUrl, {
            method: "GET",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              Accept: "application/xml, text/xml, */*",
              "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
              "Cache-Control": "no-cache",
            },
          });
        });
        console.log("Tourism API Response Status:", tourismResponse.status);

        if (tourismResponse.ok) {
          const responseText = await tourismResponse.text();
          console.log(
            "Tourism API Raw Response:",
            responseText.substring(0, 300)
          );

          // 항상 XML로 파싱 시도 (API가 XML을 반환함)
          tourismData = parseXmlToJson(responseText);
          if (tourismData?.error) {
            tourismError = `Tourism API service error: ${tourismData.message}`;
            tourismData = null;
          }

          if (tourismData) {
            console.log("Tourism API Success");
          }
        } else {
          const responseText = await tourismResponse.text();
          tourismError = `Tourism API failed with status: ${tourismResponse.status}, body: ${responseText}`;
          console.error(tourismError);
        }
      } catch (error) {
        tourismError = `Tourism API error: ${error.message}`;
        console.error(tourismError);
      }
    }

    if (activeTab === "pet") {
      // 2. 한국관광공사 반려동물 동반 여행지 서비스 호출 (반려동물만)
      if (loadAllPetKeywords) {
        // 캐시 확인
        const cacheKey = "pet_friendly_places_busan_v3"; // 새 버전으로 캐시 키 변경
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
          console.log("=== 반려동물 여행지 2단계 검색 시작 ===");
          
          const startTime = Date.now();
          let decodedApiKey = apiKey;
          try {
            decodedApiKey = decodeURIComponent(apiKey);
          } catch (e) {
            decodedApiKey = apiKey;
          }

          const allResults = [];

          // 1단계: areaBasedList API로 기존 43개 반려동물 정보 수집
          console.log("📍 1단계: areaBasedList API로 기존 반려동물 정보 수집 중...");
          
          try {
            const areaBasedUrl = `https://apis.data.go.kr/B551011/KorPetTourService/areaBasedList?serviceKey=${encodeURIComponent(
              decodedApiKey
            )}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=${areaCode}&numOfRows=100&pageNo=1&_type=xml`;

            console.log("areaBasedList API URL:", areaBasedUrl);

            const areaBasedResponse = await fetch(areaBasedUrl).catch(
              async (httpsError) => {
                console.log("HTTPS 실패, HTTP로 재시도");
                const httpUrl = areaBasedUrl.replace("https://", "http://");
                return await fetch(httpUrl);
              }
            );

            if (areaBasedResponse.ok) {
              const responseText = await areaBasedResponse.text();
              console.log(`areaBasedList 응답 길이: ${responseText.length}`);
              
              const parsedData = parseXmlToJson(responseText);
              
              if (parsedData?.response?.body?.items?.item) {
                const items = Array.isArray(parsedData.response.body.items.item)
                  ? parsedData.response.body.items.item
                  : [parsedData.response.body.items.item];
                
                items.forEach((item) => {
                  allResults.push({
                    ...item,
                    searchKeyword: "areaBasedList",
                  });
                });
                
                console.log(`✅ 1단계 완료: areaBasedList에서 ${items.length}개 수집`);
              }
            } else {
              console.log(`⚠️ areaBasedList API 실패: ${areaBasedResponse.status}`);
            }
          } catch (error) {
            console.log(`⚠️ areaBasedList API 오류: ${error.message}`);
          }

          // 2단계: 52개 키워드로 추가 반려동물 여행지 검색
          console.log(`📍 2단계: ${petFriendlyKeywords.length}개 키워드로 추가 검색 중...`);

          
          try {
            let totalSearched = 0;
            let successCount = 0;
            let errorCount = 0;

            // 키워드를 8개씩 청크로 나누어 병렬 처리 (속도 개선)
            const chunkSize = 8;
            const promises = [];

            for (let i = 0; i < petFriendlyKeywords.length; i += chunkSize) {
              const chunk = petFriendlyKeywords.slice(i, i + chunkSize);
              const chunkIndex = Math.floor(i / chunkSize) + 1;
              const totalChunks = Math.ceil(petFriendlyKeywords.length / chunkSize);

              console.log(
                `📦 청크 ${chunkIndex}/${totalChunks} 처리 중... (키워드 ${
                  i + 1
                }-${Math.min(i + chunkSize, petFriendlyKeywords.length)})`
              );

              // 각 청크를 병렬 처리
              const chunkPromise = Promise.all(
                chunk.map(async (keywordItem, index) => {
                  const searchUrl = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?arrange=O&serviceKey=${encodeURIComponent(
                    decodedApiKey
                  )}&MobileOS=ETC&MobileApp=PetTravelApp&keyword=${encodeURIComponent(
                    keywordItem
                  )}&areaCode=${areaCode}&numOfRows=20&pageNo=1&_type=xml`;

                  // 재시도 로직 (최대 3번 시도)
                  for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                      console.log(
                        `🔍 [${i + index + 1}/${
                          petFriendlyKeywords.length
                        }] "${keywordItem}" 검색 중... (시도 ${attempt}/3)`
                      );

                      const response = await fetch(searchUrl).catch(
                        async (httpsError) => {
                          if (attempt === 1) {
                            console.log(
                              `⚠️ HTTPS 실패, HTTP로 재시도: ${keywordItem}`
                            );
                          }
                          const httpUrl = searchUrl.replace("https://", "http://");
                          return await fetch(httpUrl);
                        }
                      );

                      if (response.ok) {
                        const responseText = await response.text();
                        
                        const parsedData = parseXmlToJson(responseText);
                        
                        if (parsedData?.response?.body?.items?.item) {
                          // 다건 응답 시 첫 번째 아이템만 사용
                          const items = Array.isArray(parsedData.response.body.items.item)
                            ? [parsedData.response.body.items.item[0]]
                            : [parsedData.response.body.items.item];

                          items.forEach((item) => {
                            allResults.push({
                              ...item,
                              searchKeyword: keywordItem,
                            });
                          });

                          successCount++;
                          console.log(
                            `✅ [${i + index + 1}] "${keywordItem}" 성공: ${items.length}개 수집`
                          );
                        } else {
                          console.log(`⚠️ [${i + index + 1}] "${keywordItem}" 결과 없음`);
                        }
                        break; // 성공 시 재시도 루프 탈출
                      } else {
                        throw new Error(`HTTP ${response.status}`);
                      }
                    } catch (error) {
                      console.log(
                        `❌ [${i + index + 1}] "${keywordItem}" 실패 (시도 ${attempt}/3): ${error.message}`
                      );
                      
                      if (attempt === 3) {
                        errorCount++;
                      } else {
                        // 재시도 전 잠시 대기
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                      }
                    }
                  }
                  
                  totalSearched++;
                })
              );

              promises.push(chunkPromise);
              
              // 청크 간 잠시 대기 (API 부하 방지)
              if (i + chunkSize < petFriendlyKeywords.length) {
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            }

            // 모든 청크 완료 대기
            await Promise.all(promises);

            console.log(`✅ 2단계 완료: 키워드 검색에서 ${successCount}개 성공, ${errorCount}개 실패`);
          } catch (error) {
            console.error(`💥 2단계 키워드 검색 중 오류 발생: ${error.message}`);
          }

          const endTime = Date.now();
          const totalTime = (endTime - startTime) / 1000;

          console.log(
            `🎯 전체 수집 완료: 총 ${allResults.length}개 수집 (소요시간: ${totalTime}초)`
          );

          // 중복 제거 없이 모든 결과 사용
          const uniqueResults = allResults;
          
          console.log(
            `✨ 중복 제거 없이 모든 결과 사용: ${uniqueResults.length}개 최종 결과`
          );

          // 카테고리별 분류 통계
          const categoryStats = {};
          uniqueResults.forEach((item) => {
            const cat = item.cat1 || "unknown";
            categoryStats[cat] = (categoryStats[cat] || 0) + 1;
          });

          console.log("📂 카테고리별 분포:");
          Object.entries(categoryStats).forEach(([category, count]) => {
            console.log(`   - ${category}: ${count}개`);
          });

          // 샘플 데이터를 Map으로 변환 (O(1) 조회 성능)
          const sampleDataMap = new Map();
          sampleData.forEach((data) => {
            sampleDataMap.set(data.title, {
              locationGubun: data.locationGubun,
              mbti: data.mbti,
              holiday: data.holiday,
            });
          });

          console.log("샘플 데이터 Map 생성 완료:", sampleDataMap.size, "개");

          // 응답 형태로 구성 - 모든 필드 포함하여 완전한 데이터 제공
          const simplifiedResults = uniqueResults.map((item) => {
            // Map에서 빠르게 조회 (O(1) 성능)
            const additionalInfo = sampleDataMap.get(item.title) || {
              locationGubun: null,
              mbti: null,
              holiday: null,
            };

            console.log("title: ", item.title);
            console.log("additionalInfo: ", additionalInfo);

            return {
              contentid: item.contentid || "",
              contenttypeid: item.contenttypeid || "",
              title: item.title || "",
              addr1: item.addr1 || "",
              addr2: item.addr2 || "",
              zipcode: item.zipcode || "",
              tel: item.tel || "",
              mapx: item.mapx || "",
              mapy: item.mapy || "",
              firstimage: item.firstimage || "",
              firstimage2: item.firstimage2 || "",
              areacode: item.areacode || "",
              sigungucode: item.sigungucode || "",
              cat1: item.cat1 || "",
              cat2: item.cat2 || "",
              cat3: item.cat3 || "",
              createdtime: item.createdtime || "",
              modifiedtime: item.modifiedtime || "",
              mlevel: item.mlevel || "",
              searchKeyword: item.searchKeyword || "",
              // 빠진 필드들 추가
              cpyrhtDivCd: item.cpyrhtDivCd || "",
              lDongRegnCd: item.lDongRegnCd || "",
              lDongSignguCd: item.lDongSignguCd || "",
              lclsSystm1: item.lclsSystm1 || "",
              lclsSystm2: item.lclsSystm2 || "",
              lclsSystm3: item.lclsSystm3 || "",
              // JSON 파일에서 매칭된 새로운 필드들
              locationGubun: additionalInfo.locationGubun,
              mbti: additionalInfo.mbti,
              holiday: additionalInfo.holiday,
            };
          });

          // 캐시에 저장
          setCache(cacheKey, simplifiedResults);

          petTourismData = {
            response: {
              header: {
                resultCode: "0000",
                resultMsg: "OK",
              },
              body: {
                totalCount: simplifiedResults.length,
                numOfRows: simplifiedResults.length,
                pageNo: 1,
                items: {
                  item: simplifiedResults,
                },
              },
            },
          };

          console.log("=== 반려동물 여행지 2단계 검색 완료 ===");
        }
      } else {
        // 기존 방식: 단일 API 호출
        try {
          // API 키 디코딩 시도 (중복 인코딩 문제 해결)
          let decodedApiKey = apiKey;
          try {
            decodedApiKey = decodeURIComponent(apiKey);
          } catch (e) {
            // 디코딩 실패 시 원본 사용
            decodedApiKey = apiKey;
          }

          // 키워드가 있으면 검색 API 사용, 없으면 지역별 목록 API 사용
          let petTourismUrl;
          if (keyword && keyword.trim()) {
            // 반려동물 검색 기반 정보 서비스 API 사용
            petTourismUrl = `https://apis.data.go.kr/B551011/KorPetTourService/searchKeyword?serviceKey=${encodeURIComponent(
              decodedApiKey
            )}&MobileOS=ETC&MobileApp=PetTravelApp&keyword=${encodeURIComponent(
              keyword.trim()
            )}&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
          } else {
            // 반려동물 지역 기반 목록 API 사용
            petTourismUrl = `https://apis.data.go.kr/B551011/KorPetTourService/areaBasedList?serviceKey=${encodeURIComponent(
              decodedApiKey
            )}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
          }
          console.log("Pet Tourism API URL:", petTourismUrl);

          // HTTPS 요청 시도
          let petTourismResponse = await fetch(petTourismUrl, {
            method: "GET",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              Accept: "application/xml, text/xml, */*",
              "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
              "Cache-Control": "no-cache",
            },
          }).catch(async (httpsError) => {
            console.log(
              "Pet Tourism HTTPS failed, trying HTTP:",
              httpsError.message
            );
            // HTTPS 실패 시 HTTP로 재시도
            const httpUrl = petTourismUrl.replace("https://", "http://");
            return await fetch(httpUrl, {
              method: "GET",
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "application/xml, text/xml, */*",
                "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
              },
            });
          });
          console.log(
            "Pet Tourism API Response Status:",
            petTourismResponse.status
          );

          if (petTourismResponse.ok) {
            const responseText = await petTourismResponse.text();
            console.log(
              "Pet Tourism API Raw Response:",
              responseText.substring(0, 300)
            );

            // 항상 XML로 파싱 시도 (API가 XML을 반환함)
            petTourismData = parseXmlToJson(responseText);
            if (petTourismData?.error) {
              petTourismError = `Pet Tourism API service error: ${petTourismData.message}`;
              petTourismData = null;
            }

            if (petTourismData) {
              console.log("Pet Tourism API Success");
            }
          } else {
            const responseText = await petTourismResponse.text();
            petTourismError = `Pet Tourism API failed with status: ${petTourismResponse.status}, body: ${responseText}`;
            console.error(petTourismError);
          }
        } catch (error) {
          petTourismError = `Pet Tourism API error: ${error.message}`;
          console.error(petTourismError);
        }
      }
    }

    // 결과 확인 및 응답 구성
    if (activeTab === "general" && !tourismData) {
      throw new Error(`General Tourism API failed: ${tourismError}`);
    }

    if (activeTab === "pet" && !petTourismData) {
      throw new Error(`Pet Tourism API failed: ${petTourismError}`);
    }

    // 요청된 탭에 따라 해당 데이터만 반환
    const combinedData = {
      tourismData:
        activeTab === "general" ? tourismData || { error: tourismError } : null,
      petTourismData:
        activeTab === "pet"
          ? petTourismData || { error: petTourismError }
          : null,
      requestParams: { areaCode, numOfRows, pageNo, activeTab },
      timestamp: new Date().toISOString(),
      status: {
        tourism:
          activeTab === "general"
            ? tourismData
              ? "success"
              : "failed"
            : "not_requested",
        petTourism:
          activeTab === "pet"
            ? petTourismData
              ? "success"
              : "failed"
            : "not_requested",
      },
    };

    console.log("Final response prepared:", {
      activeTab,
      tourismSuccess: activeTab === "general" ? !!tourismData : "not_requested",
      petTourismSuccess:
        activeTab === "pet" ? !!petTourismData : "not_requested",
    });

    return new Response(JSON.stringify(combinedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in combined-tour-api function:", error);

    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
