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
    const apiKey = Deno.env.get("KAKAO_JS_KEY");
    
    if (!apiKey) {
      console.error("KAKAO_JS_KEY not found in environment variables");
      return new Response("API Key not configured", { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Parse query parameters from the request URL
    const url = new URL(req.url);
    const autoload = url.searchParams.get('autoload') || 'false';
    const libraries = url.searchParams.get('libraries') || 'services,clusterer';

    // Construct the Kakao Maps SDK URL
    const kakaoSdkUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=${autoload}&libraries=${libraries}`;
    
    console.log(`Fetching Kakao SDK from: ${kakaoSdkUrl}`);

    // Fetch the actual SDK from Kakao
    const response = await fetch(kakaoSdkUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch Kakao SDK: ${response.status} ${response.statusText}`);
      return new Response(`Failed to load Kakao SDK: ${response.statusText}`, { 
        status: response.status,
        headers: corsHeaders 
      });
    }

    const scriptContent = await response.text();
    
    // Return the script content with proper headers
    return new Response(scriptContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error("Error in kakao-map-proxy:", error);
    return new Response(`Proxy error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});