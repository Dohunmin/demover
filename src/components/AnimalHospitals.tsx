import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Calendar, Building2, Map, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdBanner from '@/components/AdBanner';
import Footer from '@/components/Footer';
import AnimalHospitalMap from '@/components/AnimalHospitalMap';
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
  const [selectedGugun, setSelectedGugun] = useState('all');
  const [currentView, setCurrentView] = useState<'list' | 'map'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

    if (selectedGugun && selectedGugun !== 'all') {
      filtered = filtered.filter(hospital => 
        hospital.gugun && hospital.gugun.includes(selectedGugun)
      );
    }

    setFilteredHospitals(filtered);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  const handleReset = () => {
    setSearchName('');
    setSelectedGugun('all');
    setFilteredHospitals(hospitals);
    setCurrentPage(1); // 리셋 시 첫 페이지로 이동
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredHospitals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHospitals = filteredHospitals.slice(startIndex, endIndex);

  // 페이지네이션 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);
  const handlePrevPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const handleNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

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
      <div className="max-w-md mx-auto bg-background min-h-screen">
        <div className="px-5 py-4">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-foreground">부산 동물병원</h1>
              <Button
                onClick={() => setCurrentView('list')}
                variant="outline"
                size="sm"
              >
                목록으로 보기
              </Button>
            </div>
            
            {/* 검색 필터 */}
            <div className="space-y-3 mb-4">
              <Input
                placeholder="병원명으로 검색..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full"
              />
              <div className="flex gap-2">
                <Select value={selectedGugun} onValueChange={setSelectedGugun}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="구/군 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
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
          </div>

          {/* 지도 */}
          <div className="h-[500px] w-full">
            <AnimalHospitalMap hospitals={filteredHospitals} />
          </div>
        </div>

        {/* Ad Banner */}
        <AdBanner />
        
        {/* Footer */}
        <Footer />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <div className="px-5 py-4">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground">부산 동물병원</h1>
            <Button
              onClick={() => setCurrentView('map')}
              variant="outline"
              size="sm"
            >
              <Map className="h-4 w-4 mr-1" />
              지도
            </Button>
          </div>
          
          {/* 검색 필터 */}
          <div className="space-y-3 mb-4">
            <Input
              placeholder="병원명으로 검색..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full"
            />
            <div className="flex gap-2">
              <Select value={selectedGugun} onValueChange={setSelectedGugun}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="구/군 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
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
          
          <p className="text-sm text-muted-foreground mb-4">
            총 {filteredHospitals.length}개의 동물병원이 있습니다.
            {totalPages > 1 && (
              <span className="ml-2">
                ({currentPage}/{totalPages} 페이지)
              </span>
            )}
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
          <div className="space-y-4">
            {currentHospitals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">검색 조건에 맞는 동물병원이 없습니다.</p>
              </div>
            ) : (
              <>
                {currentHospitals.map((hospital, index) => (
                  <Card key={startIndex + index} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="truncate">{hospital.animal_hospital || '병원명 정보 없음'}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground text-sm leading-relaxed">
                          {hospital.road_address || '주소 정보 없음'}
                        </span>
                      </div>
                      
                      {hospital.tel && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">{hospital.tel}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        {hospital.gugun && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{hospital.gugun}</span>
                          </div>
                        )}
                        
                        {hospital.approval && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {hospital.approval.slice(0, 10)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFirstPage}
                      disabled={currentPage === 1}
                      className="p-2"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="p-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0 text-xs"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLastPage}
                      disabled={currentPage === totalPages}
                      className="p-2"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Ad Banner */}
      <AdBanner />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AnimalHospitals;