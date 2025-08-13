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
    const numOfRows = searchParams.get('numOfRows') || '100'
    const areaCode = searchParams.get('areaCode')
    const sigunguCode = searchParams.get('sigunguCode')
    const operation = searchParams.get('operation') || 'areaBasedList1'

    const serviceKey = Deno.env.get('KTO_TOUR_SERVICE_KEY')
    if (!serviceKey) {
      throw new Error('KTO_TOUR_SERVICE_KEY not found')
    }
    
    const cleanServiceKey = serviceKey.trim()

    const baseUrl = 'https://apis.data.go.kr/B551011/PetTourService'
    
    // 정확한 필수 파라미터만 사용
    const params = new URLSearchParams({
      serviceKey: cleanServiceKey,
      pageNo: pageNo,
      numOfRows: numOfRows,
      MobileApp: 'AppName',
      MobileOS: 'ETC',
      _type: 'json'
    })

    if (keyword) {
      params.append('keyword', keyword)
    }
    if (areaCode) {
      params.append('areaCode', areaCode)
    }
    if (sigunguCode) {
      params.append('sigunguCode', sigunguCode)
    }

    const apiUrl = `${baseUrl}/${operation}?${params.toString()}`
    console.log('=== Pet Tour API DEBUG ===')
    console.log('Service Key exists:', !!cleanServiceKey)
    console.log('Full API URL (masked):', apiUrl.replace(cleanServiceKey, 'MASKED_KEY'))
    
    const response = await fetch(apiUrl, {
      method: 'GET', 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Connection': 'keep-alive'
      }
    })
    console.log('Pet Tour API Response status:', response.status)
    
    const responseText = await response.text()
    console.log('Pet Tour API Response text (first 500 chars):', responseText.substring(0, 500))
    
    if (!response.ok) {
      console.error('Pet Tour API Error:', response.status, responseText)
      throw new Error(`HTTP error! status: ${response.status} - ${responseText.substring(0, 200)}`)
    }

    let data
    try {
      data = JSON.parse(responseText)
      console.log('Pet Tour API: Successfully parsed JSON')
    } catch (parseError) {
      console.error('Pet Tour API JSON parse error:', parseError)
      console.log('Raw response (probably XML):', responseText)
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`)
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
    console.error('Pet Tour API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})