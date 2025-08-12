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
    const pageNo = searchParams.get('pageNo') || '1'
    const numOfRows = searchParams.get('numOfRows') || '10'
    const areaCode = searchParams.get('areaCode')
    const sigunguCode = searchParams.get('sigunguCode')
    const mapX = searchParams.get('mapX')
    const mapY = searchParams.get('mapY')
    const radius = searchParams.get('radius')
    const operation = searchParams.get('operation') || 'areaBasedList1'

    const serviceKey = Deno.env.get('KTO_TOUR_SERVICE_KEY')
    if (!serviceKey) {
      throw new Error('KTO_TOUR_SERVICE_KEY not found')
    }

    const baseUrl = 'http://apis.data.go.kr/B551011/PetTourService'
    
    const apiParams = new URLSearchParams({
      serviceKey,
      _type: 'json',
      MobileOS: 'ETC',
      MobileApp: 'LovableApp',
      pageNo,
      numOfRows,
    })

    // 파라미터에 따라 오퍼레이션 선택
    if (operation === 'locationBasedList1' && mapX && mapY) {
      apiParams.append('mapX', mapX)
      apiParams.append('mapY', mapY)
      if (radius) {
        apiParams.append('radius', radius)
      }
    } else {
      // areaBasedList1이 기본
      if (areaCode) {
        apiParams.append('areaCode', areaCode)
      }
      if (sigunguCode) {
        apiParams.append('sigunguCode', sigunguCode)
      }
    }

    const apiUrl = `${baseUrl}/${operation}?${apiParams.toString()}`
    console.log('Calling Pet Tour API:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LovableApp/1.0)',
        'Accept': 'application/json'
      }
    })
    
    console.log('Pet Tour API Response status:', response.status)
    const data = await response.json()
    console.log('Pet Tour API Response data:', JSON.stringify(data).substring(0, 500))

    if (!response.ok) {
      console.error('Pet Tour API Error Response:', data)
      throw new Error(`Pet Tour API Error: ${response.status} - ${JSON.stringify(data)}`)
    }

    // JSON 패스스루 - 가공 없이 그대로 반환
    return new Response(
      JSON.stringify(data),
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