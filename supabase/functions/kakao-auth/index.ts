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
    console.log('카카오 OAuth 함수 호출됨');
    
    const { code, redirectUri } = await req.json();
    
    if (!code) {
      throw new Error('Authorization code가 제공되지 않았습니다');
    }

    const kakaoRestApiKey = Deno.env.get('KAKAO_REST_API_KEY');
    if (!kakaoRestApiKey) {
      throw new Error('KAKAO_REST_API_KEY 환경 변수가 설정되지 않았습니다');
    }

    console.log('1단계: Access token 발급 요청');
    
    // 1. Authorization code를 이용해 access token 발급
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: kakaoRestApiKey,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('토큰 발급 실패:', errorText);
      throw new Error(`토큰 발급 실패: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    console.log('2단계: 사용자 정보 요청');

    // 2. Access token을 이용해 사용자 정보 가져오기
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('사용자 정보 가져오기 실패:', errorText);
      throw new Error(`사용자 정보 가져오기 실패: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log('3단계: 사용자 정보 처리 완료');
    
    // 3. 필요한 사용자 정보 추출
    const userInfo = {
      kakaoId: userData.id,
      email: userData.kakao_account?.email || null,
      nickname: userData.kakao_account?.profile?.nickname || null,
      profileImage: userData.kakao_account?.profile?.profile_image_url || null,
      thumbnailImage: userData.kakao_account?.profile?.thumbnail_image_url || null,
      gender: userData.kakao_account?.gender || null,
      birthday: userData.kakao_account?.birthday || null,
      birthyear: userData.kakao_account?.birthyear || null,
      hasEmail: userData.kakao_account?.has_email || false,
      emailValid: userData.kakao_account?.is_email_valid || false,
      emailVerified: userData.kakao_account?.is_email_verified || false,
      accessToken: accessToken,
      refreshToken: tokenData.refresh_token || null,
      expiresIn: tokenData.expires_in || null,
    };

    console.log('카카오 사용자 정보:', {
      kakaoId: userInfo.kakaoId,
      email: userInfo.email,
      nickname: userInfo.nickname,
      hasEmail: userInfo.hasEmail
    });

    return new Response(JSON.stringify({
      success: true,
      userInfo: userInfo,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('카카오 OAuth 처리 중 오류:', error);
    
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