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
    console.log('Test API Key 함수 호출됨');

    // Supabase 환경에서 카카오 API 키들 가져오기
    const kakaoRestApiKey = Deno.env.get('KAKAO_REST_API_KEY');
    const kakaoJsKey = Deno.env.get('KAKAO_JS_KEY') || Deno.env.get('KAKAO_JS_API_KEY');
    const koreaApiKey = Deno.env.get('KOREA_TOUR_API_KEY');

    console.log('환경 변수 확인:', {
      kakaoRestApiKey: kakaoRestApiKey ? '설정됨' : '없음',
      kakaoJsKey: kakaoJsKey ? '설정됨' : '없음',
      koreaApiKey: koreaApiKey ? '설정됨' : '없음'
    });

    if (!kakaoJsKey) {
      throw new Error('KAKAO_JS_KEY 환경 변수가 설정되지 않았습니다');
    }

    // API 키들을 응답으로 반환 (JS 키만 클라이언트에 전달)
    return new Response(JSON.stringify({
      success: true,
      kakaoJsKey: kakaoJsKey,
      // 보안상 REST API 키는 반환하지 않음
      hasKakaoRestKey: !!kakaoRestApiKey,
      hasKoreaApiKey: !!koreaApiKey,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in test-api-key function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});