import React from 'react';
import { Calendar, MapPin, Star, Camera, Globe, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import StarRating from './StarRating';

interface TravelRecord {
  id: string;
  user_id: string;
  location_name: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  visit_date: string;
  memo?: string;
  images: string[];
  rating?: number;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

interface TravelRecordDetailModalProps {
  record: TravelRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const TravelRecordDetailModal: React.FC<TravelRecordDetailModalProps> = ({
  record,
  isOpen,
  onClose
}) => {
  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="w-5 h-5 text-primary" />
            {record.location_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-3">
            {record.location_address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{record.location_address}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>방문일: {new Date(record.visit_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}</span>
            </div>

            {record.rating && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <StarRating rating={record.rating} readonly size="sm" />
                <span className="text-sm text-muted-foreground">({record.rating}/5)</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {record.is_public ? (
                <Badge variant="secondary" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  공개
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  비공개
                </Badge>
              )}
            </div>
          </div>

          {/* 사진들 */}
          {record.images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">사진 ({record.images.length}장)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {record.images.map((image, index) => (
                  <div key={index} className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image}
                      alt={`${record.location_name} 사진 ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => {
                        // 이미지 크게 보기 (선택사항)
                        window.open(image, '_blank');
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          {record.memo && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                💭 여행 메모
              </h4>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {record.memo}
                </p>
              </div>
            </div>
          )}

          {/* 기록 정보 */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">작성일:</span>
                <br />
                {new Date(record.created_at).toLocaleDateString('ko-KR')} {new Date(record.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {record.updated_at !== record.created_at && (
                <div>
                  <span className="font-medium">수정일:</span>
                  <br />
                  {new Date(record.updated_at).toLocaleDateString('ko-KR')} {new Date(record.updated_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TravelRecordDetailModal;