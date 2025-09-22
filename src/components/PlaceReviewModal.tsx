import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
    pet_name?: string;
    pet_image_url?: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface PlaceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewUpdate?: (stats: ReviewStats) => void;
  place: {
    contentid: string;
    title: string;
  };
}

const PlaceReviewModal: React.FC<PlaceReviewModalProps> = ({ isOpen, onClose, onReviewUpdate, place }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReviews();
      // 모달이 열릴 때 textarea의 포커스를 명시적으로 제거
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.blur();
        }
      }, 100);
    }
  }, [isOpen, place.contentid]);

  const fetchReviews = async () => {
    try {
      // 모든 리뷰 가져오기
      const { data: allReviews, error: reviewsError } = await supabase
        .from('place_reviews')
        .select('id, user_id, rating, comment, created_at')
        .eq('content_id', place.contentid)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        return;
      }

      // 프로필 정보 가져오기
      const { data: profilesData } = await supabase
        .rpc('get_safe_public_profile_fields');

      // 리뷰에 프로필 정보 매핑
      const reviewsWithProfiles = allReviews?.map(review => ({
        ...review,
        profiles: profilesData?.find(profile => profile.user_id === review.user_id)
      })) || [];

      if (reviewsError) throw reviewsError;

      setReviews(reviewsWithProfiles);

      // 평균 평점 계산
      if (reviewsWithProfiles && reviewsWithProfiles.length > 0) {
        const avg = reviewsWithProfiles.reduce((sum, review) => sum + review.rating, 0) / reviewsWithProfiles.length;
        const avgRating = Math.round(avg * 10) / 10;
        setAverageRating(avgRating);
        
        // 부모 컴포넌트에 평점 정보 전달
        if (onReviewUpdate) {
          onReviewUpdate({
            averageRating: avgRating,
            totalReviews: reviewsWithProfiles.length
          });
        }
        
        // 현재 사용자의 리뷰 찾기
        const currentUserReview = reviewsWithProfiles.find(review => review.user_id === user?.id);
        if (currentUserReview) {
          setUserReview(currentUserReview);
          setRating(currentUserReview.rating);
          setComment(currentUserReview.comment);
        }
      } else {
        setAverageRating(0);
        if (onReviewUpdate) {
          onReviewUpdate({
            averageRating: 0,
            totalReviews: 0
          });
        }
      }
    } catch (error) {
      console.error('리뷰 로드 실패:', error);
      toast.error('리뷰를 불러오는데 실패했습니다.');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (rating === 0) {
      toast.error('평점을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        user_id: user.id,
        content_id: place.contentid,
        place_title: place.title,
        rating,
        comment: comment.trim() || null
      };

      if (userReview) {
        // 기존 리뷰 업데이트
        const { error } = await supabase
          .from('place_reviews')
          .update(reviewData)
          .eq('id', userReview.id);

        if (error) throw error;
        toast.success('리뷰가 수정되었습니다.');
      } else {
        // 새 리뷰 등록
        const { error } = await supabase
          .from('place_reviews')
          .insert(reviewData);

        if (error) throw error;
        toast.success('리뷰가 등록되었습니다.');
      }

      await fetchReviews(); // 리뷰 목록 새로고침
    } catch (error) {
      console.error('리뷰 등록/수정 실패:', error);
      toast.error('리뷰 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    try {
      const { error } = await supabase
        .from('place_reviews')
        .delete()
        .eq('id', userReview.id);

      if (error) throw error;

      toast.success('리뷰가 삭제되었습니다.');
      setUserReview(null);
      setRating(0);
      setComment('');
      await fetchReviews();
    } catch (error) {
      console.error('리뷰 삭제 실패:', error);
      toast.error('리뷰 삭제에 실패했습니다.');
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= currentRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{place.title}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {averageRating > 0 ? (
              <>
                {renderStars(averageRating)}
                <span>{averageRating}점 ({reviews.length}개 리뷰)</span>
              </>
            ) : (
              <span>아직 리뷰가 없습니다</span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 리뷰 작성 섹션 */}
          {user && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">
                {userReview ? '내 리뷰 수정' : '리뷰 작성'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    평점
                  </label>
                  {renderStars(rating, true)}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    후기 (선택사항)
                  </label>
                  <Textarea
                    ref={textareaRef}
                    placeholder="이 장소에 대한 경험을 공유해주세요..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                    autoFocus={false}
                    onFocus={(e) => {
                      // 자동 포커스가 아닌 사용자 클릭일 때만 포커스 유지
                      if (document.activeElement !== e.target) {
                        e.target.blur();
                      }
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitReview}
                    disabled={isSubmitting || rating === 0}
                    className="flex-1"
                  >
                    {isSubmitting ? '처리중...' : userReview ? '수정하기' : '등록하기'}
                  </Button>
                  
                  {userReview && (
                    <Button 
                      variant="outline" 
                      onClick={handleDeleteReview}
                      disabled={isSubmitting}
                    >
                      삭제
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 다른 사용자 리뷰 목록 */}
          <div>
            <h3 className="font-medium mb-3">모든 리뷰 ({reviews.length}개)</h3>
            
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {review.user_id === user?.id ? '내 리뷰' : (review.profiles?.pet_name || review.profiles?.full_name || '사용자')}
                        </span>
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {review.comment && (
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                아직 작성된 리뷰가 없습니다.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceReviewModal;