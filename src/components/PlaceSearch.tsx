import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const PlaceSearch: React.FC<PlaceSearchProps> = ({ onPlaceSelect, initialValue = "" }) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const searchPlaces = async (query: string) => {
    console.log('🔍 Searching for:', query);
    
    if (!query.trim()) {
      console.log('❌ Search cancelled - empty query');
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('📍 Calling Supabase function for place search');
      
      const { data, error } = await supabase.functions.invoke('kakao-proxy', {
        body: { 
          op: 'keyword',
          query: query.trim(),
          size: 10
        }
      });

      console.log('📍 Supabase function response:', { data, error });
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      if (data && data.documents) {
        // 부산 지역 결과 우선순위로 정렬
        const sortedResults = data.documents.sort((a: Place, b: Place) => {
          const aBusan = a.address_name.includes('부산') || a.road_address_name?.includes('부산');
          const bBusan = b.address_name.includes('부산') || b.road_address_name?.includes('부산');
          if (aBusan && !bBusan) return -1;
          if (!aBusan && bBusan) return 1;
          return 0;
        });
        
        console.log('✅ Found', sortedResults.length, 'results');
        setSearchResults(sortedResults.slice(0, 8));
        setShowResults(true);
      } else {
        console.log('❌ No results found');
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
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