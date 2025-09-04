import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Calendar, Tag, Trash2, Heart, Plus, Camera, MapPin, Edit, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdBanner from "@/components/AdBanner";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TravelRecordsMap from "@/components/TravelRecordsMap";
import KakaoMap from "@/components/KakaoMap";

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
  created_at: string;
  updated_at: string;
}

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

interface TravelBookmark {
  id: string;
  content_id: string;
  title: string;
  addr1?: string;
  addr2?: string;
  image_url?: string;
  tel?: string;
  mapx?: string;
  mapy?: string;
  bookmark_type: 'general' | 'pet';
  created_at: string;
}

const Records = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [travelBookmarks, setTravelBookmarks] = useState<TravelBookmark[]>([]);
  const [travelRecords, setTravelRecords] = useState<TravelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookmarks");
  const [travelViewMode, setTravelViewMode] = useState<"list" | "map">("list");
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({
    location_name: "",
    location_address: "",
    visit_date: "",
    memo: "",
    images: [] as File[]
  });

  useEffect(() => {
    if (user) {
      fetchBookmarks();
      fetchTravelBookmarks();
      fetchTravelRecords();
    }
  }, [user]);

  const fetchTravelRecords = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('travel_records')
        .select('*')
        .eq('user_id', user.id)
        .order('visit_date', { ascending: false });

      if (error) {
        console.error('Error fetching travel records:', error);
        toast.error('여행 기록을 불러오는데 실패했습니다.');
        return;
      }

      setTravelRecords(data || []);
    } catch (error) {
      console.error('Error fetching travel records:', error);
      toast.error('여행 기록을 불러오는데 실패했습니다.');
    }
  };

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

  const fetchTravelBookmarks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('travel_bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching travel bookmarks:', error);
        toast.error('여행지 즐겨찾기 목록을 불러오는데 실패했습니다.');
        return;
      }

      // 타입 변환하여 설정
      const typedBookmarks: TravelBookmark[] = (data || []).map(bookmark => ({
        ...bookmark,
        bookmark_type: bookmark.bookmark_type as 'general' | 'pet'
      }));

      setTravelBookmarks(typedBookmarks);
    } catch (error) {
      console.error('Error fetching travel bookmarks:', error);
      toast.error('여행지 즐겨찾기 목록을 불러오는데 실패했습니다.');
    }
  };

  const uploadImages = async (images: File[]) => {
    const uploadedUrls: string[] = [];
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
      
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

  const addTravelRecord = async () => {
    if (!user || !newRecord.location_name || !newRecord.visit_date) {
      toast.error('위치명과 방문 날짜를 입력해주세요.');
      return;
    }

    try {
      const imageUrls = await uploadImages(newRecord.images);
      
      const { error } = await (supabase as any)
        .from('travel_records')
        .insert({
          user_id: user.id,
          location_name: newRecord.location_name,
          location_address: newRecord.location_address,
          visit_date: newRecord.visit_date,
          memo: newRecord.memo,
          images: imageUrls
        });

      if (error) {
        console.error('Error adding travel record:', error);
        toast.error('여행 기록 추가에 실패했습니다.');
        return;
      }

      toast.success('여행 기록이 추가되었습니다.');
      setIsAddingRecord(false);
      setNewRecord({
        location_name: "",
        location_address: "",
        visit_date: "",
        memo: "",
        images: []
      });
      fetchTravelRecords();
    } catch (error) {
      console.error('Error adding travel record:', error);
      toast.error('여행 기록 추가에 실패했습니다.');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setNewRecord({ ...newRecord, images: Array.from(files) });
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

  const removeTravelRecord = async (recordId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('travel_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Error removing travel record:', error);
        toast.error('여행 기록 삭제에 실패했습니다.');
        return;
      }

      setTravelRecords(travelRecords.filter(record => record.id !== recordId));
      toast.success('여행 기록이 삭제되었습니다.');
    } catch (error) {
      console.error('Error removing travel record:', error);
      toast.error('여행 기록 삭제에 실패했습니다.');
    }
  };

  const removeTravelBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('travel_bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) {
        console.error('Error removing travel bookmark:', error);
        toast.error('여행지 즐겨찾기 삭제에 실패했습니다.');
        return;
      }

      setTravelBookmarks(travelBookmarks.filter(bookmark => bookmark.id !== bookmarkId));
      toast.success('여행지 즐겨찾기가 삭제되었습니다.');
    } catch (error) {
      console.error('Error removing travel bookmark:', error);
      toast.error('여행지 즐겨찾기 삭제에 실패했습니다.');
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="bookmarks" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              북마크
            </TabsTrigger>
            <TabsTrigger value="travel" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              여행 기록
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookmarks">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">로딩 중...</p>
              </div>
            ) : bookmarks.length > 0 || travelBookmarks.length > 0 ? (
              <div className="space-y-6">
                {/* 축제/이벤트 북마크 섹션 */}
                {bookmarks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Tag className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">축제 · 이벤트</h3>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                        {bookmarks.length}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {bookmarks.map((bookmark) => (
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
                                <div className={`flex items-center px-2 py-1 rounded-lg ${
                                  bookmark.news_posts.category === 'event' 
                                    ? 'bg-purple-50 border-purple-200 border text-purple-600' 
                                    : 'bg-orange-50 border-orange-200 border text-orange-600'
                                }`}>
                                  <Tag className="w-3 h-3 mr-1" />
                                  <span className="text-xs font-medium">
                                    {bookmark.news_posts.category === 'event' ? '이벤트' : '특가'}
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
                      ))}
                    </div>
                  </div>
                )}

                {/* 여행지 즐겨찾기 섹션 */}
                {travelBookmarks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">여행지</h3>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                        {travelBookmarks.length}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {travelBookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="card">
                          <div className="flex gap-4">
                            {bookmark.image_url && (
                              <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={bookmark.image_url} 
                                  alt={bookmark.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`flex items-center px-2 py-1 rounded-lg ${
                                  bookmark.bookmark_type === 'pet' 
                                    ? 'bg-green-50 border-green-200 border text-green-600' 
                                    : 'bg-blue-50 border-blue-200 border text-blue-600'
                                }`}>
                                  {bookmark.bookmark_type === 'pet' ? (
                                    <Heart className="w-3 h-3 mr-1" />
                                  ) : (
                                    <MapPin className="w-3 h-3 mr-1" />
                                  )}
                                  <span className="text-xs font-medium">
                                    {bookmark.bookmark_type === 'pet' ? '반려동물 동반' : '일반 관광지'}
                                  </span>
                                </div>
                              </div>
                              <h4 className="card-title font-semibold mb-1 line-clamp-1">
                                {bookmark.title}
                              </h4>
                              {bookmark.addr1 && (
                                <div className="flex items-start gap-1 mb-2">
                                  <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {bookmark.addr1} {bookmark.addr2}
                                  </p>
                                </div>
                              )}
                              {bookmark.tel && (
                                <div className="flex items-center gap-1 mb-2">
                                  <span className="text-xs text-muted-foreground">📞 {bookmark.tel}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  즐겨찾기: {new Date(bookmark.created_at).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="p-2 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => removeTravelBookmark(bookmark.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 빈 상태 메시지 */}
                {bookmarks.length === 0 && travelBookmarks.length === 0 && (
                  <div className="card text-center">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="card-title text-lg mb-2">
                      북마크가 없습니다
                    </h2>
                    <p className="card-subtitle text-sm mb-5 leading-relaxed">
                      관심 있는 축제, 이벤트나 여행지를<br />북마크하여 저장해보세요!
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => navigate("/news")}
                        variant="outline"
                        className="flex-1"
                      >
                        축제 · 이벤트 보기
                      </Button>
                      <Button 
                        onClick={() => navigate("/travel")}
                        className="button-primary flex-1"
                      >
                        여행지 찾기
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="card-title text-lg mb-2">
                  북마크가 없습니다
                </h2>
                <p className="card-subtitle text-sm mb-5 leading-relaxed">
                  관심 있는 축제, 이벤트나 여행지를<br />북마크하여 저장해보세요!
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate("/news")}
                    variant="outline"
                    className="flex-1"
                  >
                    축제 · 이벤트 보기
                  </Button>
                  <Button 
                    onClick={() => navigate("/travel")}
                    className="button-primary flex-1"
                  >
                    여행지 찾기
                  </Button>
                </div>
              </div>
            )}

            {/* Kakao Map Section */}
            <div className="mt-8">
              <h2 className="card-title text-lg mb-4">지도에서 찾기</h2>
              <div className="h-96 rounded-lg overflow-hidden">
                <KakaoMap 
                  onBack={() => {}} 
                  hideCategoryGrid={true} 
                  hideSearchBar={true}
                  showPetFilter={true}
                  bookmarkedPlaces={travelBookmarks.map(bookmark => ({
                    content_id: bookmark.content_id,
                    title: bookmark.title,
                    mapx: bookmark.mapx || '',
                    mapy: bookmark.mapy || '',
                    bookmark_type: bookmark.bookmark_type
                  }))}
                />
              </div>
            </div>
          </TabsContent>


          <TabsContent value="travel">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="card-title text-lg">여행 기록</h2>
              <div className="flex items-center gap-2">
                {travelRecords.length > 0 && (
                  <div className="flex rounded-lg border border-border">
                    <Button 
                      size="sm"
                      variant={travelViewMode === "list" ? "default" : "ghost"}
                      onClick={() => setTravelViewMode("list")}
                      className="rounded-r-none h-8 px-3"
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm"
                      variant={travelViewMode === "map" ? "default" : "ghost"}
                      onClick={() => setTravelViewMode("map")}
                      className="rounded-l-none h-8 px-3"
                    >
                      <Map className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <Dialog open={isAddingRecord} onOpenChange={setIsAddingRecord}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="button-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      새 기록 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>새 여행 기록 추가</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="location">위치명 *</Label>
                        <Input
                          id="location"
                          placeholder="방문한 장소를 입력해주세요"
                          value={newRecord.location_name}
                          onChange={(e) => setNewRecord({ ...newRecord, location_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">주소</Label>
                        <Input
                          id="address"
                          placeholder="상세 주소 (선택사항)"
                          value={newRecord.location_address}
                          onChange={(e) => setNewRecord({ ...newRecord, location_address: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="date">방문 날짜 *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newRecord.visit_date}
                          onChange={(e) => setNewRecord({ ...newRecord, visit_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="memo">메모</Label>
                        <Textarea
                          id="memo"
                          placeholder="이 장소에서의 추억을 남겨보세요..."
                          value={newRecord.memo}
                          onChange={(e) => setNewRecord({ ...newRecord, memo: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="images">사진</Label>
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
                            사진 선택 ({newRecord.images.length})
                          </Button>
                        </div>
                        {newRecord.images.length > 0 && (
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {newRecord.images.map((file, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-16 object-cover rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddingRecord(false)}
                          className="flex-1"
                        >
                          취소
                        </Button>
                        <Button
                          type="button"
                          onClick={addTravelRecord}
                          className="button-primary flex-1"
                        >
                          저장
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">로딩 중...</p>
              </div>
            ) : travelRecords.length > 0 ? (
              <div>
                {travelViewMode === "map" ? (
                  <div className="mb-4">
                    <TravelRecordsMap 
                      records={travelRecords}
                      onRecordClick={(record) => {
                        console.log('Clicked record:', record);
                      }}
                    />
                  </div>
                ) : null}
                
                {travelViewMode === "list" ? (
                  <div className="space-y-4">
                    {travelRecords.map((record) => (
                      <div key={record.id} className="card">
                        <div className="flex gap-4">
                          {record.images.length > 0 && (
                            <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={record.images[0]} 
                                alt={record.location_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <h4 className="card-title font-semibold line-clamp-1">
                                {record.location_name}
                              </h4>
                            </div>
                            {record.location_address && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {record.location_address}
                              </p>
                            )}
                            {record.memo && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {record.memo}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                방문: {new Date(record.visit_date).toLocaleDateString('ko-KR')}
                              </span>
                              {record.images.length > 1 && (
                                <span className="text-xs text-primary">
                                  +{record.images.length - 1}장
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-2 h-auto text-primary hover:text-primary/80 hover:bg-primary/10"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-2 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeTravelRecord(record.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="card text-center">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="card-title text-lg mb-2">
                  여행 기록이 없습니다
                </h2>
                <p className="card-subtitle text-sm mb-5 leading-relaxed">
                  반려견과 함께한 특별한 순간을<br />기록으로 남겨보세요!
                </p>
                <Button 
                  onClick={() => setIsAddingRecord(true)}
                  className="button-primary w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 기록 추가하기
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Ad Banner */}
      <AdBanner />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Records;