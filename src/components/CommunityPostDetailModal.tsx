import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, MapPin, Calendar, User, Trash2, X, Edit, MoreVertical, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CommentEditModal from "./CommentEditModal";

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

interface Comment {
  id: string;
  content: string;
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

interface CommunityPostDetailModalProps {
  post: CommunityPost | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (post: CommunityPost) => void;
  onDelete?: () => void;
}

const CommunityPostDetailModal = ({ post, isOpen, onClose, onEdit, onDelete }: CommunityPostDetailModalProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingLike, setIsSubmittingLike] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [showCommentEditModal, setShowCommentEditModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (post && isOpen) {
      fetchComments();
      fetchLikes();
    }
    if (user) {
      checkAdminRole();
    }
  }, [post, isOpen, user]);

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

  const fetchComments = async () => {
    if (!post) return;

    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', post.id)
        .eq('post_type', 'community')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles using safe public function
      const userIds = commentsData?.map(comment => comment.user_id) || [];
      const { data: profilesData } = await supabase
        .rpc('get_safe_public_profile_fields');

      // Combine comments with profiles
      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        profiles: profilesData?.find(profile => profile.user_id === comment.user_id)
      })) || [];

      setComments(commentsWithProfiles);
      setCommentsCount(commentsWithProfiles.length);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchLikes = async () => {
    if (!post) return;

    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', post.id)
        .eq('post_type', 'community');

      if (error) throw error;
      
      const likes = data || [];
      setLikesCount(likes.length);
      
      if (user) {
        setIsLiked(likes.some(like => like.user_id === user.id));
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !post) {
      toast.error("로그인이 필요합니다");
      return;
    }

    if (!newComment.trim()) {
      toast.error("댓글 내용을 입력해주세요");
      return;
    }

    setIsSubmittingComment(true);

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          post_type: 'community',
          user_id: user.id,
          content: newComment.trim(),
          is_anonymous: false // 기본값으로 익명이 아님
        });

      if (error) throw error;

      setNewComment("");
      toast.success("댓글이 작성되었습니다");
      fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error("댓글 작성 중 오류가 발생했습니다");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("댓글이 삭제되었습니다");
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error("댓글 삭제 중 오류가 발생했습니다");
    }
  };

  const handleToggleLike = async () => {
    if (!user || !post) {
      toast.error("로그인이 필요합니다");
      return;
    }

    setIsSubmittingLike(true);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('post_type', 'community')
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            post_type: 'community',
            user_id: user.id
          });

        if (error) throw error;
      }

      fetchLikes();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("좋아요 처리 중 오류가 발생했습니다");
    } finally {
      setIsSubmittingLike(false);
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'recommendation': return '추천';
      case 'question': return '질문';
      case 'review': return '후기';
      case 'general': 
      default: 
        return '일반';
    }
  };

  const handleDeletePost = async () => {
    if (!post || !user || !(user.id === post.user_id || isAdmin)) return;

    setIsDeleting(true);
    try {
      // Delete associated image if exists
      if (post.image_url && post.image_url.includes('community-posts')) {
        const urlParts = post.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${user.id}/${fileName}`;
        
        await supabase.storage
          .from('community-posts')
          .remove([filePath]);
      }

      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      toast.success("글이 삭제되었습니다!");
      onClose();
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error("글 삭제 중 오류가 발생했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left flex items-center justify-between">
            <div>
              <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-full text-xs mr-2">
                {getPostTypeLabel(post.post_type)}
              </span>
              {post.title}
            </div>
            <div className="flex items-center gap-2">
              {user && post && (user.id === post.user_id || isAdmin) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user.id === post.user_id && (
                      <DropdownMenuItem onClick={() => onEdit && onEdit(post)}>
                        <Edit className="w-4 h-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>글 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeletePost}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "삭제 중..." : "삭제"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 작성자 정보 */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={
                post.is_anonymous 
                  ? "/placeholder.svg" 
                  : (post.profiles?.pet_image_url || post.profiles?.avatar_url || "/placeholder.svg")
              } />
              <AvatarFallback>
                {post.is_anonymous 
                  ? '익' 
                  : ((post.profiles?.pet_name || post.profiles?.full_name)?.[0] || "사")
                }
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {post.is_anonymous 
                  ? '익명' 
                  : (post.profiles?.pet_name || post.profiles?.full_name || "사용자")
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>

          {/* 이미지 */}
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full rounded-lg max-h-64 object-cover"
            />
          )}

          {/* 내용 */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {post.content}
          </div>

          {/* 장소 정보 */}
          {post.location_name && (
            <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{post.location_name}</p>
                {post.location_address && (
                  <p className="text-xs text-muted-foreground">{post.location_address}</p>
                )}
              </div>
            </div>
          )}

          {/* 좋아요 및 댓글 버튼 */}
          <div className="flex items-center space-x-4 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleLike}
              disabled={isSubmittingLike}
              className={`flex items-center space-x-1 ${
                isLiked ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-xs">{likesCount}</span>
            </Button>
            <div className="flex items-center space-x-1 text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{commentsCount}</span>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarImage src={
                    comment.is_anonymous 
                      ? "/placeholder.svg" 
                      : (comment.profiles?.pet_image_url || comment.profiles?.avatar_url || "/placeholder.svg")
                  } />
                  <AvatarFallback className="text-xs">
                    {comment.is_anonymous 
                      ? '익' 
                      : ((comment.profiles?.pet_name || comment.profiles?.full_name)?.[0] || "사")
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {comment.is_anonymous 
                        ? '익명' 
                        : (comment.profiles?.pet_name || comment.profiles?.full_name || "사용자")
                      }
                    </p>
                    {user?.id === comment.user_id && (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingComment(comment);
                            setShowCommentEditModal(true);
                          }}
                          className="p-1 h-auto text-muted-foreground hover:text-blue-500"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 h-auto text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(comment.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 댓글 작성 */}
          {user && (
            <form onSubmit={handleSubmitComment} className="flex space-x-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성해주세요..."
                rows={2}
                className="flex-1 resize-none"
                maxLength={500}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingComment || !newComment.trim()}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </DialogContent>

      <CommentEditModal
        comment={editingComment}
        isOpen={showCommentEditModal}
        onClose={() => {
          setShowCommentEditModal(false);
          setEditingComment(null);
        }}
        onCommentUpdated={fetchComments}
      />
    </Dialog>
  );
};

export default CommunityPostDetailModal;