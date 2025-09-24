import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Search, X } from "lucide-react";

interface Place {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  place_url: string;
  category_name: string;
}

interface PlaceSearchProps {
  onPlaceSelect: (place: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialValue?: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const PlaceSearch: React.FC<PlaceSearchProps> = ({ onPlaceSelect, initialValue = "" }) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const initializeKakao = () => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        console.log('✅ Kakao Maps API already loaded');
        setIsKakaoLoaded(true);
        return;
      }

      console.log('🔄 Loading Kakao Maps API...');
      
      // Kakao Maps JavaScript API 키 (웹 플랫폼용 공개 키)
      const apiKey = 'c7cf9e7ecec81ad0090f5b7881b89e97';
      
      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services`;
      script.async = true;
      script.onload = () => {
        console.log('📍 Kakao Maps script loaded');
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            console.log('✅ Kakao Maps services loaded');
            setIsKakaoLoaded(true);
          });
        }
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load Kakao Maps SDK:', error);
        // 대안 키로 재시도
        const fallbackScript = document.createElement('script');
        fallbackScript.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=c7cf9e7ecec81ad0090f5b7881b89e97&libraries=services`;
        fallbackScript.async = true;
        fallbackScript.onload = () => {
          console.log('📍 Fallback Kakao Maps script loaded');
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              console.log('✅ Fallback Kakao Maps services loaded');
              setIsKakaoLoaded(true);
            });
          }
        };
        fallbackScript.onerror = () => {
          console.error('❌ Fallback Kakao Maps SDK also failed');
        };
        document.head.appendChild(fallbackScript);
      };
      
      document.head.appendChild(script);
    };

    initializeKakao();
  }, []);

  const searchPlaces = (query: string) => {
    console.log('🔍 Searching for:', query);
    console.log('Kakao loaded?', isKakaoLoaded);
    console.log('Kakao services available?', !!window.kakao?.maps?.services);
    
    if (!isKakaoLoaded || !window.kakao?.maps?.services || !query.trim()) {
      console.log('❌ Search cancelled - missing requirements');
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const places = new window.kakao.maps.services.Places();
      console.log('📍 Places service created');
      
      places.keywordSearch(query, (result: Place[], status: string) => {
        console.log('📍 Search result status:', status);
        console.log('📍 Search results:', result);
        
        setIsLoading(false);
        
        if (status === window.kakao.maps.services.Status.OK && result) {
          // 부산 지역 결과 우선순위로 정렬
          const sortedResults = result.sort((a, b) => {
            const aBusan = a.address_name.includes('부산') || a.road_address_name?.includes('부산');
            const bBusan = b.address_name.includes('부산') || b.road_address_name?.includes('부산');
            if (aBusan && !bBusan) return -1;
            if (!aBusan && bBusan) return 1;
            return 0;
          });
          
          console.log('✅ Found', sortedResults.length, 'results');
          setSearchResults(sortedResults.slice(0, 8)); // 더 많은 결과 표시
          setShowResults(true);
        } else {
          console.log('❌ No results found or error occurred');
          setSearchResults([]);
          setShowResults(false);
        }
      });
    } catch (error) {
      console.error('❌ Search error:', error);
      setIsLoading(false);
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // 디바운스: 300ms로 단축하여 더 빠른 반응
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 2) { // 2글자 이상일 때만 검색
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(value);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handlePlaceSelect = (place: Place) => {
    console.log('📍 Place selected:', place);
    
    const selectedPlace = {
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      latitude: parseFloat(place.y),
      longitude: parseFloat(place.x)
    };

    console.log('📍 Selected place data:', selectedPlace);
    
    setSearchQuery(place.place_name);
    setShowResults(false);
    onPlaceSelect(selectedPlace);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="장소를 검색해보세요 (예: 경복궁, 한강공원)"
          className="pl-10 pr-10"
          autoFocus={false}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowResults(true);
            }
          }}
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto border shadow-lg bg-white">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">검색 중...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-2">
              {searchResults.map((place, index) => (
                <div
                  key={index}
                  onClick={() => handlePlaceSelect(place)}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
                >
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 line-clamp-1">
                      {place.place_name}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                      {place.road_address_name || place.address_name}
                    </div>
                    {place.category_name && (
                      <div className="text-xs text-gray-400 mt-1">
                        {place.category_name.split(' > ').pop()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() && !isLoading ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
};

export default PlaceSearch;