import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Tag, Users, UserPlus, Shield, User, X, Camera, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewsPost {
  id: string;
  title: string;
  content: string;
  category: 'event' | 'sale';
  created_at: string;
  updated_at: string;
  author_id: string;
  image_url?: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  pet_name?: string;
  pet_age?: number;
  pet_gender?: string;
  pet_breed?: string;
  pet_image_url?: string;
  created_at: string;
  email?: string;
  role?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("news");
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'event' as 'event' | 'sale'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    
    checkAdminRole();
    fetchPosts();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (activeTab === "users" && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

  const checkAdminRole = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.log('Not an admin user');
        setIsAdmin(false);
        return;
      }
      
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin role:', error);
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
        toast.error('소식을 불러오는데 실패했습니다.');
        return;
      }

      setPosts((data || []).map(post => ({
        ...post,
        category: post.category as 'event' | 'sale'
      })));
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('소식을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await (supabase as any).storage
        .from('news-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = (supabase as any).storage
        .from('news-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`이미지 업로드 실패: ${error.message || 'Unknown error'}`);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      let imageUrl = null;

      // Upload image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      if (editingPost) {
        // Update existing post
        const { error } = await (supabase as any)
          .from('news_posts')
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            image_url: imageUrl || editingPost.image_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPost.id);

        if (error) throw error;
        toast.success('소식이 수정되었습니다.');
      } else {
        // Create new post
        const { error } = await (supabase as any)
          .from('news_posts')
          .insert({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            author_id: currentUser.id,
            image_url: imageUrl
          });

        if (error) throw error;
        toast.success('새 소식이 등록되었습니다.');
      }

      // Reset form and close dialog
      setFormData({ title: '', content: '', category: 'event' });
      setEditingPost(null);
      setImageFile(null);
      setImagePreview(null);
      setIsDialogOpen(false);
      fetchPosts();
      
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('저장에 실패했습니다.');
    }
  };

  const handleEdit = (post: NewsPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      category: post.category
    });
    setImagePreview(post.image_url || null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await (supabase as any)
        .from('news_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      toast.success('소식이 삭제되었습니다.');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('삭제에 실패했습니다.');
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      // Call edge function to get all users
      const { data, error } = await (supabase as any).functions.invoke('admin-users', {
        headers: {
          Authorization: `Bearer ${(await (supabase as any).auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('회원 정보를 불러오는데 실패했습니다.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      if (newRole === 'user') {
        // Remove admin role
        const { error } = await (supabase as any)
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        
        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await (supabase as any)
          .from('user_roles')
          .upsert({ 
            user_id: userId, 
            role: newRole as 'admin' | 'moderator' | 'user'
          }, {
            onConflict: 'user_id,role'
          });
        
        if (error) throw error;
      }
      
      toast.success('권한이 변경되었습니다.');
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('권한 변경에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', category: 'event' });
    setEditingPost(null);
    setImageFile(null);
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto flex items-center justify-center">
        <Card className="p-6 m-4 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600 mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
          <Button onClick={() => navigate("/")} variant="outline">
            홈으로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 text-white p-6 rounded-b-3xl shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">관리자 페이지</h1>
            <p className="text-purple-100 text-sm">소식 & 회원 관리</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-5 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="news" className="flex items-center space-x-2">
              <Tag className="w-4 h-4" />
              <span>소식 관리</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>회원 관리</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="space-y-6">
            {/* Create Button */}
            <Card className="p-4 bg-white rounded-2xl shadow-lg">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    새 소식 등록
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPost ? '소식 수정' : '새 소식 등록'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">카테고리</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: 'event' | 'sale') => 
                          setFormData(prev => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="event">축제/이벤트</SelectItem>
                          <SelectItem value="sale">세일/할인</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-2">
                      <Label>이미지</Label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                          {imagePreview ? (
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-center">
                              <Camera className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                              <span className="text-xs text-gray-500">이미지</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            제거
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">JPG, PNG, WebP 파일을 업로드하세요</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">제목</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="소식 제목을 입력하세요"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="content">내용</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="소식 내용을 입력하세요"
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">
                        {editingPost ? '수정' : '등록'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        취소
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </Card>

            {/* Posts List */}
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="p-4 bg-white rounded-2xl shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {post.category === 'event' ? (
                        <Calendar className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Tag className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-xs font-medium text-gray-500">
                        {post.category === 'event' ? '축제/이벤트' : '세일/할인'}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(post)}
                        className="p-1 h-auto"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(post.id)}
                        className="p-1 h-auto"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    {post.image_url && (
                      <div className="flex-shrink-0">
                        <img 
                          src={post.image_url} 
                          alt={post.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                      
                      <div className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {posts.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-gray-500">등록된 소식이 없습니다.</p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="p-4 bg-white rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">가입 회원 목록</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUsers}
                  disabled={usersLoading}
                >
                  {usersLoading ? "로딩 중..." : "새로고침"}
                </Button>
              </div>
              
              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">회원 정보를 불러오는 중...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setIsUserDetailOpen(true);
                      }}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {user.pet_image_url ? (
                          <img 
                            src={user.pet_image_url} 
                            alt={user.pet_name || "반려견"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-400">
                            <User className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.pet_name || "반려견 이름 미설정"}
                          </p>
                          {user.role === 'admin' && (
                            <Shield className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('ko-KR')} 가입
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {users.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">등록된 회원이 없습니다.</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* User Detail Dialog */}
            <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>회원 상세 정보</DialogTitle>
                </DialogHeader>
                
                {selectedUser && (
                  <div className="space-y-6">
                    {/* Profile Image */}
                    <div className="flex justify-center">
                      <div 
                        className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 cursor-pointer transition-transform hover:scale-105"
                        onClick={() => selectedUser.pet_image_url && setIsImageDialogOpen(true)}
                      >
                        {selectedUser.pet_image_url ? (
                          <img 
                            src={selectedUser.pet_image_url} 
                            alt={selectedUser.pet_name || "반려견"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-400">
                            <User className="w-10 h-10 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pet Information */}
                    <div className="space-y-4">
                      <div className="border-b pb-2">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">반려견 정보</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-gray-500">이름</Label>
                            <p className="text-sm font-medium">{selectedUser.pet_name || "미설정"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">나이</Label>
                            <p className="text-sm font-medium">{selectedUser.pet_age ? `${selectedUser.pet_age}살` : "미설정"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">성별</Label>
                            <p className="text-sm font-medium">
                              {selectedUser.pet_gender === 'male' ? '남아' : 
                               selectedUser.pet_gender === 'female' ? '여아' : '미설정'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">견종</Label>
                            <p className="text-sm font-medium">{selectedUser.pet_breed || "미설정"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Account Information */}
                      <div className="border-b pb-2">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">계정 정보</h4>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-gray-500">가입일</Label>
                            <p className="text-sm font-medium">
                              {new Date(selectedUser.created_at).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">현재 권한</Label>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium">
                                {selectedUser.role === 'admin' ? '관리자' : '일반 회원'}
                              </p>
                              {selectedUser.role === 'admin' && (
                                <Shield className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Role Management */}
                      {selectedUser.user_id !== currentUser?.id && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">권한 관리</h4>
                          <Select
                            value={selectedUser.role}
                            onValueChange={(value) => {
                              handleRoleChange(selectedUser.user_id, value);
                              setSelectedUser({ ...selectedUser, role: value });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">일반 회원</SelectItem>
                              <SelectItem value="admin">관리자</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsUserDetailOpen(false)}
                      >
                        닫기
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Image Enlargement Dialog */}
            <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
              <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
                <div className="relative">
                  {selectedUser?.pet_image_url && (
                    <img
                      src={selectedUser.pet_image_url}
                      alt="반려견 프로필 확대"
                      className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsImageDialogOpen(false)}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;