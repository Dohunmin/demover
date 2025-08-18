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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 px-2 py-2 z-50 max-w-full md:max-w-4xl md:left-1/2 md:transform md:-translate-x-1/2 md:rounded-t-2xl md:border-x md:mx-auto">
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
              "flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200",
              "text-xs font-medium min-w-0 flex-1",
              activeTab === id
                ? "text-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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