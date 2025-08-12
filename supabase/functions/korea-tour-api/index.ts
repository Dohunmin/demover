import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('keyword')
    const pageNo = searchParams.get('pageNo') || '1'
    const numOfRows = searchParams.get('numOfRows') || '10'
    const areaCode = searchParams.get('areaCode')
    const sigunguCode = searchParams.get('sigunguCode')

    const serviceKey = Deno.env.get('KTO_TOUR_SERVICE_KEY')
    if (!serviceKey) {
      throw new Error('KTO_TOUR_SERVICE_KEY not found')
    }

    const baseUrl = 'https://apis.data.go.kr/B551011/KorService1'
    const operation = keyword ? 'searchKeyword1' : 'areaBasedList1'
    
    const apiParams = new URLSearchParams({
      serviceKey,
      _type: 'json',
      MobileOS: 'ETC',
      MobileApp: 'LovableApp',
      pageNo,
      numOfRows,
    })

    if (keyword) {
      apiParams.append('keyword', keyword)
    }
    if (areaCode) {
      apiParams.append('areaCode', areaCode)
    }
    if (sigunguCode) {
      apiParams.append('sigunguCode', sigunguCode)
    }

    const apiUrl = `${baseUrl}/${operation}?${apiParams.toString()}`
    
    const response = await fetch(apiUrl)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    // 응답 데이터 가공
    const items = data.response?.body?.items?.item || []
    const processedData = Array.isArray(items) ? items.map((item: any) => ({
      contentId: item.contentid,
      title: item.title,
      addr1: item.addr1 || '',
      addr2: item.addr2 || '',
      image: item.firstimage || item.firstimage2 || '',
      tel: item.tel || '',
      mapx: item.mapx || '',
      mapy: item.mapy || '',
      areacode: item.areacode || '',
      sigungucode: item.sigungucode || ''
    })) : [items].map((item: any) => ({
      contentId: item.contentid,
      title: item.title,
      addr1: item.addr1 || '',
      addr2: item.addr2 || '',
      image: item.firstimage || item.firstimage2 || '',
      tel: item.tel || '',
      mapx: item.mapx || '',
      mapy: item.mapy || '',
      areacode: item.areacode || '',
      sigungucode: item.sigungucode || ''
    }))

    const result = {
      pageNo: parseInt(pageNo),
      numOfRows: parseInt(numOfRows),
      totalCount: data.response?.body?.totalCount || 0,
      data: processedData
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Korea Tour API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})