import { Coffee, UtensilsCrossed, Bed, TreePine, MapPin, Stethoscope, Dumbbell, Building2, Utensils, Church, ShoppingBag, Store, Mountain, Anchor, Waves } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const CategoryGrid = () => {
  const navigate = useNavigate();
  
  const categories = [
    { 
      id: "park", 
      label: "공원", 
      icon: TreePine, 
      bgColor: "bg-green-50", 
      iconColor: "text-green-600",
      hoverColor: "hover:bg-green-100"
    },
    { 
      id: "leisure", 
      label: "레저", 
      icon: Dumbbell, 
      bgColor: "bg-blue-50", 
      iconColor: "text-blue-600",
      hoverColor: "hover:bg-blue-100"
    },
    { 
      id: "culture", 
      label: "문화시설", 
      icon: Building2, 
      bgColor: "bg-purple-50", 
      iconColor: "text-purple-600",
      hoverColor: "hover:bg-purple-100"
    },
    { 
      id: "brunch", 
      label: "브런치", 
      icon: Utensils, 
      bgColor: "bg-orange-50", 
      iconColor: "text-orange-600",
      hoverColor: "hover:bg-orange-100"
    },
    { 
      id: "temple", 
      label: "사찰", 
      icon: Church, 
      bgColor: "bg-amber-50", 
      iconColor: "text-amber-600",
      hoverColor: "hover:bg-amber-100"
    },
    { 
      id: "shopping", 
      label: "쇼핑", 
      icon: ShoppingBag, 
      bgColor: "bg-pink-50", 
      iconColor: "text-pink-600",
      hoverColor: "hover:bg-pink-100"
    },
    { 
      id: "accommodation", 
      label: "숙소", 
      icon: Bed, 
      bgColor: "bg-indigo-50", 
      iconColor: "text-indigo-600",
      hoverColor: "hover:bg-indigo-100"
    },
    { 
      id: "restaurant", 
      label: "식당", 
      icon: UtensilsCrossed, 
      bgColor: "bg-emerald-50", 
      iconColor: "text-emerald-600",
      hoverColor: "hover:bg-emerald-100"
    },
    { 
      id: "market", 
      label: "재래시장", 
      icon: Store, 
      bgColor: "bg-yellow-50", 
      iconColor: "text-yellow-600",
      hoverColor: "hover:bg-yellow-100"
    },
    { 
      id: "cafe", 
      label: "카페", 
      icon: Coffee, 
      bgColor: "bg-cyan-50", 
      iconColor: "text-cyan-600",
      hoverColor: "hover:bg-cyan-100"
    },
    { 
      id: "theme-street", 
      label: "테마거리", 
      icon: MapPin, 
      bgColor: "bg-teal-50", 
      iconColor: "text-teal-600",
      hoverColor: "hover:bg-teal-100"
    },
    { 
      id: "trekking", 
      label: "트레킹", 
      icon: Mountain, 
      bgColor: "bg-stone-50", 
      iconColor: "text-stone-600",
      hoverColor: "hover:bg-stone-100"
    },
    { 
      id: "port", 
      label: "항구", 
      icon: Anchor, 
      bgColor: "bg-slate-50", 
      iconColor: "text-slate-600",
      hoverColor: "hover:bg-slate-100"
    },
    { 
      id: "beach", 
      label: "해수욕장", 
      icon: Waves, 
      bgColor: "bg-sky-50", 
      iconColor: "text-sky-600",
      hoverColor: "hover:bg-sky-100"
    },
    { 
      id: "hospital", 
      label: "동물병원", 
      icon: Stethoscope, 
      bgColor: "bg-red-50", 
      iconColor: "text-red-600",
      hoverColor: "hover:bg-red-100"
    },
  ];

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'hospital') {
      navigate('/animal-hospitals');
    }
    // 다른 카테고리들은 나중에 구현
  };

  return (
    <div className="px-5 mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">카테고리별 둘러보기</h3>
      <div className="grid grid-cols-5 gap-2">
        {categories.map(({ id, label, icon: Icon, bgColor, iconColor, hoverColor }) => (
          <Card
            key={id}
            className={`p-2 text-center cursor-pointer transition-all duration-200 border-0 shadow-sm ${bgColor} ${hoverColor} hover:shadow-md hover:scale-105`}
            onClick={() => handleCategoryClick(id)}
          >
            <div className="flex flex-col items-center">
              <div className="mb-1">
                <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.5} />
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