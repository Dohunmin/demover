import { Coffee, UtensilsCrossed, Bed, TreePine, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

const CategoryGrid = () => {
  const categories = [
    { 
      id: "cafe", 
      label: "카페", 
      icon: Coffee, 
      bgColor: "bg-blue-50", 
      iconColor: "text-blue-600",
      hoverColor: "hover:bg-blue-100"
    },
    { 
      id: "restaurant", 
      label: "음식점", 
      icon: UtensilsCrossed, 
      bgColor: "bg-emerald-50", 
      iconColor: "text-emerald-600",
      hoverColor: "hover:bg-emerald-100"
    },
    { 
      id: "accommodation", 
      label: "숙소", 
      icon: Bed, 
      bgColor: "bg-purple-50", 
      iconColor: "text-purple-600",
      hoverColor: "hover:bg-purple-100"
    },
    { 
      id: "park", 
      label: "공원", 
      icon: TreePine, 
      bgColor: "bg-green-50", 
      iconColor: "text-green-600",
      hoverColor: "hover:bg-green-100"
    },
    { 
      id: "attraction", 
      label: "명소", 
      icon: MapPin, 
      bgColor: "bg-orange-50", 
      iconColor: "text-orange-600",
      hoverColor: "hover:bg-orange-100"
    },
  ];

  return (
    <div className="px-5 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">카테고리별 둘러보기</h3>
      <div className="grid grid-cols-5 gap-3">
        {categories.map(({ id, label, icon: Icon, bgColor, iconColor, hoverColor }) => (
          <Card
            key={id}
            className={`p-4 text-center cursor-pointer transition-all duration-200 border-0 shadow-sm ${bgColor} ${hoverColor} hover:shadow-md hover:scale-105`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-3">
                <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={1.5} />
              </div>
              <span className="text-xs font-medium text-gray-700 leading-tight">{label}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;