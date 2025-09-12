import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { categoryIconsData } from "@/utils/categoryIcons";

const CategoryGrid = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAll, setShowAll] = useState(false);
  
  const isOnTravelPage = location.pathname === '/travel';
  
  const categories = categoryIconsData;

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
    <div className="px-5 mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">카테고리별 둘러보기</h3>
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