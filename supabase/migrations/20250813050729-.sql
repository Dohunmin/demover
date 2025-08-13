-- HTTP 확장 설치 (다른 방법)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Tour API 호출 함수 (단순화된 버전)
CREATE OR REPLACE FUNCTION public.tour_area_list(
  page_no int DEFAULT 1, 
  rows int DEFAULT 10,
  keyword text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  k text := 'lZf40IMmpeOv3MWEUV+xoRC+zuAYiUYcDyMVbm5AVPsFZ+ZAbhezzET3VZlh8y8dTZGsDIot0RVq0RzYgvoECA==';
  url text;
  resp jsonb;
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
         || '&pageNo=' || page_no::text
         || '&numOfRows=' || rows::text;
         
  IF keyword IS NOT NULL THEN
    url := url || '&keyword=' || keyword;
  END IF;

  -- HTTP GET 요청 (extensions.http_get 사용)
  SELECT content::jsonb INTO resp 
  FROM extensions.http_get(url);

  RETURN resp;
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
  resp jsonb;
BEGIN
  -- API URL 구성
  url := 'https://apis.data.go.kr/B551011/PetTourService/areaBasedList1'
         || '?serviceKey=' || k
         || '&_type=json&MobileOS=ETC&MobileApp=LovableApp'
         || '&pageNo=' || page_no::text
         || '&numOfRows=' || rows::text;

  -- HTTP GET 요청
  SELECT content::jsonb INTO resp 
  FROM extensions.http_get(url);

  RETURN resp;
END;
$$;