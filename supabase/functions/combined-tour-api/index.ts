import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parseXmlToJson(xmlString: string) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    function xmlToJson(node: any): any {
      const obj: any = {};
      
      if (node.nodeType === 1) { // Element
        if (node.attributes.length > 0) {
          for (let i = 0; i < node.attributes.length; i++) {
            const attribute = node.attributes.item(i);
            obj[attribute.nodeName] = attribute.nodeValue;
          }
        }
      } else if (node.nodeType === 3) { // Text
        return node.nodeValue?.trim();
      }

      if (node.hasChildNodes()) {
        for (let child of node.childNodes) {
          const nodeName = child.nodeName;
          
          if (nodeName === '#text') {
            const text = child.nodeValue?.trim();
            if (text) {
              return text;
            }
          } else {
            if (obj[nodeName] === undefined) {
              obj[nodeName] = xmlToJson(child);
            } else {
              if (!Array.isArray(obj[nodeName])) {
                obj[nodeName] = [obj[nodeName]];
              }
              obj[nodeName].push(xmlToJson(child));
            }
          }
        }
      }
      
      return obj;
    }

    return xmlToJson(xmlDoc);
  } catch (error) {
    console.error('XML 파싱 오류:', error);
    return { error: 'XML 파싱 실패', message: error.message };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { areaCode, numOfRows, pageNo, keyword, activeTab, loadAllPetKeywords } = await req.json();
    
    console.log('=== Combined Tour API 호출 ===', {
      areaCode, numOfRows, pageNo, keyword, activeTab, loadAllPetKeywords
    });

    const apiKey = Deno.env.get('KOREA_TOUR_API_KEY');
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다');
    }

    let tourismData = null;
    let petTourismData = null;
    let tourismError = null;
    let petTourismError = null;

    // 일반 관광지 API 호출
    if (activeTab === "general") {
      try {
        let decodedApiKey = apiKey;
        try {
          decodedApiKey = decodeURIComponent(apiKey);
        } catch (e) {
          decodedApiKey = apiKey;
        }

        let tourismUrl;
        if (keyword && keyword.trim()) {
          tourismUrl = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=TravelApp&keyword=${encodeURIComponent(keyword.trim())}&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
        } else {
          tourismUrl = `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=TravelApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
        }

        const tourismResponse = await fetch(tourismUrl);
        if (tourismResponse.ok) {
          const responseText = await tourismResponse.text();
          tourismData = parseXmlToJson(responseText);
          if (tourismData?.error) {
            tourismError = `Tourism API service error: ${tourismData.message}`;
            tourismData = null;
          }
        } else {
          tourismError = `Tourism API failed with status: ${tourismResponse.status}`;
        }
      } catch (error) {
        tourismError = `Tourism API error: ${error.message}`;
      }
    }

    // 반려동물 여행지 API 호출
    if (activeTab === "pet") {
      if (loadAllPetKeywords) {
        // 빠른 페이징 방식으로 모든 데이터 수집
        console.log('=== 반려동물 여행지 빠른 페이징 수집 시작 ===');
        
        try {
          let decodedApiKey = apiKey;
          try {
            decodedApiKey = decodeURIComponent(apiKey);
          } catch (e) {
            decodedApiKey = apiKey;
          }
          
          const allResults = [];
          const maxPages = 3;
          
          for (let page = 1; page <= maxPages; page++) {
            console.log(`📄 페이지 ${page}/${maxPages} 수집 중...`);
            
            const pageUrl = `https://apis.data.go.kr/B551011/KorPetTourService/areaBasedList?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=${areaCode}&numOfRows=100&pageNo=${page}&_type=xml`;
            
            const response = await fetch(pageUrl).catch(async (httpsError) => {
              const httpUrl = pageUrl.replace('https://', 'http://');
              return await fetch(httpUrl);
            });
            
            if (response.ok) {
              const responseText = await response.text();
              const parsedData = parseXmlToJson(responseText);
              
              if (parsedData?.response?.body?.items?.item) {
                const items = Array.isArray(parsedData.response.body.items.item) 
                  ? parsedData.response.body.items.item 
                  : [parsedData.response.body.items.item];
                
                console.log(`✅ 페이지 ${page}: ${items.length}개 수집`);
                allResults.push(...items);
                
                if (items.length < 100) {
                  console.log(`🏁 마지막 페이지 도달`);
                  break;
                }
              } else {
                console.log(`📭 페이지 ${page}: 데이터 없음`);
                break;
              }
            } else {
              console.log(`❌ 페이지 ${page}: 오류 ${response.status}`);
              break;
            }
          }
          
          console.log(`🎉 총 ${allResults.length}개 수집 완료!`);
          
          petTourismData = {
            response: {
              header: { resultCode: "0000", resultMsg: "OK" },
              body: {
                totalCount: allResults.length,
                numOfRows: allResults.length,
                pageNo: 1,
                items: { item: allResults }
              }
            }
          };
          
        } catch (error) {
          console.error('페이징 수집 중 오류:', error);
          petTourismError = `페이징 수집 오류: ${error.message}`;
        }
      } else {
        // 기존 방식: 단일 API 호출
        try {
          let decodedApiKey = apiKey;
          try {
            decodedApiKey = decodeURIComponent(apiKey);
          } catch (e) {
            decodedApiKey = apiKey;
          }
          
          let petTourismUrl;
          if (keyword && keyword.trim()) {
            petTourismUrl = `https://apis.data.go.kr/B551011/KorPetTourService/searchKeyword?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=PetTravelApp&keyword=${encodeURIComponent(keyword.trim())}&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
          } else {
            petTourismUrl = `https://apis.data.go.kr/B551011/KorPetTourService/areaBasedList?serviceKey=${encodeURIComponent(decodedApiKey)}&MobileOS=ETC&MobileApp=PetTravelApp&areaCode=${areaCode}&numOfRows=${numOfRows}&pageNo=${pageNo}&_type=xml`;
          }
          
          const petTourismResponse = await fetch(petTourismUrl).catch(async (httpsError) => {
            const httpUrl = petTourismUrl.replace('https://', 'http://');
            return await fetch(httpUrl);
          });
          
          if (petTourismResponse.ok) {
            const responseText = await petTourismResponse.text();
            petTourismData = parseXmlToJson(responseText);
            if (petTourismData?.error) {
              petTourismError = `Pet Tourism API service error: ${petTourismData.message}`;
              petTourismData = null;
            }
          } else {
            petTourismError = `Pet Tourism API failed with status: ${petTourismResponse.status}`;
          }
        } catch (error) {
          petTourismError = `Pet Tourism API error: ${error.message}`;
        }
      }
    }

    // 결과 검증
    if (activeTab === "general" && !tourismData) {
      throw new Error(`General Tourism API failed: ${tourismError}`);
    }
    
    if (activeTab === "pet" && !petTourismData) {
      throw new Error(`Pet Tourism API failed: ${petTourismError}`);
    }

    // 응답 데이터 구성
    const combinedData = {
      tourismData: activeTab === "general" ? (tourismData || { error: tourismError }) : null,
      petTourismData: activeTab === "pet" ? (petTourismData || { error: petTourismError }) : null,
      requestParams: { areaCode, numOfRows, pageNo, activeTab },
      timestamp: new Date().toISOString(),
      status: {
        tourism: activeTab === "general" ? (tourismData ? 'success' : 'failed') : 'not_requested',
        petTourism: activeTab === "pet" ? (petTourismData ? 'success' : 'failed') : 'not_requested'
      }
    };

    console.log('Final response prepared:', {
      activeTab,
      tourismSuccess: activeTab === "general" ? !!tourismData : 'not_requested',
      petTourismSuccess: activeTab === "pet" ? !!petTourismData : 'not_requested'
    });

    return new Response(JSON.stringify(combinedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in combined-tour-api function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});