import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, User, Star, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StarRating from "@/components/StarRating";

interface PlaceReview {
  id: string;
  user_id: string;
  location_name: string;
  location_address?: string;
  visit_date: string;
  memo?: string;
  images: any; // Json type from Supabase
  rating?: number;
  created_at: string;
  profiles?: {
    pet_name?: string;
    pet_image_url?: string;
  } | null;
}

interface PlaceReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
  placeAddress?: string;
}

const PlaceReviewsModal: React.FC<PlaceReviewsModalProps> = ({
  isOpen,
  onClose,
  placeName,
  placeAddress
}) => {
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedReviewImages, setSelectedReviewImages] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && placeName) {
      fetchReviews();
    }
  }, [isOpen, placeName]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('travel_records')
        .select(`
          id,
          user_id,
          location_name,
          location_address,
          visit_date,
          memo,
          images,
          rating,
          created_at
        `)
        .eq('location_name', placeName)
        .eq('is_public', true)
        .not('rating', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      // 각 리뷰에 대해 프로필 정보를 별도로 가져오기
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('pet_name, pet_image_url')
            .eq('user_id', review.user_id)
            .single();

          return {
            ...review,
            profiles: profile,
            images: Array.isArray(review.images) ? review.images : []
          };
        })
      );

      setReviews(reviewsWithProfiles);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const validRatings = reviews.filter(r => r.rating).map(r => r.rating!);
    if (validRatings.length === 0) return 0;
    return validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
  };

  const openImageGallery = (images: string[], startIndex: number = 0) => {
    setSelectedReviewImages(images);
    setSelectedImageIndex(startIndex);
  };

  const closeImageGallery = () => {
    setSelectedImageIndex(null);
    setSelectedReviewImages([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {placeName}
            </DialogTitle>
            {placeAddress && (
              <p className="text-sm text-muted-foreground">{placeAddress}</p>
            )}
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {/* 전체 평점 요약 */}
              <Card className="p-4 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating rating={Math.round(getAverageRating())} readonly size="sm" />
                      <span className="text-sm font-medium">
                        {getAverageRating().toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reviews.length}개의 리뷰
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">방문자 리뷰</p>
                  </div>
                </div>
              </Card>

              {/* 개별 리뷰들 */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex gap-3">
                      {/* 프로필 이미지 */}
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage 
                          src={review.profiles?.pet_image_url} 
                          alt="리뷰어 프로필"
                        />
                        <AvatarFallback>
                          <User className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        {/* 리뷰 헤더 */}
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              {review.profiles?.pet_name || '익명'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {review.rating && (
                                <StarRating rating={review.rating} readonly size="sm" />
                              )}
                              <span className="text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {formatDate(review.visit_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 리뷰 내용 */}
                        {review.memo && (
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                            {review.memo}
                          </p>
                        )}

                        {/* 리뷰 이미지들 */}
                        {review.images && Array.isArray(review.images) && review.images.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {review.images.slice(0, 6).map((image, index) => (
                              <div
                                key={index}
                                className="relative aspect-square cursor-pointer group"
                                onClick={() => openImageGallery(review.images, index)}
                              >
                                <img
                                  src={image}
                                  alt={`리뷰 이미지 ${index + 1}`}
                                  className="w-full h-full object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                                />
                                {index === 5 && review.images.length > 6 && (
                                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">
                                      +{review.images.length - 6}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                아직 이 장소의 리뷰가 없습니다
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                첫 번째 리뷰를 남겨보세요!
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 이미지 갤러리 모달 */}
      {selectedImageIndex !== null && (
        <Dialog open={selectedImageIndex !== null} onOpenChange={closeImageGallery}>
          <DialogContent className="max-w-2xl">
            <div className="relative">
              <img
                src={selectedReviewImages[selectedImageIndex]}
                alt="리뷰 이미지 확대"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
              
              {/* 이미지 네비게이션 */}
              {selectedReviewImages.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {selectedReviewImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === selectedImageIndex ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
              
              <div className="text-center mt-2">
                <p className="text-sm text-muted-foreground">
                  {selectedImageIndex + 1} / {selectedReviewImages.length}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PlaceReviewsModal;