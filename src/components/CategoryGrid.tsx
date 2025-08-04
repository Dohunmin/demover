import { Coffee, UtensilsCrossed, Bed, TreePine, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

const CategoryGrid = () => {
  const categories = [
    { id: "cafe", label: "카페", icon: Coffee, color: "bg-blue-100 text-blue-600" },
    { id: "restaurant", label: "음식점", icon: UtensilsCrossed, color: "bg-green-100 text-green-600" },
    { id: "accommodation", label: "숙소", icon: Bed, color: "bg-purple-100 text-purple-600" },
    { id: "park", label: "공원", icon: TreePine, color: "bg-emerald-100 text-emerald-600" },
    { id: "attraction", label: "명소", icon: MapPin, color: "bg-orange-100 text-orange-600" },
  ];

  return (
    <div className="px-4 mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">카테고리별 둘러보기</h3>
      <div className="grid grid-cols-5 gap-3">
        {categories.map(({ id, label, icon: Icon, color }) => (
          <Card
            key={id}
            className="p-3 text-center cursor-pointer hover:shadow-lg transition-shadow border-border bg-card"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;