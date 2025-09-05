import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const kakaoJsKey = Deno.env.get('KAKAO_JS_KEY') || Deno.env.get('KAKAO_JS_API_KEY');
    
    if (!kakaoJsKey) {
      throw new Error('KAKAO_JS_KEY 환경 변수가 설정되지 않았습니다');
    }

    // 카카오 지도 SDK 스크립트 가져오기
    const kakaoSdkUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoJsKey}&autoload=false&libraries=services,clusterer`;
    
    console.log('카카오 지도 SDK 프록시 요청:', kakaoSdkUrl);

    const response = await fetch(kakaoSdkUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Supabase-Edge-Functions)',
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      console.error('카카오 SDK 요청 실패:', response.status, response.statusText);
      throw new Error(`카카오 SDK 요청 실패: ${response.status}`);
    }

    const scriptContent = await response.text();
    console.log('카카오 SDK 스크립트 로드 성공, 크기:', scriptContent.length, 'bytes');

    // JavaScript 응답으로 반환
    return new Response(scriptContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
      },
    });

  } catch (error) {
    console.error('카카오 지도 프록시 오류:', error);
    
    return new Response(
      JSON.stringify({ 
        error: '카카오 지도 SDK 로드 실패',
        details: error.message,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});