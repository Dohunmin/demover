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
    const url = new URL(req.url);
    let op = url.searchParams.get('op');
    let query = url.searchParams.get('query');
    let x = url.searchParams.get('x');
    let y = url.searchParams.get('y');
    let radius = url.searchParams.get('radius');
    let page = url.searchParams.get('page') || '1';
    let size = url.searchParams.get('size') || '15';

    // If parameters not in URL, try to get them from POST body
    if (!op || !query) {
      try {
        const body = await req.json();
        op = op || body.op;
        query = query || body.query;
        x = x || body.x;
        y = y || body.y;
        radius = radius || body.radius;
        page = page || body.page || '1';
        size = size || body.size || '15';
      } catch (e) {
        // Body parsing failed, continue with URL params only
      }
    }

    const kakaoApiKey = Deno.env.get('KAKAO_REST_API_KEY');
    if (!kakaoApiKey) {
      throw new Error('KAKAO_REST_API_KEY not found in environment variables');
    }

    if (!op || !query) {
      throw new Error('Missing required parameters: op, query');
    }

    console.log('Kakao API Proxy Request:', { op, query, x, y, radius, page, size });

    // Build Kakao API URL - fix the endpoint path
    const kakaoBaseUrl = 'https://dapi.kakao.com';
    let endpoint = op;
    if (op === 'keyword') {
      endpoint = '/v2/local/search/keyword.json';
    } else if (op === 'category') {
      endpoint = '/v2/local/search/category.json';
    } else if (!op.startsWith('/')) {
      endpoint = op;
    }
    
    const kakaoUrl = new URL(kakaoBaseUrl + endpoint);
    
    // Add parameters
    kakaoUrl.searchParams.set('query', query);
    if (x) kakaoUrl.searchParams.set('x', x);
    if (y) kakaoUrl.searchParams.set('y', y);
    if (radius) kakaoUrl.searchParams.set('radius', radius);
    kakaoUrl.searchParams.set('page', page);
    kakaoUrl.searchParams.set('size', size);

    console.log('Calling Kakao API:', kakaoUrl.toString());

    const response = await fetch(kakaoUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${kakaoApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kakao API Error:', response.status, errorText);
      throw new Error(`Kakao API failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Kakao API Success, documents count:', data.documents?.length || 0);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in kakao-proxy function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});