-- DB RPC 함수들을 올바른 secret 이름으로 수정
CREATE OR REPLACE FUNCTION public.tour_area_list(page_no int DEFAULT 1, rows int DEFAULT 10, keyword text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  k text;
  url text;
  content text;
  status int;
BEGIN
  -- Supabase secrets에서 API 키 가져오기 (정확한 secret 이름 사용)
  SELECT decrypted_secret INTO k
  FROM vault.decrypted_secrets
  WHERE name = 'KTO_TOUR_SERVICE_KEY';
  
  IF k IS NULL THEN
    RAISE EXCEPTION 'KTO_TOUR_SERVICE_KEY not found in vault';
  END IF;

  -- URL 구성
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

  -- HTTP 확장이 있으면 http 사용, 없으면 pg_net 사용
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
    DECLARE 
      resp jsonb;
    BEGIN
      SELECT content::jsonb INTO resp FROM http((
        'GET',
        url,
        ARRAY[
          http_header('Accept', 'application/json'),
          http_header('User-Agent', 'LovableRelay/1.0'),
          http_header('Connection', 'keep-alive')
        ],
        NULL,
        NULL
      ));
      
      status := (resp->>'status_code')::integer;
      content := resp->>'content';
    END;
  ELSIF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    DECLARE 
      resp record;
    BEGIN
      SELECT status_code, content INTO resp
      FROM net.http_get(
        url := url,
        headers := jsonb_build_object(
          'Accept', 'application/json',
          'User-Agent', 'LovableRelay/1.0',
          'Connection', 'keep-alive'
        )
      );
      
      status := resp.status_code;
      content := resp.content;
    END;
  ELSE
    RAISE EXCEPTION 'Neither http nor pg_net extension is available';
  END IF;

  -- 상태 코드 확인
  IF status >= 400 THEN
    RAISE EXCEPTION 'TourAPI error status: % body: %', status, SUBSTRING(content, 1, 500);
  END IF;

  -- JSON 파싱 시도, 실패하면 에러 정보 반환
  BEGIN
    RETURN content::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'JSON parsing failed',
      'raw_content', SUBSTRING(content, 1, 1000),
      'status', status
    );
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.tour_pet_list(page_no int DEFAULT 1, rows int DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  k text;
  url text;
  content text;
  status int;
BEGIN
  -- Supabase secrets에서 API 키 가져오기 (정확한 secret 이름 사용)
  SELECT decrypted_secret INTO k
  FROM vault.decrypted_secrets
  WHERE name = 'KTO_TOUR_SERVICE_KEY';
  
  IF k IS NULL THEN
    RAISE EXCEPTION 'KTO_TOUR_SERVICE_KEY not found in vault';
  END IF;

  -- URL 구성
  url := 'https://apis.data.go.kr/B551011/PetTourService/areaBasedList1'
         || '?serviceKey=' || k
         || '&_type=json&MobileOS=ETC&MobileApp=LovableApp'
         || '&pageNo=' || page_no::text
         || '&numOfRows=' || rows::text;

  -- HTTP 확장이 있으면 http 사용, 없으면 pg_net 사용
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
    DECLARE 
      resp jsonb;
    BEGIN
      SELECT content::jsonb INTO resp FROM http((
        'GET',
        url,
        ARRAY[
          http_header('Accept', 'application/json'),
          http_header('User-Agent', 'LovableRelay/1.0'),
          http_header('Connection', 'keep-alive')
        ],
        NULL,
        NULL
      ));
      
      status := (resp->>'status_code')::integer;
      content := resp->>'content';
    END;
  ELSIF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    DECLARE 
      resp record;
    BEGIN
      SELECT status_code, content INTO resp
      FROM net.http_get(
        url := url,
        headers := jsonb_build_object(
          'Accept', 'application/json',
          'User-Agent', 'LovableRelay/1.0',
          'Connection', 'keep-alive'
        )
      );
      
      status := resp.status_code;
      content := resp.content;
    END;
  ELSE
    RAISE EXCEPTION 'Neither http nor pg_net extension is available';
  END IF;

  -- 상태 코드 확인
  IF status >= 400 THEN
    RAISE EXCEPTION 'PetTourAPI error status: % body: %', status, SUBSTRING(content, 1, 500);
  END IF;

  -- JSON 파싱 시도, 실패하면 에러 정보 반환
  BEGIN
    RETURN content::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'JSON parsing failed',
      'raw_content', SUBSTRING(content, 1, 1000),
      'status', status
    );
  END;
END;
$$;