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
    
    // API 키 디버깅
    console.log('Raw service key:', serviceKey)
    console.log('Service key first 20 chars:', serviceKey.substring(0, 20))
    console.log('Service key includes special chars:', /[+/=]/.test(serviceKey))

    const baseUrl = 'https://apis.data.go.kr/B551011/KorService1'
    const operation = keyword ? 'searchKeyword1' : 'areaBasedList1'
    
    // URL 인코딩하지 않고 직접 사용
    const params = [
      `serviceKey=${encodeURIComponent(serviceKey)}`,
      '_type=json',
      'MobileOS=ETC',
      'MobileApp=LovableApp',
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
    console.log('=== API CALL DEBUG INFO ===')
    console.log('Service Key exists:', !!serviceKey)
    console.log('Service Key length:', serviceKey?.length)
    console.log('Service Key start:', serviceKey?.substring(0, 20) + '...')
    console.log('Base URL:', baseUrl)
    console.log('Operation:', operation)
    console.log('Full API URL:', apiUrl)
    console.log('API Params:', params.join('&'))
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LovableApp/1.0)',
          'Accept': 'application/json'
        }
      })
      
      console.log('API Response status:', response.status)
      console.log('API Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())))
      
      const responseText = await response.text()
      console.log('API Response text (first 1000 chars):', responseText.substring(0, 1000))
      
      let data
      try {
        data = JSON.parse(responseText)
        console.log('Successfully parsed JSON')
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.log('Raw response:', responseText)
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`)
      }

      if (!response.ok) {
        console.error('API Error Response:', data)
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`)
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
    } catch (fetchError) {
      console.error('Fetch error details:', fetchError)
      console.error('Error name:', fetchError.name)
      console.error('Error message:', fetchError.message)
      console.error('Error stack:', fetchError.stack)
      throw fetchError
    }
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