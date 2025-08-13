-- HTTP 확장 설치 및 Korean Tour API 호출 함수 생성
CREATE EXTENSION IF NOT EXISTS http;

-- Korean Tour API 호출 함수
CREATE OR REPLACE FUNCTION public.tour_area_list(
  page_no int DEFAULT 1, 
  rows int DEFAULT 10,
  keyword text DEFAULT NULL,
  area_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  k text := 'lZf40IMmpeOv3MWEUV+xoRC+zuAYiUYcDyMVbm5AVPsFZ+ZAbhezzET3VZlh8y8dTZGsDIot0RVq0RzYgvoECA==';
  url text;
  resp http_response_result;
  result jsonb;
BEGIN
  -- API URL 구성
  url := 'https://apis.data.go.kr/B551011/KorService1/';
  
  IF keyword IS NOT NULL THEN
    url := url || 'searchKeyword1';
  ELSE
    url := url || 'areaBasedList1';
  END IF;
  
  url := url || '?serviceKey=' || k
         || '&_type=json&MobileOS=ETC&MobileApp=LovableApp'
         || '&pageNo=' || page_no
         || '&numOfRows=' || rows;
         
  IF keyword IS NOT NULL THEN
    url := url || '&keyword=' || keyword;
  END IF;
  
  IF area_code IS NOT NULL THEN
    url := url || '&areaCode=' || area_code;
  END IF;

  -- HTTP 요청 실행
  SELECT * INTO resp FROM http((
    'GET',
    url,
    ARRAY[
      http_header('Accept','application/json'),
      http_header('User-Agent','LovableRelay/1.0'),
      http_header('Connection','keep-alive')
    ],
    NULL,
    NULL
  ));

  -- 응답 상태 확인
  IF resp.status >= 400 THEN
    RAISE EXCEPTION 'TourAPI error status: % content: %', resp.status, resp.content;
  END IF;

  -- JSON 파싱 및 반환
  BEGIN
    result := resp.content::jsonb;
    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'JSON parse error: %', resp.content;
  END;
END;
$$;

-- Pet Tour API 호출 함수
CREATE OR REPLACE FUNCTION public.tour_pet_list(
  page_no int DEFAULT 1, 
  rows int DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  k text := 'lZf40IMmpeOv3MWEUV+xoRC+zuAYiUYcDyMVbm5AVPsFZ+ZAbhezzET3VZlh8y8dTZGsDIot0RVq0RzYgvoECA==';
  url text;
  resp http_response_result;
  result jsonb;
BEGIN
  -- API URL 구성
  url := 'https://apis.data.go.kr/B551011/PetTourService/areaBasedList1'
         || '?serviceKey=' || k
         || '&_type=json&MobileOS=ETC&MobileApp=LovableApp'
         || '&pageNo=' || page_no
         || '&numOfRows=' || rows;

  -- HTTP 요청 실행
  SELECT * INTO resp FROM http((
    'GET',
    url,
    ARRAY[
      http_header('Accept','application/json'),
      http_header('User-Agent','LovableRelay/1.0'),
      http_header('Connection','keep-alive')
    ],
    NULL,
    NULL
  ));

  -- 응답 상태 확인
  IF resp.status >= 400 THEN
    RAISE EXCEPTION 'PetTourAPI error status: % content: %', resp.status, resp.content;
  END IF;

  -- JSON 파싱 및 반환
  BEGIN
    result := resp.content::jsonb;
    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'JSON parse error: %', resp.content;
  END;
END;
$$;