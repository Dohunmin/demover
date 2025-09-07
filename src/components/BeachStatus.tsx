import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Waves, Thermometer, Users, Loader2, Sun, Sunset, Cloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BeachData {
  name: string;
  status: string;
  temperature: string;
  crowd: string;
  statusColor: string;
  sky: string;
  waveHeight: string;
  sunrise: string;
  sunset: string;
  waterTemp: string;
}

const BeachStatus = () => {
  const [beaches, setBeaches] = useState<BeachData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBeach, setSelectedBeach] = useState<BeachData | null>(null);

  useEffect(() => {
    fetchBeachData();
  }, []);

  const fetchBeachData = async () => {
    try {
      setLoading(true);
      const beachNames = ["송도", "해운대", "송정", "광안리", "다대포", "일광"];
      
      // 모든 해수욕장 데이터를 동시에 요청
      const promises = beachNames.map(async (beachName) => {
        try {
          const { data, error } = await supabase.functions.invoke('beach-weather-api', {
            body: { beach_name: beachName }
          });

          if (error) {
            console.error(`Error fetching ${beachName} data:`, error);
          return {
            name: `${beachName} 해수욕장`,
            status: "정보없음",
            temperature: "-",
            crowd: "-",
            statusColor: "bg-gray-500",
            sky: "-",
            waveHeight: "-",
            sunrise: "-",
            sunset: "-",
            waterTemp: "-"
          };
          }

          return processBeachWeatherData(data, beachName);
        } catch (error) {
          console.error(`Error processing ${beachName}:`, error);
          return {
            name: `${beachName} 해수욕장`,
            status: "정보없음",
            temperature: "-",
            crowd: "-",
            statusColor: "bg-gray-500",
            sky: "-",
            waveHeight: "-",
            sunrise: "-",
            sunset: "-",
            waterTemp: "-"
          };
        }
      });

      const beachData = await Promise.all(promises);
      setBeaches(beachData);
      
    } catch (error) {
      console.error('Error fetching beach data:', error);
      // 오류 시 기본 데이터 표시
      setBeaches([
        { name: "송도 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500", sky: "-", waveHeight: "-", sunrise: "-", sunset: "-", waterTemp: "-" },
        { name: "해운대 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500", sky: "-", waveHeight: "-", sunrise: "-", sunset: "-", waterTemp: "-" },
        { name: "송정 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500", sky: "-", waveHeight: "-", sunrise: "-", sunset: "-", waterTemp: "-" },
        { name: "광안리 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500", sky: "-", waveHeight: "-", sunrise: "-", sunset: "-", waterTemp: "-" },
        { name: "다대포 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500", sky: "-", waveHeight: "-", sunrise: "-", sunset: "-", waterTemp: "-" },
        { name: "일광 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500", sky: "-", waveHeight: "-", sunrise: "-", sunset: "-", waterTemp: "-" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const processBeachWeatherData = (apiData: any, beachName: string): BeachData => {
    try {
      console.log(`Processing data for ${beachName}:`, apiData);
      
      // API 응답 구조 확인
      if (!apiData?.response?.body?.items?.item || !Array.isArray(apiData.response.body.items.item)) {
        throw new Error('Invalid API response structure');
      }
      
      const items = apiData.response.body.items.item;
      const firstItem = items[0]; // 첫 번째 아이템에 모든 통합 정보가 있음
      
      // 기온 정보 (이미 통합된 tmp 사용)
      const temperature = firstItem?.tmp ? `${firstItem.tmp}°C` : '-';
      
      // 하늘 상태 (1: 맑음, 3: 구름많음, 4: 흐림)
      let skyCondition = '-';
      if (firstItem?.sky) {
        const skyCode = parseInt(firstItem.sky);
        if (skyCode === 1) skyCondition = '맑음';
        else if (skyCode === 3) skyCondition = '구름많음';
        else if (skyCode === 4) skyCondition = '흐림';
        else skyCondition = `코드${firstItem.sky}`;
      }
      
      // 파도 높이 (이미 통합된 wav 사용)
      const waveHeight = firstItem?.wav || '0';
      const waveHeightNum = parseFloat(waveHeight);
      
      // 상태 판정 (파도 높이 기준)
      let status = "정보없음";
      let statusColor = "bg-gray-500";
      
      if (waveHeightNum <= 0.5) {
        status = "좋음";
        statusColor = "bg-emerald-500";
      } else if (waveHeightNum <= 1.0) {
        status = "보통";
        statusColor = "bg-yellow-500";
      } else {
        status = "주의";
        statusColor = "bg-red-500";
      }
      
      // 일출/일몰 시간 (이미 통합된 sunrise, sunset 사용)
      const sunrise = firstItem?.sunrise || '-';
      const sunset = firstItem?.sunset || '-';
      
      // 수온 (이미 통합된 tw 사용)
      const waterTemp = firstItem?.tw ? `${firstItem.tw}°C` : '-';
      
      // 혼잡도는 임의로 설정 (실제 API에서 제공하지 않음)
      const crowdLevels = ["여유", "보통", "혼잡"];
      const crowd = crowdLevels[Math.floor(Math.random() * crowdLevels.length)];

      return {
        name: `${beachName} 해수욕장`,
        status,
        temperature,
        crowd,
        statusColor,
        sky: skyCondition,
        waveHeight: `${waveHeight}m`,
        sunrise,
        sunset,
        waterTemp
      };

    } catch (error) {
      console.error(`Error processing weather data for ${beachName}:`, error);
      return {
        name: `${beachName} 해수욕장`,
        status: "정보없음",
        temperature: "-",
        crowd: "-",
        statusColor: "bg-gray-500",
        sky: "-",
        waveHeight: "-",
        sunrise: "-",
        sunset: "-",
        waterTemp: "-"
      };
    }
  };

  return (
    <div className="px-5 mb-24">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">실시간 해수욕장 현황</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">해수욕장 정보를 불러오는 중...</span>
        </div>
      ) : selectedBeach ? (
        // 선택된 해수욕장 상세 정보
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg sm:text-xl font-semibold text-gray-900">{selectedBeach.name}</h4>
            <button
              onClick={() => setSelectedBeach(null)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
          
          <Card className="p-4 sm:p-6 bg-white border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Waves className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 text-base sm:text-lg">{selectedBeach.name}</h5>
                  <p className="text-xs sm:text-sm text-gray-500">실시간 현황</p>
                </div>
              </div>
              <Badge 
                className={`${selectedBeach.statusColor} text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 border-0`}
              >
                {selectedBeach.status}
              </Badge>
            </div>
            
            {/* 중앙 하늘상태 (큰 표시) */}
            <div className="text-center mb-6 py-4 bg-blue-50/50 rounded-lg">
              <div className="text-sm text-gray-500 mb-2">하늘상태</div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-800">{selectedBeach.sky}</div>
            </div>
            
            {/* 기온과 수온 (좌우 배치) */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500 mb-2">기온</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">{selectedBeach.temperature}</div>
              </div>
              <div className="bg-cyan-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500 mb-2">수온</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">{selectedBeach.waterTemp}</div>
              </div>
            </div>
            
            {/* 하단 정보 - 파도높이, 일출, 일몰 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">파도높이</div>
                <div className="font-semibold text-gray-700 text-sm">{selectedBeach.waveHeight}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">일출</div>
                <div className="font-semibold text-gray-700 text-sm">{selectedBeach.sunrise}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">일몰</div>
                <div className="font-semibold text-gray-700 text-sm">{selectedBeach.sunset}</div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        // 해수욕장 목록 - 이름만 표시 (3x2 그리드, 모바일 최적화)
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {beaches.map((beach, index) => (
            <Card 
              key={index} 
              className="relative p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100 shadow-sm hover:shadow-lg transition-all cursor-pointer hover:scale-105 group h-24 sm:h-28 flex flex-col justify-center"
              onClick={() => setSelectedBeach(beach)}
            >
              {/* 해수욕장 아이콘과 이름 */}
              <div className="text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <Waves className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" strokeWidth={1.5} />
                </div>
                <h4 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight px-1">
                  {beach.name.replace(' 해수욕장', '')}
                </h4>
              </div>

              {/* 호버 효과 오버레이 */}
              <div className="absolute inset-0 bg-blue-600/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BeachStatus;