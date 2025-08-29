import { Home, Heart, MapPin, Bell, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMbtiClick?: () => void;
}

const BottomNavigation = ({ activeTab, onTabChange, onMbtiClick }: BottomNavigationProps) => {
  const leftTabs = [
    { id: "mbti", label: "멍BTI", icon: Heart },
    { id: "travel", label: "여행지추천", icon: MapPin },
  ];
  
  const centerTab = { id: "home", label: "홈", icon: Home };
  
  const rightTabs = [
    { id: "news", label: "소식", icon: Bell },
    { id: "record", label: "기록", icon: BookOpen },
  ];

  const renderButton = (tab: any) => (
    <button
      key={tab.id}
      onClick={() => {
        if (tab.id === "mbti" && onMbtiClick) {
          onMbtiClick();
        } else {
          onTabChange(tab.id);
        }
      }}
      className={cn(
        "flex flex-col items-center py-2 rounded-lg transition-all duration-200",
        "text-xs font-medium w-16 h-12 justify-center", // Fixed width and height
        activeTab === tab.id
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <tab.icon className="h-4 w-4 mb-1" strokeWidth={1.5} />
      <span className="text-[9px] leading-none">{tab.label}</span>
    </button>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border px-4 py-2 z-50">
      <div className="flex justify-between items-center">
        {/* Left Button Group */}
        <div className="flex justify-between w-36">
          {leftTabs.map(renderButton)}
        </div>
        
        {/* Center Button Group */}
        <div className="flex justify-center w-20">
          {renderButton(centerTab)}
        </div>
        
        {/* Right Button Group */}
        <div className="flex justify-between w-36">
          {rightTabs.map(renderButton)}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;