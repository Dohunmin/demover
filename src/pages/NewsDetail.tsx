import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Tag, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NewsPost {
  id: string;
  title: string;
  content: string;
  category: 'event' | 'sale';
  created_at: string;
  image_url?: string | null;
}

const NewsDetail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
  }, [id]);

  useEffect(() => {
    if (user && post) {
      checkBookmarkStatus();
    }
  }, [user, post]);

  const fetchPost = async (postId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('news_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        toast.error('게시물을 불러오는데 실패했습니다.');
        navigate('/news');
        return;
      }

      setPost({
        ...data,
        category: data.category as 'event' | 'sale'
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('게시물을 불러오는데 실패했습니다.');
      navigate('/news');
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    if (!user || !post) return;

    try {
      const { data, error } = await (supabase as any)
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('news_post_id', post.id)
        .maybeSingle();

      setIsBookmarked(!!data && !error);
    } catch (error) {
      setIsBookmarked(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      navigate('/auth');
      return;
    }

    if (!post) return;

    setBookmarkLoading(true);
    
    try {
      if (isBookmarked) {
        // 북마크 제거
        const { error } = await (supabase as any)
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('news_post_id', post.id);

        if (error) {
          console.error('Error removing bookmark:', error);
          toast.error('북마크 삭제에 실패했습니다.');
          return;
        }

        setIsBookmarked(false);
        toast.success('북마크가 해제되었습니다.');
      } else {
        // 북마크 추가
        const { error } = await (supabase as any)
          .from('bookmarks')
          .insert({
            user_id: user.id,
            news_post_id: post.id
          });

        if (error) {
          console.error('Error adding bookmark:', error);
          toast.error('북마크 추가에 실패했습니다.');
          return;
        }

        setIsBookmarked(true);
        toast.success('북마크에 추가되었습니다.');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('북마크 처리 중 오류가 발생했습니다.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title,
          text: post?.content,
          url: window.location.href,
        });
      } else {
        // 브라우저가 Web Share API를 지원하지 않는 경우 클립보드에 복사
        await navigator.clipboard.writeText(window.location.href);
        toast.success('링크가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('공유에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-500 mb-4">게시물을 찾을 수 없습니다.</p>
            <Button onClick={() => navigate('/news')}>
              소식으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getCategoryInfo = () => {
    if (post.category === 'event') {
      return {
        icon: Calendar,
        label: '축제/이벤트',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    } else {
      return {
        icon: Tag,
        label: '세일',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
  };

  const categoryInfo = getCategoryInfo();
  const IconComponent = categoryInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-8">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/news')}
              className="text-gray-700 hover:bg-gray-100 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className={`flex items-center px-3 py-1 rounded-full ${categoryInfo.bgColor} ${categoryInfo.borderColor} border`}>
              <IconComponent className={`w-4 h-4 mr-1 ${categoryInfo.color}`} />
              <span className={`text-sm font-medium ${categoryInfo.color}`}>
                {categoryInfo.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-700 hover:bg-gray-100 p-2"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBookmark}
              disabled={bookmarkLoading}
              className={`p-2 transition-colors ${
                isBookmarked 
                  ? 'text-red-500 hover:bg-red-50' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Heart 
                className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} 
              />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-5">
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          {/* 이미지 */}
          {post.image_url && (
            <div className="mb-6">
              <img 
                src={post.image_url} 
                alt={post.title}
                className="w-full h-64 object-cover rounded-xl"
              />
            </div>
          )}

          {/* 제목 */}
          <h1 className="text-xl font-bold text-gray-900 mb-3 leading-relaxed">
            {post.title}
          </h1>

          {/* 날짜 */}
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{new Date(post.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}</span>
          </div>

          {/* 내용 */}
          <div className="prose prose-sm max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>
        </Card>

        {/* 하단 액션 버튼들 */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex items-center justify-center py-3"
          >
            <Share2 className="w-4 h-4 mr-2" />
            공유하기
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/news')}
            className="flex items-center justify-center py-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NewsDetail;