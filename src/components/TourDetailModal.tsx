import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MapPin, Phone, Clock, Globe, Camera, Star, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PlaceReviewsModal from "@/components/PlaceReviewsModal";

interface TourDetailModalProps {
  contentId: string;
  contentTypeId?: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

interface DetailData {
  common?: any;
  intro?: any;
  images?: any;
}

const TourDetailModal: React.FC<TourDetailModalProps> = ({
  contentId,
  contentTypeId,
  title,
  isOpen,
  onClose
}) => {
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  useEffect(() => {
    if (isOpen && contentId) {
      fetchDetailData();
    }
  }, [isOpen, contentId]);

  const fetchDetailData = async () => {
    setLoading(true);
    try {
      console.log('Fetching detail data for:', { contentId, contentTypeId });
      
      const { data, error } = await supabase.functions.invoke('tour-detail-api', {
        body: { contentId, contentTypeId }
      });

      if (error) {
        console.error('Error fetching detail data:', error);
        toast.error('상세 정보를 불러오는데 실패했습니다.');
        return;
      }

      console.log('Detail data response:', data);
      setDetailData(data);
      
      // 데이터가 실제로 있는지 확인
      const hasData = data?.common || data?.intro || data?.images;
      if (!hasData) {
        console.warn('No detail data available');
        toast.warning('상세 정보가 제공되지 않는 관광지입니다.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const commonInfo = detailData?.common?.response?.body?.items?.item?.[0];
  const introInfo = detailData?.intro?.response?.body?.items?.item?.[0];
  const images = detailData?.images?.response?.body?.items?.item || [];

  const formatPhoneNumber = (tel: string) => {
    if (!tel) return '';
    return tel.replace(/(\d{2,3})-?(\d{3,4})-?(\d{4})/, '$1-$2-$3');
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    if (time.length === 4) {
      return `${time.substring(0, 2)}:${time.substring(2, 4)}`;
    }
    return time;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900 pr-8">
              {title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewsModal(true)}
                className="flex items-center gap-2 text-sm"
              >
                <Star className="h-4 w-4" />
                리뷰 보기
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">상세 정보를 불러오는 중...</span>
              </div>
            ) : detailData ? (
              <div className="space-y-6">
                {/* 데이터가 없을 경우 안내 메시지 */}
                {!commonInfo && !introInfo && (!images || images.length === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">상세 정보가 제공되지 않는 관광지입니다.</p>
                    <p className="text-sm text-gray-500 mt-2">기본 정보는 목록에서 확인해주세요.</p>
                  </div>
                ) : (
                  <>
                    {/* 이미지 갤러리 */}
                    {images && images.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Camera className="w-5 h-5 mr-2" />
                          사진
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {images.slice(0, 6).map((image: any, index: number) => (
                            <div
                              key={index}
                              className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setSelectedImageIndex(index)}
                            >
                              <img
                                src={image.originimgurl || image.smallimageurl}
                                alt={`${title} 이미지 ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.svg';
                                }}
                              />
                              {image.imgname && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                                  {image.imgname}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 기본 정보 */}
                    {commonInfo && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">기본 정보</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {commonInfo.addr1 && (
                            <div className="flex items-start space-x-3">
                              <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">주소</p>
                                <p className="text-sm text-gray-600">
                                  {commonInfo.addr1} {commonInfo.addr2}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {commonInfo.tel && (
                            <div className="flex items-start space-x-3">
                              <Phone className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">전화번호</p>
                                <p className="text-sm text-gray-600">
                                  {formatPhoneNumber(commonInfo.tel)}
                                </p>
                              </div>
                            </div>
                          )}

                          {commonInfo.homepage && (
                            <div className="flex items-start space-x-3">
                              <Globe className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">홈페이지</p>
                                <div 
                                  className="text-sm text-blue-600 hover:underline cursor-pointer"
                                  dangerouslySetInnerHTML={{ __html: commonInfo.homepage }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {commonInfo.overview && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">소개</p>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {commonInfo.overview}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                {/* 상세 정보 */}
                {introInfo && (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="text-lg font-semibold text-gray-900">상세 정보</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {/* 운영시간 관련 정보 */}
                      {(introInfo.usetime || introInfo.opentime || introInfo.restdate) && (
                        <div className="space-y-2">
                          {introInfo.usetime && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">이용시간: </span>
                              <span className="text-sm text-gray-600">{introInfo.usetime}</span>
                            </div>
                          )}
                          {introInfo.opentime && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">개방시간: </span>
                              <span className="text-sm text-gray-600">{introInfo.opentime}</span>
                            </div>
                          )}
                          {introInfo.restdate && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">휴무일: </span>
                              <span className="text-sm text-gray-600">{introInfo.restdate}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 요금 정보 */}
                      {(introInfo.usefee || introInfo.parking) && (
                        <div className="space-y-2">
                          {introInfo.usefee && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">이용요금: </span>
                              <span className="text-sm text-gray-600">{introInfo.usefee}</span>
                            </div>
                          )}
                          {introInfo.parking && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">주차시설: </span>
                              <span className="text-sm text-gray-600">{introInfo.parking}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 기타 정보 */}
                      {Object.entries(introInfo).map(([key, value]) => {
                        if (!value || typeof value !== 'string' || 
                            ['usetime', 'opentime', 'restdate', 'usefee', 'parking'].includes(key)) {
                          return null;
                        }
                        
                        const koreanLabels: Record<string, string> = {
                          accomcount: '수용인원',
                          chkbabycarriage: '유모차 대여',
                          chkcreditcard: '신용카드',
                          chkpet: '반려동물 동반',
                          expguide: '체험 안내',
                          heritage1: '세계유산',
                          heritage2: '세계자연유산',
                          heritage3: '세계기록유산',
                          infocenter: '문의 및 안내',
                          scale: '규모'
                        };

                        const label = koreanLabels[key] || key;
                        
                        return (
                          <div key={key}>
                            <span className="text-sm font-medium text-gray-700">{label}: </span>
                            <span className="text-sm text-gray-600">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">데이터를 불러올 수 없습니다.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>

      {/* 리뷰 모달 */}
      <PlaceReviewsModal
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        placeName={title}
        placeAddress={commonInfo?.addr1}
      />
    </Dialog>
  );
};

export default TourDetailModal;