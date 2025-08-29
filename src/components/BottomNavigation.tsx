import { Home, Heart, MapPin, Bell, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMbtiClick?: () => void;
}

const BottomNavigation = ({ activeTab, onTabChange, onMbtiClick }: BottomNavigationProps) => {
  const tabs = [
    { id: "mbti", label: "멍BTI", icon: Heart },
    { id: "travel", label: "여행지추천", icon: MapPin },
    { id: "home", label: "홈", icon: Home },
    { id: "news", label: "소식", icon: Bell },
    { id: "record", label: "기록", icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border px-4 py-2 z-50">
      <div className="flex justify-around items-center">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              if (id === "mbti" && onMbtiClick) {
                onMbtiClick();
              } else {
                onTabChange(id);
              }
            }}
            className={cn(
              "flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200",
              "text-xs font-medium min-w-0 flex-1",
              activeTab === id
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5 mb-1" strokeWidth={1.5} />
            <span className="text-[10px] leading-none">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;