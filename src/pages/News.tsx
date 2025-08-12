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
}

const News = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("news");
  const [events, setEvents] = useState<NewsPost[]>([]);
  const [sales, setSales] = useState<NewsPost[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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


  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white p-6 rounded-b-3xl shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">소식</h1>
              <p className="text-blue-100 text-sm">최신 행사 및 할인 정보</p>
            </div>
          </div>
          
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="text-white hover:bg-white/10 p-2"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-5 space-y-6">
        {/* 축제/이벤트 섹션 */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              축제/이벤트
            </h2>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              더보기
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-2">로딩 중...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-start p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0 mt-2"></div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-700 font-medium block">{event.title}</span>
                    {event.content && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.content}</p>
                    )}
                    <span className="text-xs text-gray-400 mt-1 block">
                      {new Date(event.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">현재 진행 중인 축제/이벤트가 없습니다</p>
              <p className="text-gray-400 text-xs mt-1">새로운 행사 정보를 기다려주세요!</p>
            </div>
          )}
        </Card>

        {/* 세일 섹션 */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-red-600" />
              세일
            </h2>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Plus className="w-4 h-4 mr-1" />
              더보기
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-2">로딩 중...</p>
            </div>
          ) : sales.length > 0 ? (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div 
                  key={sale.id}
                  className="flex items-start p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0 mt-2"></div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-700 font-medium block">{sale.title}</span>
                    {sale.content && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sale.content}</p>
                    )}
                    <span className="text-xs text-gray-400 mt-1 block">
                      {new Date(sale.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">현재 진행 중인 세일이 없습니다</p>
              <p className="text-gray-400 text-xs mt-1">새로운 할인 정보를 기다려주세요!</p>
            </div>
          )}
        </Card>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onMbtiClick={() => navigate("/mbti")}
      />
    </div>
  );
};

export default News;