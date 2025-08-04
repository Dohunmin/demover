import { Home, Heart, MapPin, Bell, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const tabs = [
    { id: "home", label: "홈", icon: Home },
    { id: "mbti", label: "멍BTI", icon: Heart },
    { id: "travel", label: "여행지 추천", icon: MapPin },
    { id: "news", label: "소식", icon: Bell },
    { id: "record", label: "여행 기록", icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 max-w-md mx-auto">
      <div className="flex justify-around items-center">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex flex-col items-center py-2 px-2 rounded-lg transition-all duration-200",
              "text-xs font-medium min-w-0 flex-1",
              activeTab === id
                ? "text-primary bg-pet-light-blue"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;