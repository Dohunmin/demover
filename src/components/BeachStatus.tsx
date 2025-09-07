import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Waves, Thermometer, Users, Loader2, Sun, Sunset, Cloud } from "lucide-react";
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
      
      // 하늘 상태 - 실제 API 값 그대로 표시하거나 간단한 매핑
      let skyCondition = '-';
      if (firstItem?.sky) {
        // 실제 API에서 오는 값 그대로 표시 (일단 확인을 위해)
        skyCondition = `코드${firstItem.sky}`;
        
        // 실제 기상청 SKY 코드에 따른 매핑 (확인 후 적용)
        // const skyCode = parseInt(firstItem.sky);
        // if (skyCode === 1) skyCondition = '맑음';
        // else if (skyCode === 3) skyCondition = '구름많음';
        // else if (skyCode === 4) skyCondition = '흐림';
        // else skyCondition = `코드${firstItem.sky}`;
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {beaches.map((beach, index) => (
            <Card key={index} className="p-4 bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Waves className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-base">{beach.name}</h4>
                </div>
                <Badge 
                  className={`${beach.statusColor} text-white text-xs px-3 py-1 border-0`}
                >
                  {beach.status}
                </Badge>
              </div>
              
              {/* 상단 정보 - 기온, 하늘상태, 수온 */}
              <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                <div className="flex items-center space-x-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  <div>
                    <div className="text-gray-500">기온</div>
                    <div className="font-medium text-gray-800">{beach.temperature}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                  <Cloud className="w-3.5 h-3.5 text-blue-500" />
                  <div>
                    <div className="text-gray-500">하늘</div>
                    <div className="font-medium text-gray-800">{beach.sky}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                  <Waves className="w-3.5 h-3.5 text-cyan-500" />
                  <div>
                    <div className="text-gray-500">수온</div>
                    <div className="font-medium text-gray-800">{beach.waterTemp}</div>
                  </div>
                </div>
              </div>
              
              {/* 하단 정보 - 파도높이, 일출, 일몰 */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex items-center space-x-1.5">
                  <Waves className="w-3 h-3 text-blue-400" />
                  <div>
                    <div className="text-gray-500">파도</div>
                    <div className="font-medium text-gray-700">{beach.waveHeight}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Sun className="w-3 h-3 text-yellow-500" />
                  <div>
                    <div className="text-gray-500">일출</div>
                    <div className="font-medium text-gray-700">{beach.sunrise}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Sunset className="w-3 h-3 text-orange-500" />
                  <div>
                    <div className="text-gray-500">일몰</div>
                    <div className="font-medium text-gray-700">{beach.sunset}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BeachStatus;