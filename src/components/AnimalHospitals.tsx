import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Calendar, Building2, Map } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface AnimalHospital {
  animal_hospital: string;
  road_address: string;
  tel: string;
  approval: string;
  gugun: string;
  lat: string;
  lon: string;
}

const AnimalHospitals = () => {
  const [hospitals, setHospitals] = useState<AnimalHospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<AnimalHospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [selectedGugun, setSelectedGugun] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'map'>('list');

  // 부산 구/군 목록
  const busanDistricts = [
    '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구',
    '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', 
    '기장군'
  ];

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('busan-animal-hospital-api', {
        body: {
          pageNo: 1,
          numOfRows: 300,
          gugun: '',
          hospitalName: ''
        }
      });

      if (error) {
        console.error('Error fetching hospitals:', error);
        return;
      }

      console.log('Hospital data received:', data);
      
      if (data && data.hospitals) {
        setHospitals(data.hospitals);
        setFilteredHospitals(data.hospitals);
      }
    } catch (error) {
      console.error('Error in fetchHospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = hospitals;

    if (searchName.trim()) {
      filtered = filtered.filter(hospital => 
        hospital.animal_hospital && hospital.animal_hospital.includes(searchName.trim())
      );
    }

    if (selectedGugun) {
      filtered = filtered.filter(hospital => 
        hospital.gugun && hospital.gugun.includes(selectedGugun)
      );
    }

    setFilteredHospitals(filtered);
  };

  const handleReset = () => {
    setSearchName('');
    setSelectedGugun('');
    setFilteredHospitals(hospitals);
  };

  // 지도용 마커 데이터 변환
  const mapMarkers = filteredHospitals
    .filter(hospital => hospital.lat && hospital.lon)
    .map(hospital => ({
      id: hospital.animal_hospital,
      lat: parseFloat(hospital.lat),
      lng: parseFloat(hospital.lon),
      title: hospital.animal_hospital,
      content: `
        <div style="padding: 10px; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">${hospital.animal_hospital}</h4>
          <p style="margin: 4px 0; font-size: 12px;"><strong>주소:</strong> ${hospital.road_address || '정보 없음'}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>전화:</strong> ${hospital.tel || '정보 없음'}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>구/군:</strong> ${hospital.gugun || '정보 없음'}</p>
        </div>
      `
    }));

  if (currentView === 'map') {
    return (
      <div className="p-4">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">부산 동물병원</h1>
            <Button
              onClick={() => setCurrentView('list')}
              variant="outline"
              size="sm"
            >
              목록으로 보기
            </Button>
          </div>
          
          {/* 검색 필터 */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="병원명으로 검색..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedGugun} onValueChange={setSelectedGugun}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="구/군 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {busanDistricts.map(district => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              초기화
            </Button>
          </div>
        </div>

        {/* 지도 */}
        <div className="h-[600px] w-full">
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">지도 기능 준비 중입니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredHospitals.filter(h => h.lat && h.lon).length}개 병원의 위치 정보 확인 가능
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">부산 동물병원</h1>
          <Button
            onClick={() => setCurrentView('map')}
            variant="outline"
            size="sm"
          >
            <Map className="h-4 w-4 mr-2" />
            지도로 보기
          </Button>
        </div>
        
        {/* 검색 필터 */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="병원명으로 검색..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedGugun} onValueChange={setSelectedGugun}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="구/군 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {busanDistricts.map(district => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} size="sm">
            <Search className="h-4 w-4" />
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            초기화
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          총 {filteredHospitals.length}개의 동물병원이 있습니다.
        </p>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">동물병원 정보를 불러오는 중...</p>
        </div>
      )}

      {/* 병원 리스트 */}
      {!loading && (
        <div className="grid gap-4">
          {filteredHospitals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">검색 조건에 맞는 동물병원이 없습니다.</p>
            </div>
          ) : (
            filteredHospitals.map((hospital, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {hospital.animal_hospital || '병원명 정보 없음'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {hospital.road_address || '주소 정보 없음'}
                    </span>
                  </div>
                  
                  {hospital.tel && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{hospital.tel}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    {hospital.gugun && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{hospital.gugun}</span>
                      </div>
                    )}
                    
                    {hospital.approval && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">인허가: {hospital.approval}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AnimalHospitals;