import { Coffee, UtensilsCrossed, Bed, TreePine, MapPin, Stethoscope, Dumbbell, Building2, Utensils, Church, ShoppingBag, Store, Mountain, Anchor, Waves, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const CategoryGrid = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAll, setShowAll] = useState(false);
  
  const isOnTravelPage = location.pathname === '/travel';
  
  const categories = [
    { 
      id: "cafe", 
      label: "카페", 
      icon: Coffee, 
      bgColor: "bg-cyan-50", 
      iconColor: "text-cyan-600",
      hoverColor: "hover:bg-cyan-100"
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
      id: "brunch", 
      label: "브런치", 
      icon: Utensils, 
      bgColor: "bg-orange-50", 
      iconColor: "text-orange-600",
      hoverColor: "hover:bg-orange-100"
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
      id: "beach", 
      label: "해수욕장", 
      icon: Waves, 
      bgColor: "bg-sky-50", 
      iconColor: "text-sky-600",
      hoverColor: "hover:bg-sky-100"
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
      id: "trekking", 
      label: "트레킹", 
      icon: Mountain, 
      bgColor: "bg-stone-50", 
      iconColor: "text-stone-600",
      hoverColor: "hover:bg-stone-100"
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
      id: "shopping", 
      label: "쇼핑", 
      icon: ShoppingBag, 
      bgColor: "bg-pink-50", 
      iconColor: "text-pink-600",
      hoverColor: "hover:bg-pink-100"
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
      id: "market", 
      label: "재래시장", 
      icon: Store, 
      bgColor: "bg-yellow-50", 
      iconColor: "text-yellow-600",
      hoverColor: "hover:bg-yellow-100"
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
      id: "port", 
      label: "항구", 
      icon: Anchor, 
      bgColor: "bg-slate-50", 
      iconColor: "text-slate-600",
      hoverColor: "hover:bg-slate-100"
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
    } else {
      // 여행지 페이지로 이동하면서 카테고리 정보 전달
      navigate(`/travel?category=${categoryId}`);
    }
  };

  // 여행지 페이지에서는 처음에 5개만 보여주고, 홈화면에서는 모든 카테고리 보여주기
  const displayedCategories = isOnTravelPage && !showAll ? categories.slice(0, 5) : categories;

  return (
    <div className="px-5 mb-2">
      <h3 className="text-sm font-medium text-gray-700 mb-2">카테고리별 둘러보기</h3>
      <div className="grid grid-cols-5 gap-2">
        {displayedCategories.map(({ id, label, icon: Icon, bgColor, iconColor, hoverColor }) => (
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
      
      {/* 여행지 페이지에서만 더보기 버튼 표시 */}
      {isOnTravelPage && (
        <div className="flex justify-center mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-gray-600 hover:text-gray-800 text-xs"
          >
            {showAll ? (
              <>
                접기 <ChevronUp className="ml-1 h-3 w-3" />
              </>
            ) : (
              <>
                더보기 <ChevronDown className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CategoryGrid;