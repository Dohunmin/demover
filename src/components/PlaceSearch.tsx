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
    const initializeKakao = async () => {
      if (window.kakao && window.kakao.maps) {
        setIsKakaoLoaded(true);
      } else {
        // Load Kakao SDK with API key
        const apiKey = 'c7cf9e7ecec81ad0090f5b7881b89e97';
        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
        script.onload = () => {
          window.kakao.maps.load(() => {
            setIsKakaoLoaded(true);
          });
        };
        script.onerror = (error) => {
          console.error('Failed to load Kakao Maps SDK:', error);
        };
        document.head.appendChild(script);
      }
    };

    initializeKakao();
  }, []);

  const searchPlaces = async (query: string) => {
    if (!isKakaoLoaded || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    const places = new window.kakao.maps.services.Places();
    
    places.keywordSearch(query, (result: Place[], status: string) => {
      setIsLoading(false);
      
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(result.slice(0, 5)); // 최대 5개 결과만 표시
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // 디바운스: 500ms 후에 검색 실행
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 500);
  };

  const handlePlaceSelect = (place: Place) => {
    const selectedPlace = {
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      latitude: parseFloat(place.y),
      longitude: parseFloat(place.x)
    };

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