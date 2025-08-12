import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
}

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'event' as 'event' | 'sale'
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    checkAdminRole();
    fetchPosts();
  }, [user, navigate]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
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
      const { data, error } = await supabase
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      if (editingPost) {
        // Update existing post
        const { error } = await supabase
          .from('news_posts')
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPost.id);

        if (error) throw error;
        toast.success('소식이 수정되었습니다.');
      } else {
        // Create new post
        const { error } = await supabase
          .from('news_posts')
          .insert({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            author_id: user.id
          });

        if (error) throw error;
        toast.success('새 소식이 등록되었습니다.');
      }

      // Reset form and close dialog
      setFormData({ title: '', content: '', category: 'event' });
      setEditingPost(null);
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
    setIsDialogOpen(true);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
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

  const resetForm = () => {
    setFormData({ title: '', content: '', category: 'event' });
    setEditingPost(null);
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
            <p className="text-purple-100 text-sm">소식 관리</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-5 space-y-6">
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
              
              <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.content}</p>
              
              <div className="text-xs text-gray-400">
                {new Date(post.created_at).toLocaleDateString('ko-KR')}
              </div>
            </Card>
          ))}
          
          {posts.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-gray-500">등록된 소식이 없습니다.</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;