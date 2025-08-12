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
    const operation = searchParams.get('operation') || 'areaBasedList1'

    const serviceKey = Deno.env.get('KTO_TOUR_SERVICE_KEY')
    if (!serviceKey) {
      throw new Error('KTO_TOUR_SERVICE_KEY not found')
    }

    const baseUrl = 'https://apis.data.go.kr/B551011/PetTourService'
    
    // 필수 파라미터를 정확히 설정 (디코딩된 키 사용)
    const params = [
      `serviceKey=${encodeURIComponent(serviceKey)}`,
      '_type=json',  // 필수: JSON 응답 요청
      'MobileOS=ETC',  // 필수
      'MobileApp=LovableApp',  // 필수
      `pageNo=${pageNo}`,
      `numOfRows=${numOfRows}`
    ]

    if (keyword) {
      params.push(`keyword=${encodeURIComponent(keyword)}`)
    }
    if (areaCode) {
      params.push(`areaCode=${areaCode}`)
    }
    if (sigunguCode) {
      params.push(`sigunguCode=${sigunguCode}`)
    }

    const apiUrl = `${baseUrl}/${operation}?${params.join('&')}`
    console.log('Calling Pet Tour API:', apiUrl)
    
    const response = await fetch(apiUrl)
    console.log('Pet Tour API Response status:', response.status)
    
    const responseText = await response.text()
    console.log('Pet Tour API Response text (first 500 chars):', responseText.substring(0, 500))
    
    // response.ok 체크 후 파싱
    if (!response.ok) {
      console.error('Pet Tour API Error:', response.status, responseText)
      throw new Error(`HTTP error! status: ${response.status} - ${responseText.substring(0, 200)}`)
    }

    // JSON 파싱 시도
    let data
    try {
      data = JSON.parse(responseText)
      console.log('Pet Tour API: Successfully parsed JSON')
    } catch (parseError) {
      console.error('Pet Tour API JSON parse error:', parseError)
      console.log('Raw response (probably XML):', responseText)
      throw new Error(`Invalid JSON response (probably XML): ${responseText.substring(0, 200)}`)
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