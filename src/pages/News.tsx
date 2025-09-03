import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Tag, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface NewsPost {
  id: string;
  title: string;
  content: string;
  category: 'event' | 'sale';
  created_at: string;
  image_url?: string | null;
}

const News = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("news");
  const [events, setEvents] = useState<NewsPost[]>([]);
  const [sales, setSales] = useState<NewsPost[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'events' | 'sales'>('all');

  useEffect(() => {
    fetchPosts();
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!data && !error);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('news_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      const postsWithTypes = (data || []).map(post => ({
        ...post,
        category: post.category as 'event' | 'sale'
      }));
      
      const eventPosts = postsWithTypes.filter(post => post.category === 'event');
      const salePosts = postsWithTypes.filter(post => post.category === 'sale');
      
      setEvents(eventPosts);
      setSales(salePosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") {
      navigate("/");
    } else if (tab === "mbti") {
      navigate("/mbti");
    }
  };

  const handleViewModeChange = (mode: 'all' | 'events' | 'sales') => {
    setViewMode(mode);
  };


  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-20">
      {/* Header */}
      <header className="header p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewMode === 'all' ? navigate("/") : setViewMode('all')}
              className="text-foreground hover:bg-muted p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="header-title">
                {viewMode === 'all' ? '소식' : 
                 viewMode === 'events' ? '축제/이벤트' : '세일'}
              </h1>
              <p className="header-subtitle">
                {viewMode === 'all' ? '최신 행사 및 할인 정보' :
                 viewMode === 'events' ? '진행 중인 축제 및 이벤트' : '진행 중인 세일 정보'}
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="text-foreground hover:bg-muted p-2"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-5 space-y-6">
        {/* 전체보기 모드 */}
        {viewMode === 'all' && (
          <>
            {/* 축제/이벤트 섹션 */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg flex items-center">
                  <Calendar className="w-5 h-5 mr-2" style={{ color: 'var(--primary-color)' }} />
                  축제/이벤트
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-primary/80"
                  onClick={() => handleViewModeChange('events')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  더보기
                </Button>
              </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground text-sm mt-2">로딩 중...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div 
                  key={event.id}
                  onClick={() => navigate(`/news/${event.id}`)}
                  className="flex items-start p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {event.image_url && (
                    <div className="flex-shrink-0 mr-3">
                      <img 
                        src={event.image_url} 
                        alt={event.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0 mt-2"></div>
                  <div className="flex-1">
                    <span className="text-sm text-foreground font-medium block">{event.title}</span>
                    {event.content && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.content}</p>
                    )}
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {new Date(event.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">현재 진행 중인 축제/이벤트가 없습니다</p>
              <p className="text-muted-foreground text-xs mt-1">새로운 행사 정보를 기다려주세요!</p>
            </div>
          )}
            </div>

            {/* 세일 섹션 */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-red-600" />
                  세일
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleViewModeChange('sales')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  더보기
                </Button>
              </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-muted-foreground text-sm mt-2">로딩 중...</p>
            </div>
          ) : sales.length > 0 ? (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div 
                  key={sale.id}
                  onClick={() => navigate(`/news/${sale.id}`)}
                  className="flex items-start p-3 bg-muted/30 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                >
                  {sale.image_url && (
                    <div className="flex-shrink-0 mr-3">
                      <img 
                        src={sale.image_url} 
                        alt={sale.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0 mt-2"></div>
                  <div className="flex-1">
                    <span className="text-sm text-foreground font-medium block">{sale.title}</span>
                    {sale.content && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sale.content}</p>
                    )}
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {new Date(sale.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <Tag className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">현재 진행 중인 세일이 없습니다</p>
              <p className="text-muted-foreground text-xs mt-1">새로운 할인 정보를 기다려주세요!</p>
            </div>
          )}
            </div>
          </>
        )}

        {/* 축제/이벤트만 보기 모드 */}
        {viewMode === 'events' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground text-sm mt-2">로딩 중...</p>
              </div>
            ) : events.length > 0 ? (
              events.map((event) => (
                <Card key={event.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/news/${event.id}`)}>
                  <div className="flex items-start space-x-4">
                    {event.image_url && (
                      <img 
                        src={event.image_url} 
                        alt={event.title}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <Calendar className="w-4 h-4 mr-2" style={{ color: 'var(--primary-color)' }} />
                        <span className="text-sm text-primary font-medium">축제/이벤트</span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{event.title}</h3>
                      {event.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{event.content}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">현재 진행 중인 축제/이벤트가 없습니다</p>
                <p className="text-muted-foreground text-xs mt-1">새로운 행사 정보를 기다려주세요!</p>
              </div>
            )}
          </div>
        )}

        {/* 세일만 보기 모드 */}
        {viewMode === 'sales' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-muted-foreground text-sm mt-2">로딩 중...</p>
              </div>
            ) : sales.length > 0 ? (
              sales.map((sale) => (
                <Card key={sale.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/news/${sale.id}`)}>
                  <div className="flex items-start space-x-4">
                    {sale.image_url && (
                      <img 
                        src={sale.image_url} 
                        alt={sale.title}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <Tag className="w-4 h-4 mr-2 text-red-600" />
                        <span className="text-sm text-red-600 font-medium">세일</span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{sale.title}</h3>
                      {sale.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{sale.content}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Tag className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">현재 진행 중인 세일이 없습니다</p>
                <p className="text-muted-foreground text-xs mt-1">새로운 할인 정보를 기다려주세요!</p>
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  );
};

export default News;