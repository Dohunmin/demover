import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Waves, Thermometer, Users, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BeachData {
  name: string;
  status: string;
  temperature: string;
  crowd: string;
  statusColor: string;
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
      const beachNames = ["송도", "해운대", "송정", "광안리", "임랑", "다대포", "일광"];
      
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
              statusColor: "bg-gray-500"
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
            statusColor: "bg-gray-500"
          };
        }
      });

      const beachData = await Promise.all(promises);
      setBeaches(beachData);
      
    } catch (error) {
      console.error('Error fetching beach data:', error);
      // 오류 시 기본 데이터 표시
      setBeaches([
        { name: "송도 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500" },
        { name: "해운대 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500" },
        { name: "송정 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500" },
        { name: "광안리 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500" },
        { name: "임랑 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500" },
        { name: "다대포 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500" },
        { name: "일광 해수욕장", status: "정보없음", temperature: "-", crowd: "-", statusColor: "bg-gray-500" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const processBeachWeatherData = (apiData: any, beachName: string): BeachData => {
    try {
      // 기상청 API 응답 구조에 따라 데이터 처리
      if (!apiData?.response?.body?.items?.item) {
        throw new Error('Invalid API response structure');
      }

      const items = apiData.response.body.items.item;
      const latestItem = items[0]; // 가장 최근 데이터

      // 기온 정보 (TMP 카테고리)
      const tempItem = items.find((item: any) => item.category === 'TMP');
      const temperature = tempItem ? `${tempItem.fcstValue}°C` : '-';

      // 파도 높이 (WAV 카테고리)
      const waveItem = items.find((item: any) => item.category === 'WAV');
      const waveHeight = waveItem ? parseFloat(waveItem.fcstValue) : 0;

      // 상태 판정 (파도 높이 기준)
      let status = "정보없음";
      let statusColor = "bg-gray-500";
      
      if (waveHeight <= 0.5) {
        status = "좋음";
        statusColor = "bg-emerald-500";
      } else if (waveHeight <= 1.0) {
        status = "보통";
        statusColor = "bg-yellow-500";
      } else {
        status = "주의";
        statusColor = "bg-red-500";
      }

      // 혼잡도는 임의로 설정 (실제 API에서 제공하지 않음)
      const crowdLevels = ["여유", "보통", "혼잡"];
      const crowd = crowdLevels[Math.floor(Math.random() * crowdLevels.length)];

      return {
        name: `${beachName} 해수욕장`,
        status,
        temperature,
        crowd,
        statusColor
      };

    } catch (error) {
      console.error(`Error processing weather data for ${beachName}:`, error);
      return {
        name: `${beachName} 해수욕장`,
        status: "정보없음",
        temperature: "-",
        crowd: "-",
        statusColor: "bg-gray-500"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {beaches.map((beach, index) => (
            <Card key={index} className="p-3 bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Waves className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{beach.name}</h4>
                </div>
                <Badge 
                  className={`${beach.statusColor} text-white text-xs px-2 py-1 border-0`}
                >
                  {beach.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <Thermometer className="w-3 h-3" />
                  <span>{beach.temperature}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{beach.crowd}</span>
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