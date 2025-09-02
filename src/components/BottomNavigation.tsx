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
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-1">
      <nav className="bottom-nav h-16 mx-auto">
        <div className="flex items-center justify-around h-full px-2">
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
                "flex flex-col items-center justify-center h-full px-3 transition-colors duration-200 ease-in-out nav-item",
                "min-w-0 flex-1",
                activeTab === id && "active"
              )}
            >
              <Icon className="h-6 w-6 mb-1" strokeWidth={1.5} />
              <span className={cn(
                "text-[12px] leading-tight text-center",
                activeTab === id ? "font-bold" : "font-medium"
              )}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default BottomNavigation;