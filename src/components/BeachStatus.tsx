import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Waves, Thermometer, Users } from "lucide-react";

const BeachStatus = () => {
  const beaches = [
    { 
      name: "해운대 해수욕장", 
      status: "좋음", 
      temperature: "24°C", 
      crowd: "보통",
      statusColor: "bg-emerald-500"
    },
    { 
      name: "광안리 해수욕장", 
      status: "좋음", 
      temperature: "23°C", 
      crowd: "여유",
      statusColor: "bg-emerald-500"
    },
    { 
      name: "송정 해수욕장", 
      status: "보통", 
      temperature: "22°C", 
      crowd: "혼잡",
      statusColor: "bg-yellow-500"
    },
  ];

  return (
    <div className="px-5 mb-24">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">실시간 해수욕장 현황</h3>
      <div className="space-y-3">
        {beaches.map((beach, index) => (
          <Card key={index} className="p-4 bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Waves className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{beach.name}</h4>
                  <div className="flex items-center space-x-3 mt-2">
                    <Badge 
                      className={`${beach.statusColor} text-white text-xs px-2 py-1 border-0`}
                    >
                      {beach.status}
                    </Badge>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Thermometer className="w-3 h-3" />
                      <span className="text-xs">{beach.temperature}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Users className="w-3 h-3" />
                      <span className="text-xs">{beach.crowd}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BeachStatus;