import { 
  Coffee, 
  UtensilsCrossed, 
  Bed, 
  TreePine, 
  MapPin, 
  Stethoscope, 
  Dumbbell, 
  Building2, 
  Utensils, 
  Church, 
  ShoppingBag, 
  Store, 
  Mountain, 
  Anchor, 
  Waves 
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface CategoryIconData {
  id: string;
  label: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  hoverColor: string;
}

export const categoryIconsData: CategoryIconData[] = [
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

// Tailwind 색상을 HEX 색상으로 변환하는 매핑
const colorMap: { [key: string]: string } = {
  'text-cyan-600': '#0891b2',
  'text-emerald-600': '#059669',
  'text-orange-600': '#ea580c',
  'text-indigo-600': '#4338ca',
  'text-sky-600': '#0284c7',
  'text-green-600': '#16a34a',
  'text-stone-600': '#57534e',
  'text-teal-600': '#0d9488',
  'text-pink-600': '#db2777',
  'text-amber-600': '#d97706',
  'text-yellow-600': '#ca8a04',
  'text-blue-600': '#2563eb',
  'text-purple-600': '#9333ea',
  'text-slate-600': '#475569',
  'text-red-600': '#dc2626',
};

const bgColorMap: { [key: string]: string } = {
  'bg-cyan-50': '#ecfeff',
  'bg-emerald-50': '#ecfdf5',
  'bg-orange-50': '#fff7ed',
  'bg-indigo-50': '#eef2ff',
  'bg-sky-50': '#f0f9ff',
  'bg-green-50': '#f0fdf4',
  'bg-stone-50': '#fafaf9',
  'bg-teal-50': '#f0fdfa',
  'bg-pink-50': '#fdf2f8',
  'bg-amber-50': '#fffbeb',
  'bg-yellow-50': '#fefce8',
  'bg-blue-50': '#eff6ff',
  'bg-purple-50': '#faf5ff',
  'bg-slate-50': '#f8fafc',
  'bg-red-50': '#fef2f2',
};

// 카테고리 ID로 아이콘 정보를 가져오는 함수
export const getCategoryIconData = (categoryId: string) => {
  return categoryIconsData.find(item => item.id === categoryId) || categoryIconsData[0];
};

// 카테고리 라벨(한글)로 아이콘 정보를 가져오는 함수 
export const getCategoryIconDataByLabel = (label: string) => {
  const labelMap: { [key: string]: string } = {
    "카페": "cafe",
    "식당": "restaurant", 
    "브런치": "brunch",
    "숙소": "accommodation",
    "해수욕장": "beach",
    "공원": "park",
    "트레킹": "trekking",
    "테마거리": "theme-street",
    "쇼핑": "shopping",
    "사찰": "temple",
    "재래시장": "market",
    "레저": "leisure",
    "문화시설": "culture",
    "항구": "port",
    "동물병원": "hospital"
  };
  
  const categoryId = labelMap[label];
  return getCategoryIconData(categoryId || "theme-street");
};

// Lucide 아이콘을 SVG 문자열로 변환하는 함수
export const createIconSVG = (categoryId: string) => {
  const iconData = getCategoryIconData(categoryId);
  const iconColor = colorMap[iconData.iconColor] || '#6b7280';
  const bgColor = bgColorMap[iconData.bgColor] || '#f8fafc';
  
  // Lucide 아이콘의 기본 SVG path를 사용 (간단한 형태로)
  const iconPaths: { [key: string]: string } = {
    cafe: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z',
    restaurant: 'm18 2 4 4-4 4m-8-8-4 4 4 4',
    brunch: 'm18 2 4 4-4 4m-8-8-4 4 4 4',
    accommodation: 'M2 4v16M2 8h18M7 4v4M12 4v4M17 4v4',
    beach: 'M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    park: 'm10 11 11 .9a.9.9 0 0 1-.9.9h-2.5a.9.9 0 0 1-.9-.9v-2.5a.9.9 0 0 1 .9-.9h2.5c.5 0 .9.4.9.9Z',
    trekking: 'm8 3 4 8 5-5v7H6V6l3-3z',
    'theme-street': 'M9 11a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1 -2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z',
    shopping: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
    temple: 'M5 21h14M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6M9 7V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3M21 15V8l-8-5-8 5v7',
    market: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z',
    leisure: 'M6.5 6.5h11M6.5 6.5V5a1.5 1.5 0 0 1 3 0v1.5M17.5 6.5V5a1.5 1.5 0 0 1-3 0v1.5M8 8v8l2.5 5.5a1 1 0 0 0 3 0L16 16V8',
    culture: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12h4h4M10 6h4',
    port: 'M9.31 9.31 5 13.5a7.5 7.5 0 1 1 13 0l-4.31-4.19M12 2v7',
    hospital: 'M4.8 2.3A.3.3 0 0 0 5 2H8v5a3 3 0 0 0 6 0V2h3a.3.3 0 0 0 .2-.3 1 1 0 0 0-.5-.5A2 2 0 0 0 15 1H9a2 2 0 0 0-1.7.3 1 1 0 0 0-.5.7z'
  };
  
  const iconPath = iconPaths[categoryId] || iconPaths['theme-street'];
  
  return `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow${categoryId}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.2)"/>
        </filter>
      </defs>
      <circle cx="16" cy="16" r="14" fill="${bgColor}" stroke="${iconColor}" stroke-width="2" filter="url(#shadow${categoryId})"/>
      <g transform="translate(8, 8)">
        <path d="${iconPath}" fill="none" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>
  `;
};

// 지도 마커용 데이터 URL 생성
export const createMarkerDataURL = (categoryId: string) => {
  const svgString = createIconSVG(categoryId);
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};