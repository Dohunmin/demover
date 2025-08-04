import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import beachImage from "@/assets/beach-dogs.jpg";

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
    <div className="px-4 mb-20">
      <h3 className="text-lg font-semibold text-foreground mb-4">해수욕장별 실시간 상황</h3>
      <div className="space-y-3">
        {beaches.map((beach, index) => (
          <Card key={index} className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={beachImage} 
                  alt="Beach" 
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-semibold text-foreground">{beach.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={`${beach.statusColor} text-white text-xs`}
                    >
                      {beach.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{beach.temperature}</span>
                    <span className="text-sm text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">{beach.crowd}</span>
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