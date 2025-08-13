import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { areaCode = '1', numOfRows = '10', pageNo = '1' } = await req.json().catch(() => ({}));
    
    console.log('Mock API called with params:', { areaCode, numOfRows, pageNo });

    // 목업 데이터 - 실제 API 응답 형식과 동일하게 구성
    const mockTourismData = {
      response: {
        header: {
          resultCode: "0000",
          resultMsg: "OK"
        },
        body: {
          items: {
            item: [
              {
                contentid: "126508",
                title: "경복궁",
                addr1: "서울특별시 종로구 사직로 161",
                addr2: "(세종로)",
                firstimage: "http://tong.visitkorea.or.kr/cms/resource/23/2476623_image2_1.jpg",
                firstimage2: "http://tong.visitkorea.or.kr/cms/resource/23/2476623_image3_1.jpg",
                tel: "02-3700-3900",
                mapx: "126.977041000000",
                mapy: "37.578606000000",
                areacode: "1",
                sigungucode: "1"
              },
              {
                contentid: "264384",
                title: "창덕궁",
                addr1: "서울특별시 종로구 율곡로 99",
                addr2: "(원서동)",
                firstimage: "http://tong.visitkorea.or.kr/cms/resource/83/2678083_image2_1.jpg",
                firstimage2: "http://tong.visitkorea.or.kr/cms/resource/83/2678083_image3_1.jpg",
                tel: "02-3668-2300",
                mapx: "126.991117000000",
                mapy: "37.578501000000",
                areacode: "1",
                sigungucode: "1"
              },
              {
                contentid: "126485",
                title: "남산서울타워",
                addr1: "서울특별시 용산구 남산공원길 105",
                addr2: "(용산동2가)",
                firstimage: "http://tong.visitkorea.or.kr/cms/resource/18/2476318_image2_1.jpg",
                firstimage2: "http://tong.visitkorea.or.kr/cms/resource/18/2476318_image3_1.jpg",
                tel: "02-3455-9277",
                mapx: "126.988227000000",
                mapy: "37.551169000000",
                areacode: "1",
                sigungucode: "1"
              }
            ]
          },
          totalCount: 150,
          pageNo: parseInt(pageNo),
          numOfRows: parseInt(numOfRows)
        }
      }
    };

    const mockPetTourismData = {
      response: {
        header: {
          resultCode: "0000",
          resultMsg: "OK"
        },
        body: {
          items: {
            item: [
              {
                contentid: "2830983",
                title: "한강공원 반포지구",
                addr1: "서울특별시 서초구 신반포로11길 40",
                addr2: "",
                firstimage: "http://tong.visitkorea.or.kr/cms/resource/50/2830950_image2_1.jpg",
                firstimage2: "http://tong.visitkorea.or.kr/cms/resource/50/2830950_image3_1.jpg",
                tel: "02-3780-0501",
                mapx: "126.996917000000",
                mapy: "37.508147000000",
                areacode: "1",
                sigungucode: "1"
              },
              {
                contentid: "2830985",
                title: "올림픽공원",
                addr1: "서울특별시 송파구 올림픽로 424",
                addr2: "(방이동)",
                firstimage: "http://tong.visitkorea.or.kr/cms/resource/52/2830952_image2_1.jpg",
                firstimage2: "http://tong.visitkorea.or.kr/cms/resource/52/2830952_image3_1.jpg",
                tel: "02-410-1114",
                mapx: "127.124041000000",
                mapy: "37.519401000000",
                areacode: "1",
                sigungucode: "1"
              }
            ]
          },
          totalCount: 50,
          pageNo: parseInt(pageNo),
          numOfRows: parseInt(numOfRows)
        }
      }
    };

    const combinedData = {
      tourismData: mockTourismData,
      petTourismData: mockPetTourismData,
      requestParams: { areaCode, numOfRows, pageNo },
      timestamp: new Date().toISOString(),
      status: {
        tourism: 'success',
        petTourism: 'success'
      },
      note: 'Mock data for testing - replace with real API once fixed'
    };

    console.log('Returning mock data successfully');

    return new Response(JSON.stringify(combinedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mock-tour-api function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});