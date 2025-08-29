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
      statusColor: "bg-green-500"
    },
    { 
      name: "광안리 해수욕장", 
      status: "좋음", 
      temperature: "23°C", 
      crowd: "여유",
      statusColor: "bg-green-500"
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
    <div className="mb-20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">실시간 해수욕장 현황</h3>
        <button className="text-sm text-muted-foreground hover:text-foreground">
          전체
        </button>
      </div>
      
      <div className="space-y-3">
        {beaches.map((beach, index) => (
          <Card key={index} className="p-5 border-border bg-card hover:bg-muted/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                  <Waves className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">{beach.name}</h4>
                  <div className="flex items-center space-x-4">
                    <Badge 
                      className={`${beach.statusColor} text-white text-xs px-2 py-1 border-0`}
                    >
                      {beach.status}
                    </Badge>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Thermometer className="w-4 h-4" />
                      <span className="text-sm">{beach.temperature}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{beach.crowd}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="p-4 border-border bg-card mt-6">
        <div className="text-center text-sm text-muted-foreground">
          동반 가능한 장소들
        </div>
      </Card>
    </div>
  );
};

export default BeachStatus;