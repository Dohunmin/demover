import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Camera, X } from 'lucide-react';
import PlaceSearch from './PlaceSearch';
import StarRating from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface TravelRecordEditModalProps {
  record: TravelRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const TravelRecordEditModal: React.FC<TravelRecordEditModalProps> = ({
  record,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [editData, setEditData] = useState({
    location_name: '',
    location_address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    visit_date: '',
    memo: '',
    rating: 0,
    is_public: false,
    newImages: [] as File[],
    existingImages: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);

  // 기록 데이터로 폼 초기화
  useEffect(() => {
    if (record) {
      setEditData({
        location_name: record.location_name,
        location_address: record.location_address || '',
        latitude: record.latitude,
        longitude: record.longitude,
        visit_date: record.visit_date,
        memo: record.memo || '',
        rating: record.rating || 0,
        is_public: record.is_public || false,
        newImages: [],
        existingImages: record.images || []
      });
    }
  }, [record]);

  const handlePlaceSelect = (place: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    setEditData(prev => ({
      ...prev,
      location_name: place.name,
      location_address: place.address,
      latitude: place.latitude,
      longitude: place.longitude
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setEditData(prev => ({
        ...prev,
        newImages: Array.from(files)
      }));
    }
  };

  const removeExistingImage = (imageUrl: string) => {
    setEditData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter(img => img !== imageUrl)
    }));
  };

  const uploadNewImages = async (images: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${record!.user_id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('travel-records')
        .upload(fileName, image);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast.error('이미지 업로드에 실패했습니다.');
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('travel-records')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };

  const syncToPlaceReviews = async (recordData: any, action: 'insert' | 'delete' | 'update') => {
    try {
      if (action === 'insert' || action === 'update') {
        // 기존 리뷰 삭제 후 새로 추가 (업데이트의 경우)
        if (action === 'update') {
          await supabase
            .from('place_reviews')
            .delete()
            .eq('user_id', recordData.user_id)
            .eq('place_title', recordData.location_name);
        }

        // 평점이나 메모가 있는 경우에만 리뷰 추가
        if (recordData.rating > 0 || (recordData.memo && recordData.memo.trim())) {
          await supabase
            .from('place_reviews')
            .insert({
              user_id: recordData.user_id,
              content_id: recordData.id,
              place_title: recordData.location_name,
              comment: recordData.memo || '',
              rating: recordData.rating || 5
            });
        }
      } else if (action === 'delete') {
        await supabase
          .from('place_reviews')
          .delete()
          .eq('user_id', recordData.user_id)
          .eq('place_title', recordData.location_name)
          .eq('content_id', recordData.id);
      }
    } catch (error) {
      console.error('Error syncing to place reviews:', error);
    }
  };

  const handleSave = async () => {
    if (!record || !editData.location_name || !editData.visit_date) {
      toast.error('위치명과 방문 날짜를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 새 이미지 업로드
      const newImageUrls = editData.newImages.length > 0 
        ? await uploadNewImages(editData.newImages)
        : [];

      // 최종 이미지 목록
      const finalImages = [...editData.existingImages, ...newImageUrls];

      // 여행 기록 업데이트
      const { data: updatedRecord, error } = await supabase
        .from('travel_records')
        .update({
          location_name: editData.location_name,
          location_address: editData.location_address || null,
          latitude: editData.latitude,
          longitude: editData.longitude,
          visit_date: editData.visit_date,
          memo: editData.memo || null,
          rating: editData.rating || null,
          is_public: editData.is_public,
          images: finalImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating travel record:', error);
        toast.error('여행 기록 수정에 실패했습니다.');
        return;
      }

      // place_reviews 동기화
      if (editData.is_public !== record.is_public) {
        // 공개 설정이 변경된 경우
        if (editData.is_public) {
          await syncToPlaceReviews(updatedRecord, 'insert');
        } else {
          await syncToPlaceReviews(updatedRecord, 'delete');
        }
      } else if (editData.is_public) {
        // 공개 상태이고 내용이 변경된 경우 업데이트
        await syncToPlaceReviews(updatedRecord, 'update');
      }

      toast.success('여행 기록이 수정되었습니다.');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating travel record:', error);
      toast.error('여행 기록 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>여행 기록 수정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pr-2">
          <div>
            <Label htmlFor="location">위치 검색</Label>
            <PlaceSearch
              onPlaceSelect={handlePlaceSelect}
              initialValue={editData.location_name}
            />
            <p className="text-xs text-muted-foreground mt-1">
              장소명을 검색하면 자동으로 주소가 입력됩니다
            </p>
          </div>
          
          {/* 수동 입력 옵션 */}
          <div className="space-y-3 pt-2 border-t">
            <div>
              <Label htmlFor="manual-location">위치명 (수동 입력)</Label>
              <Input
                id="manual-location"
                placeholder="직접 입력하기"
                value={editData.location_name}
                onChange={(e) => setEditData(prev => ({ ...prev, location_name: e.target.value }))}
                autoFocus={false}
              />
            </div>
            <div>
              <Label htmlFor="manual-address">주소 (수동 입력)</Label>
              <Input
                id="manual-address"
                placeholder="상세 주소 입력"
                value={editData.location_address}
                onChange={(e) => setEditData(prev => ({ ...prev, location_address: e.target.value }))}
                autoFocus={false}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="date">방문 날짜 *</Label>
            <Input
              id="date"
              type="date"
              value={editData.visit_date}
              onChange={(e) => setEditData(prev => ({ ...prev, visit_date: e.target.value }))}
              autoFocus={false}
            />
          </div>

          <div>
            <Label htmlFor="memo">메모</Label>
            <Textarea
              id="memo"
              placeholder="이 장소에서의 추억을 남겨보세요..."
              value={editData.memo}
              onChange={(e) => setEditData(prev => ({ ...prev, memo: e.target.value }))}
              rows={3}
              autoFocus={false}
            />
          </div>

          {/* 기존 이미지 */}
          {editData.existingImages.length > 0 && (
            <div>
              <Label>기존 사진</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {editData.existingImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`기존 사진 ${index + 1}`}
                      className="w-full h-16 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeExistingImage(image)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 새 이미지 추가 */}
          <div>
            <Label htmlFor="images">새 사진 추가</Label>
            <div className="flex items-center gap-2">
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('images')?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                사진 선택 ({editData.newImages.length})
              </Button>
            </div>
            {editData.newImages.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {editData.newImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`새 사진 ${index + 1}`}
                      className="w-full h-16 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 별점 평가 */}
          <div>
            <Label>이 장소는 어떠셨나요?</Label>
            <div className="mt-2">
              <StarRating
                rating={editData.rating}
                onRatingChange={(rating) => setEditData(prev => ({ ...prev, rating }))}
                showLabel={true}
              />
            </div>
          </div>

          {/* 공개 설정 */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="public-toggle" className="text-sm font-medium">
                다른 사용자와 리뷰 공유
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                공개하면 다른 사용자들이 이 장소에서 여러분의 리뷰를 볼 수 있습니다
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={editData.is_public}
              onCheckedChange={(checked) => setEditData(prev => ({ ...prev, is_public: checked }))}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="button-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TravelRecordEditModal;