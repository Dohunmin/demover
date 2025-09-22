import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Tag, Plus, Settings, Users, PenTool, Heart, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNavigation from "@/components/BottomNavigation";
import AdBanner from "@/components/AdBanner";
import CommunityPostModal from "@/components/CommunityPostModal";
import CommunityPostDetailModal from "@/components/CommunityPostDetailModal";
import CommunityPostEditModal from "@/components/CommunityPostEditModal";
import TravelRecordDetailModal from "@/components/TravelRecordDetailModal";

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

interface TravelRecord {
  id: string;
  location_name: string;
  location_address?: string;
  rating?: number;
  memo?: string;
  latitude?: number;
  longitude?: number;
  is_public?: boolean;
  visit_date: string;
  created_at: string;
  updated_at: string;
  images: string[];
  user_id: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
    pet_name?: string;
    pet_image_url?: string;
  };
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  location_name?: string;
  location_address?: string;
  image_url?: string;
  post_type: string;
  created_at: string;
  user_id: string;
  is_anonymous?: boolean;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
    pet_name?: string;
    pet_image_url?: string;
  };
}

const News = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("news");
  const [events, setEvents] = useState<NewsPost[]>([]);
  const [sales, setSales] = useState<NewsPost[]>([]);
  const [travelRecords, setTravelRecords] = useState<TravelRecord[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'events' | 'sales' | 'travel' | 'community'>('all');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [selectedTravelRecord, setSelectedTravelRecord] = useState<TravelRecord | null>(null);
  const [showTravelRecordDetail, setShowTravelRecordDetail] = useState(false);

  useEffect(() => {
    fetchAllData();
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPosts(),
      fetchTravelRecords(),
      fetchCommunityPosts()
    ]);
    setLoading(false);
  };

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
    }
  };

  const fetchTravelRecords = async () => {
    try {
      // Use the safe function that protects location privacy
      const { data: recordsData, error } = await supabase
        .rpc('get_public_travel_records_safe')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch user profiles
      const userIds = recordsData?.map(record => record.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, avatar_url, pet_name, pet_image_url')
        .in('user_id', userIds);

      // Combine records with profiles
      const recordsWithProfiles = recordsData?.map(record => {
        const images = Array.isArray(record.images) 
          ? record.images.filter((img): img is string => typeof img === 'string')
          : [];
        return {
          ...record,
          images,
          profiles: profilesData?.find(profile => profile.user_id === record.user_id)
        };
      }) || [];

      setTravelRecords(recordsWithProfiles);
    } catch (error) {
      console.error('Error fetching travel records:', error);
    }
  };

  const fetchCommunityPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = postsData?.map(post => post.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, avatar_url, pet_name, pet_image_url')
        .in('user_id', userIds);

      // Combine posts with profiles
      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profiles: profilesData?.find(profile => profile.user_id === post.user_id)
      })) || [];

      setCommunityPosts(postsWithProfiles);
    } catch (error) {
      console.error('Error fetching community posts:', error);
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

  const handleViewModeChange = (mode: 'all' | 'events' | 'sales' | 'travel' | 'community') => {
    setViewMode(mode);
    window.scrollTo(0, 0);
  };

  const handlePostClick = (post: CommunityPost) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  const handleTravelRecordClick = (record: TravelRecord) => {
    setSelectedTravelRecord(record);
    setShowTravelRecordDetail(true);
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'recommendation': return '추천';
      case 'question': return '질문';
      case 'review': return '후기';
      default: return '일반';
    }
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'events': return '축제/이벤트';
      case 'sales': return '세일';
      case 'travel': return '다른 멍멍이들의 여행';
      case 'community': return '커뮤니티';
      default: return '소식';
    }
  };

  const getViewSubtitle = () => {
    switch (viewMode) {
      case 'events': return '진행 중인 축제 및 이벤트';
      case 'sales': return '진행 중인 세일 정보';
      case 'travel': return '공개된 여행 기록들';
      case 'community': return '커뮤니티 게시글';
      default: return '최신 소식과 커뮤니티';
    }
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
              <h1 className="header-title">{getViewTitle()}</h1>
              <p className="header-subtitle">{getViewSubtitle()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {viewMode === 'community' && user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPostModal(true)}
                className="text-primary hover:bg-primary/10 p-2"
              >
                <PenTool className="w-5 h-5" />
              </Button>
            )}
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
                  {events.slice(0, 3).map((event) => (
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
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground font-medium block break-words line-clamp-1">{event.title}</span>
                        {event.content && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">{event.content}</p>
                        )}
                        <span className="text-xs text-muted-foreground mt-1 block">
                          작성일: {new Date(event.created_at).toLocaleDateString('ko-KR')}
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
                  {sales.slice(0, 3).map((sale) => (
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
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground font-medium block break-words line-clamp-1">{sale.title}</span>
                        {sale.content && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">{sale.content}</p>
                        )}
                        <span className="text-xs text-muted-foreground mt-1 block">
                          작성일: {new Date(sale.created_at).toLocaleDateString('ko-KR')}
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

            {/* 다른 멍멍이들의 여행 섹션 */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  다른 멍멍이들은 어디를?
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-green-600 hover:text-green-700"
                  onClick={() => handleViewModeChange('travel')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  더보기
                </Button>
              </div>
          
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-muted-foreground text-sm mt-2">로딩 중...</p>
                </div>
              ) : travelRecords.length > 0 ? (
                <div className="space-y-3">
                  {travelRecords.slice(0, 3).map((record) => (
                    <div 
                      key={record.id}
                      onClick={() => handleTravelRecordClick(record)}
                      className="flex items-start p-3 bg-muted/30 rounded-xl hover:bg-green-50 transition-colors cursor-pointer"
                    >
                      <Avatar className="w-8 h-8 mr-3 flex-shrink-0">
                        <AvatarImage src={
                          record.profiles?.pet_image_url || 
                          record.profiles?.avatar_url || 
                          ""
                        } />
                        <AvatarFallback>
                          {(record.profiles?.pet_name || record.profiles?.full_name)?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium break-words line-clamp-1">
                            {record.profiles?.pet_name || record.profiles?.full_name || "사용자"}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">님이</span>
                        </div>
                        <div className="flex items-center space-x-1 mb-1">
                          <MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground break-words line-clamp-1">
                            {record.location_name}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">에 다녀왔어요</span>
                        </div>
                        {record.memo && (
                          <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                            {record.memo}
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(record.visit_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      {record.images.length > 0 && (
                        <img 
                          src={record.images[0]} 
                          alt={record.location_name}
                          className="w-12 h-12 object-cover rounded-lg ml-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">아직 공개된 여행 기록이 없습니다</p>
                  <p className="text-muted-foreground text-xs mt-1">첫 번째 여행 기록을 공유해보세요!</p>
                </div>
              )}
            </div>

            {/* 커뮤니티 섹션 */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                  커뮤니티
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => handleViewModeChange('community')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  더보기
                </Button>
              </div>
          
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-muted-foreground text-sm mt-2">로딩 중...</p>
                </div>
              ) : communityPosts.length > 0 ? (
                <div className="space-y-3">
                  {communityPosts.slice(0, 3).map((post) => (
                    <div 
                      key={post.id}
                      onClick={() => handlePostClick(post)}
                      className="flex items-start p-3 bg-muted/30 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                       <Avatar className="w-8 h-8 mr-3 flex-shrink-0">
                        <AvatarImage src={
                          post.profiles?.pet_image_url || post.profiles?.avatar_url || "/placeholder.svg"
                        } />
                        <AvatarFallback>
                          {(post.profiles?.pet_name || post.profiles?.full_name)?.[0] || "?"}
                        </AvatarFallback>
                       </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs flex-shrink-0">
                            {getPostTypeLabel(post.post_type)}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-1 break-words">
                          {post.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 break-words">
                          {post.content}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                      {post.image_url && (
                        <img 
                          src={post.image_url} 
                          alt={post.title}
                          className="w-12 h-12 object-cover rounded-lg ml-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">아직 커뮤니티 글이 없습니다</p>
                  <p className="text-muted-foreground text-xs mt-1">첫 번째 글을 작성해보세요!</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* 커뮤니티만 보기 모드 */}
        {viewMode === 'community' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-muted-foreground text-sm mt-2">로딩 중...</p>
              </div>
            ) : communityPosts.length > 0 ? (
              communityPosts.map((post) => (
                <Card key={post.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handlePostClick(post)}>
                  <div className="flex items-start space-x-3">
                     <Avatar className="w-10 h-10 flex-shrink-0">
                       <AvatarImage src={
                         post.profiles?.pet_image_url || post.profiles?.avatar_url || "/placeholder.svg"
                       } />
                       <AvatarFallback>
                         {(post.profiles?.pet_name || post.profiles?.full_name)?.[0] || "?"}
                       </AvatarFallback>
                     </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                         <span className="text-sm font-medium">
                           {post.profiles?.pet_name || post.profiles?.full_name || "사용자"}
                         </span>
                        <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                          {getPostTypeLabel(post.post_type)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 break-words">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 break-words">{post.content}</p>
                      {post.location_name && (
                        <div className="flex items-center space-x-1 mb-2">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span className="text-xs text-muted-foreground">{post.location_name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    {post.image_url && (
                      <img 
                        src={post.image_url} 
                        alt={post.title}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">아직 커뮤니티 글이 없습니다</p>
                <p className="text-muted-foreground text-xs mt-1">첫 번째 글을 작성해보세요!</p>
              </div>
            )}
          </div>
        )}

        {/* 다른 멍멍이들의 여행만 보기 모드 */}
        {viewMode === 'travel' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-muted-foreground text-sm mt-2">로딩 중...</p>
              </div>
            ) : travelRecords.length > 0 ? (
              travelRecords.map((record) => (
                <Card key={record.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                     <Avatar className="w-10 h-10 flex-shrink-0">
                       <AvatarImage src={record.profiles?.pet_image_url || record.profiles?.avatar_url || ""} />
                       <AvatarFallback>
                         {(record.profiles?.pet_name || record.profiles?.full_name)?.[0] || "?"}
                       </AvatarFallback>
                     </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                         <span className="text-sm font-medium">
                           {record.profiles?.pet_name || record.profiles?.full_name || "사용자"}
                         </span>
                        <span className="text-xs text-muted-foreground">님의 여행</span>
                      </div>
                      <div className="flex items-center space-x-1 mb-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <h3 className="font-semibold text-foreground break-words line-clamp-1">{record.location_name}</h3>
                      </div>
                      {record.location_address && (
                        <p className="text-sm text-muted-foreground mb-2 break-words line-clamp-1">{record.location_address}</p>
                      )}
                      {record.memo && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2 break-words">{record.memo}</p>
                      )}
                      <div className="flex items-center justify-between">
                        {record.rating && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-muted-foreground">평점:</span>
                            <span className="text-yellow-500">{'★'.repeat(record.rating)}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          방문일: {new Date(record.visit_date).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    {record.images.length > 0 && (
                      <img 
                        src={record.images[0]} 
                        alt={record.location_name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">아직 공개된 여행 기록이 없습니다</p>
                <p className="text-muted-foreground text-xs mt-1">첫 번째 여행 기록을 공유해보세요!</p>
              </div>
            )}
          </div>
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
                      <h3 className="font-semibold text-foreground mb-2 break-words">{event.title}</h3>
                      {event.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2 break-words">{event.content}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        작성일: {new Date(event.created_at).toLocaleDateString('ko-KR')}
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
                      <h3 className="font-semibold text-foreground mb-2 break-words">{sale.title}</h3>
                      {sale.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2 break-words">{sale.content}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        작성일: {new Date(sale.created_at).toLocaleDateString('ko-KR')}
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

      {/* Ad Banner */}
      <AdBanner />

      {/* Modals */}
      <CommunityPostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onPostCreated={() => {
          fetchAllData();
          // 모바일 캐시 문제 해결을 위한 강제 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }}
      />

      <CommunityPostDetailModal
        post={selectedPost}
        isOpen={showPostDetail}
        onClose={() => {
          setShowPostDetail(false);
          setSelectedPost(null);
        }}
        onEdit={(post) => {
          setSelectedPost(post);
          setShowPostDetail(false);
          setShowEditModal(true);
        }}
        onDelete={fetchAllData}
      />

      <CommunityPostEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPost(null);
        }}
        onPostUpdated={fetchAllData}
        post={selectedPost}
      />

      <TravelRecordDetailModal
        record={selectedTravelRecord}
        isOpen={showTravelRecordDetail}
        onClose={() => {
          setShowTravelRecordDetail(false);
          setSelectedTravelRecord(null);
        }}
      />

      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default News;
