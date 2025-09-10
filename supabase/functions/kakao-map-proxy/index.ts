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
    const autoload = url.searchParams.get('autoload') || 'false';
    const libraries = url.searchParams.get('libraries') || 'services,clusterer';

    const kakaoApiKey = Deno.env.get('KAKAO_JS_API_KEY');
    if (!kakaoApiKey) {
      throw new Error('KAKAO_JS_API_KEY not found in environment variables');
    }

    console.log('Kakao Map Proxy Request:', { autoload, libraries });

    // Build Kakao SDK script URL
    const kakaoScriptUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&autoload=${autoload}&libraries=${libraries}`;
    
    console.log('Fetching Kakao SDK:', kakaoScriptUrl);

    // Fetch the actual Kakao SDK script
    const response = await fetch(kakaoScriptUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Supabase Edge Function)',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kakao SDK fetch error:', response.status, errorText);
      throw new Error(`Kakao SDK fetch failed with status: ${response.status}`);
    }

    const scriptContent = await response.text();
    console.log('Kakao SDK fetched successfully, content length:', scriptContent.length);

    return new Response(scriptContent, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error in kakao-map-proxy function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});