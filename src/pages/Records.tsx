import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Calendar, Tag, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookmarkedPost {
  id: string;
  news_post_id: string;
  created_at: string;
  news_posts: {
    id: string;
    title: string;
    content: string;
    category: 'event' | 'sale';
    created_at: string;
    image_url?: string | null;
  };
}

const Records = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('bookmarks')
        .select(`
          id,
          news_post_id,
          created_at,
          news_posts:news_post_id (
            id,
            title,
            content,
            category,
            created_at,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookmarks:', error);
        toast.error('북마크 목록을 불러오는데 실패했습니다.');
        return;
      }

      setBookmarks(data || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('북마크 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) {
        console.error('Error removing bookmark:', error);
        toast.error('북마크 삭제에 실패했습니다.');
        return;
      }

      setBookmarks(bookmarks.filter(bookmark => bookmark.id !== bookmarkId));
      toast.success('북마크가 삭제되었습니다.');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('북마크 삭제에 실패했습니다.');
    }
  };

  const getCategoryInfo = (category: 'event' | 'sale') => {
    if (category === 'event') {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto pb-20">
        <header className="header p-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-foreground hover:bg-muted p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="header-title">기록</h1>
              <p className="header-subtitle">북마크한 소식들</p>
            </div>
          </div>
        </header>

        <main className="p-5">
          <div className="card text-center">
            <div className="w-16 h-16 bg-foreground rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-background" />
            </div>
            <h2 className="card-title text-lg mb-2">
              로그인이 필요합니다
            </h2>
            <p className="card-subtitle text-sm mb-5 leading-relaxed">
              북마크한 소식을 확인하려면<br />먼저 로그인해주세요
            </p>
            <Button 
              onClick={() => navigate("/auth")}
              className="button-primary w-full"
            >
              로그인하러 가기
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-20">
      {/* Header */}
      <header className="header p-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-foreground hover:bg-muted p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="header-title">기록</h1>
            <p className="header-subtitle">북마크한 소식들</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-5">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">로딩 중...</p>
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => {
              const categoryInfo = getCategoryInfo(bookmark.news_posts.category);
              const IconComponent = categoryInfo.icon;

              return (
                <div key={bookmark.id} className="card">
                  <div className="flex gap-4">
                    {bookmark.news_posts.image_url && (
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={bookmark.news_posts.image_url} 
                          alt={bookmark.news_posts.title}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => navigate(`/news/${bookmark.news_posts.id}`)}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex items-center px-2 py-1 rounded-lg ${categoryInfo.bgColor} ${categoryInfo.borderColor} border`}>
                          <IconComponent className={`w-3 h-3 mr-1 ${categoryInfo.color}`} />
                          <span className={`text-xs font-medium ${categoryInfo.color}`}>
                            {categoryInfo.label}
                          </span>
                        </div>
                      </div>
                      <h4 
                        className="card-title font-semibold mb-1 line-clamp-1 cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/news/${bookmark.news_posts.id}`)}
                      >
                        {bookmark.news_posts.title}
                      </h4>
                      {bookmark.news_posts.content && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {bookmark.news_posts.content}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          북마크: {new Date(bookmark.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 h-auto text-primary hover:text-primary/80 hover:bg-primary/10"
                        onClick={() => navigate(`/news/${bookmark.news_posts.id}`)}
                      >
                        <BookOpen className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeBookmark(bookmark.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="card-title text-lg mb-2">
              북마크한 소식이 없습니다
            </h2>
            <p className="card-subtitle text-sm mb-5 leading-relaxed">
              소식 페이지에서 하트 버튼을 눌러<br />관심 있는 소식을 저장해보세요!
            </p>
            <Button 
              onClick={() => navigate("/news")}
              className="button-primary w-full"
            >
              소식 보러가기
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Records;