import { Coffee, UtensilsCrossed, Bed, TreePine, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

const CategoryGrid = () => {
  const categories = [
    { 
      id: "cafe", 
      label: "카페", 
      icon: Coffee
    },
    { 
      id: "restaurant", 
      label: "음식점", 
      icon: UtensilsCrossed
    },
    { 
      id: "accommodation", 
      label: "숙소", 
      icon: Bed
    },
    { 
      id: "park", 
      label: "공원", 
      icon: TreePine
    },
    { 
      id: "attraction", 
      label: "명소", 
      icon: MapPin
    },
  ];

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">추천 여행지</h3>
        <button className="text-sm text-muted-foreground hover:text-foreground">
          즐겨찾기
        </button>
      </div>
      
      <div className="space-y-4">
        {categories.map(({ id, label, icon: Icon }) => (
          <Card
            key={id}
            className="p-4 border-border bg-card hover:bg-muted/50 cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                <Icon className="h-6 w-6 text-foreground" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{label}</h4>
                <p className="text-sm text-muted-foreground">강아지 성향에 맞는 장소만 보기</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">→</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="p-6 text-center border-border bg-card mt-6">
        <h4 className="font-medium text-foreground mb-2">
          우리 강아지 성향에 맞는 장소만 보기
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          멍BTI 테스트 결과를 바탕으로 필터링해보세요
        </p>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          MBTI 필터 적용
        </button>
      </Card>
    </div>
  );
};

export default CategoryGrid;