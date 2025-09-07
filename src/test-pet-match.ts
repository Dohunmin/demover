// 반려동물 API 매칭률 테스트
import { supabase } from "@/integrations/supabase/client";

export async function testPetApiMatchRate() {
  console.log("반려동물 API 매칭률 테스트 시작...");
  
  try {
    const { data, error } = await supabase.functions.invoke('pet-tour-api', {
      body: {
        areaCode: '6', // 부산
        testMatchRate: true // 매칭률 테스트 플래그
      }
    });

    if (error) {
      console.error('매칭률 테스트 실패:', error);
      return null;
    }

    console.log("매칭률 테스트 결과:", data);
    return data;
  } catch (error) {
    console.error('매칭률 테스트 오류:', error);
    return null;
  }
}

// 브라우저 콘솔에서 직접 호출할 수 있도록 window에 등록
if (typeof window !== 'undefined') {
  (window as any).testPetApiMatchRate = testPetApiMatchRate;
}