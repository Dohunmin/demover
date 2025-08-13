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
    const op = url.searchParams.get('op');
    const query = url.searchParams.get('query');
    const x = url.searchParams.get('x');
    const y = url.searchParams.get('y');
    const radius = url.searchParams.get('radius');
    const page = url.searchParams.get('page') || '1';
    const size = url.searchParams.get('size') || '15';

    const kakaoApiKey = Deno.env.get('KAKAO_REST_API_KEY');
    if (!kakaoApiKey) {
      throw new Error('KAKAO_REST_API_KEY not found in environment variables');
    }

    if (!op || !query) {
      throw new Error('Missing required parameters: op, query');
    }

    console.log('Kakao API Proxy Request:', { op, query, x, y, radius, page, size });

    // Build Kakao API URL
    const kakaoBaseUrl = 'https://dapi.kakao.com';
    const kakaoUrl = new URL(kakaoBaseUrl + op);
    
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