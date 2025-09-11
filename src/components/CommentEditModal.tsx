import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Comment {
  id: string;
  content: string;
  user_id: string;
}

interface CommentEditModalProps {
  comment: Comment | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentUpdated: () => void;
}

const CommentEditModal = ({ comment, isOpen, onClose, onCommentUpdated }: CommentEditModalProps) => {
  const [content, setContent] = useState(comment?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment) return;

    if (!content.trim()) {
      toast.error("댓글 내용을 입력해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('post_comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', comment.id);

      if (error) throw error;

      toast.success("댓글이 수정되었습니다!");
      onClose();
      onCommentUpdated();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error("댓글 수정 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent(comment?.content || "");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>댓글 수정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="댓글 내용을 입력해주세요..."
              rows={4}
              maxLength={500}
              className="w-full"
              autoFocus={false}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex-1"
            >
              {isSubmitting ? "수정 중..." : "수정하기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommentEditModal;