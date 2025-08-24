import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// XML to JSON parsing utility
function parseXmlToJson(xmlText: string): any {
  try {
    // Remove XML declaration and any BOM
    const cleanXml = xmlText.replace(/^[\uFEFF\uFFFE]/, '').replace(/<\?xml[^>]*\?>/, '').trim();
    
    // Check for error messages first
    if (cleanXml.includes('<errMsg>') || cleanXml.includes('SERVICE ERROR')) {
      const errorMatch = cleanXml.match(/<errMsg>(.*?)<\/errMsg>/);
      if (errorMatch) {
        return { 
          error: true, 
          message: errorMatch[1],
          response: { header: { resultCode: "ERROR", resultMsg: errorMatch[1] } }
        };
      }
    }

    // Extract basic structure
    const response: any = {
      header: {},
      body: { items: { item: [] }, totalCount: 0, numOfRows: 0, pageNo: 1 }
    };

    // Extract header info
    const resultCodeMatch = cleanXml.match(/<resultCode>(.*?)<\/resultCode>/);
    const resultMsgMatch = cleanXml.match(/<resultMsg>(.*?)<\/resultMsg>/);
    const totalCountMatch = cleanXml.match(/<totalCount>(\d+)<\/totalCount>/);
    const numOfRowsMatch = cleanXml.match(/<numOfRows>(\d+)<\/numOfRows>/);
    const pageNoMatch = cleanXml.match(/<pageNo>(\d+)<\/pageNo>/);

    if (resultCodeMatch) response.header.resultCode = resultCodeMatch[1];
    if (resultMsgMatch) response.header.resultMsg = resultMsgMatch[1];
    if (totalCountMatch) response.body.totalCount = parseInt(totalCountMatch[1]);
    if (numOfRowsMatch) response.body.numOfRows = parseInt(numOfRowsMatch[1]);
    if (pageNoMatch) response.body.pageNo = parseInt(pageNoMatch[1]);

    // Extract items
    const itemsMatch = cleanXml.match(/<items>(.*?)<\/items>/s);
    if (itemsMatch) {
      const itemsContent = itemsMatch[1];
      const itemMatches = itemsContent.match(/<item>(.*?)<\/item>/gs);
      
      if (itemMatches) {
        response.body.items.item = itemMatches.map(itemMatch => {
          const item: any = {};
          const itemContent = itemMatch.replace(/<\/?item>/g, '');
          
          // Extract all fields within the item
          const fieldRegex = /<(\w+)>(.*?)<\/\1>/g;
          let fieldMatch;
          while ((fieldMatch = fieldRegex.exec(itemContent)) !== null) {
            const [, fieldName, fieldValue] = fieldMatch;
            item[fieldName] = fieldValue;
          }
          
          return item;
        });
      }
    }

    return { response };
  } catch (error) {
    console.error('XML parsing error:', error);
    return { 
      error: true, 
      message: 'Failed to parse XML response',
      response: { header: { resultCode: "PARSE_ERROR", resultMsg: "XML parsing failed" } }
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentId, contentTypeId } = await req.json();
    
    if (!contentId) {
      throw new Error('contentId is required');
    }

    const serviceKey = Deno.env.get('KOREA_TOUR_API_KEY');
    if (!serviceKey) {
      throw new Error('KOREA_TOUR_API_KEY environment variable is not set');
    }

    console.log(`Fetching detail info for contentId: ${contentId}, contentTypeId: ${contentTypeId}`);

    // API 키 디코딩 시도 (중복 인코딩 문제 해결)
    let decodedServiceKey = serviceKey;
    try {
      decodedServiceKey = decodeURIComponent(serviceKey);
    } catch (e) {
      // 디코딩 실패 시 원본 사용
      decodedServiceKey = serviceKey;
    }

    // Prepare API calls - URL encode the service key properly
    const baseParams = new URLSearchParams({
      serviceKey: encodeURIComponent(decodedServiceKey),
      MobileOS: 'ETC',
      MobileApp: 'PetTravelApp',
      contentId,
      _type: 'json'
    });

    if (contentTypeId) {
      baseParams.append('contentTypeId', contentTypeId);
    }

    const detailCommonUrl = `https://apis.data.go.kr/B551011/KorService2/detailCommon2?${baseParams}`;
    const detailIntroUrl = contentTypeId ? 
      `https://apis.data.go.kr/B551011/KorService2/detailIntro2?${baseParams}` : null;
    const detailImageUrl = `https://apis.data.go.kr/B551011/KorService2/detailImage2?${baseParams}&imageYN=Y&subImageYN=Y`;

    console.log('Detail Common URL:', detailCommonUrl);
    console.log('Detail Intro URL:', detailIntroUrl);
    console.log('Detail Image URL:', detailImageUrl);

    // Make parallel API calls
    const promises = [
      fetch(detailCommonUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/json, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache'
        }
      }).catch(() => 
        fetch(detailCommonUrl.replace('https://', 'http://'), {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/json, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
          }
        })
      ),
      detailIntroUrl ? 
        fetch(detailIntroUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/json, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
          }
        }).catch(() => 
          fetch(detailIntroUrl.replace('https://', 'http://'), {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/json, text/json, */*',
              'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache'
            }
          })
        ) : Promise.resolve(null),
      fetch(detailImageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/json, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache'
        }
      }).catch(() => 
        fetch(detailImageUrl.replace('https://', 'http://'), {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/json, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
          }
        })
      )
    ];

    const [commonResponse, introResponse, imageResponse] = await Promise.all(promises);

    // Process responses
    let commonData = null;
    let introData = null;
    let imageData = null;

    // Process common data
    if (commonResponse && commonResponse.ok) {
      const commonText = await commonResponse.text();
      console.log('[Common] Response Status:', commonResponse.status, commonResponse.statusText);
      console.log('[Common] Raw Response (first 1000 chars):\n', commonText.substring(0, 1000));
      
      // Check for API errors in response
      if (commonText.includes('SERVICE ERROR') || commonText.includes('errMsg')) {
        console.error('[Common] API Error detected in response');
        const errorMatch = commonText.match(/<errMsg>(.*?)<\/errMsg>/);
        if (errorMatch) {
          console.error('[Common] Error message:', errorMatch[1]);
        }
      }
      
      try {
        commonData = JSON.parse(commonText);
        console.log('[Common] Successfully parsed as JSON:', Object.keys(commonData || {}));
      } catch {
        console.log('[Common] JSON parse failed, trying XML parsing');
        const parsed = parseXmlToJson(commonText);
        commonData = parsed.error ? null : parsed;
        console.log('[Common] XML parse result:', parsed.error ? 'Error' : 'Success', parsed.error || Object.keys(parsed || {}));
      }
    } else {
      console.error('[Common] Response not OK:', commonResponse?.status, commonResponse?.statusText);
    }

    // Process intro data
    if (introResponse && introResponse.ok) {
      const introText = await introResponse.text();
      console.log('[Intro] Response Status:', introResponse.status, introResponse.statusText);
      console.log('[Intro] Raw Response (first 1000 chars):\n', introText.substring(0, 1000));
      
      // Check for API errors
      if (introText.includes('SERVICE ERROR') || introText.includes('errMsg')) {
        console.error('[Intro] API Error detected in response');
        const errorMatch = introText.match(/<errMsg>(.*?)<\/errMsg>/);
        if (errorMatch) {
          console.error('[Intro] Error message:', errorMatch[1]);
        }
      }
      
      try {
        introData = JSON.parse(introText);
        console.log('[Intro] Successfully parsed as JSON:', Object.keys(introData || {}));
      } catch {
        console.log('[Intro] JSON parse failed, trying XML parsing');
        const parsed = parseXmlToJson(introText);
        introData = parsed.error ? null : parsed;
        console.log('[Intro] XML parse result:', parsed.error ? 'Error' : 'Success', parsed.error || Object.keys(parsed || {}));
      }
    } else {
      console.error('[Intro] Response not OK:', introResponse?.status, introResponse?.statusText);
    }

    // Process image data
    if (imageResponse && imageResponse.ok) {
      const imageText = await imageResponse.text();
      console.log('[Image] Response Status:', imageResponse.status, imageResponse.statusText);
      console.log('[Image] Raw Response (first 1000 chars):\n', imageText.substring(0, 1000));
      
      // Check for API errors
      if (imageText.includes('SERVICE ERROR') || imageText.includes('errMsg')) {
        console.error('[Image] API Error detected in response');
        const errorMatch = imageText.match(/<errMsg>(.*?)<\/errMsg>/);
        if (errorMatch) {
          console.error('[Image] Error message:', errorMatch[1]);
        }
      }
      
      try {
        imageData = JSON.parse(imageText);
        console.log('[Image] Successfully parsed as JSON:', Object.keys(imageData || {}));
      } catch {
        console.log('[Image] JSON parse failed, trying XML parsing');
        const parsed = parseXmlToJson(imageText);
        imageData = parsed.error ? null : parsed;
        console.log('[Image] XML parse result:', parsed.error ? 'Error' : 'Success', parsed.error || Object.keys(parsed || {}));
      }
    } else {
      console.error('[Image] Response not OK:', imageResponse?.status, imageResponse?.statusText);
    }

    // Combine results
    const result = {
      common: commonData,
      intro: introData,
      images: imageData
    };

    console.log('Combined result prepared');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in tour-detail-api:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});