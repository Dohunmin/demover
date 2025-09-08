import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  location_name?: string;
  location_address?: string;
  post_type: string;
}

interface CommunityPostEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: () => void;
  post: CommunityPost | null;
}

const CommunityPostEditModal = ({ isOpen, onClose, onPostUpdated, post }: CommunityPostEditModalProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [postType, setPostType] = useState("general");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setLocationName(post.location_name || "");
      setLocationAddress(post.location_address || "");
      setPostType(post.post_type);
      setCurrentImageUrl(post.image_url || "");
      setImageUrl(post.image_url || "");
    }
  }, [post]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl("");
    setCurrentImageUrl("");
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('community-posts')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('community-posts')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const deleteOldImage = async (imageUrl: string) => {
    try {
      if (imageUrl && imageUrl.includes('community-posts')) {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${user?.id}/${fileName}`;
        
        await supabase.storage
          .from('community-posts')
          .remove([filePath]);
      }
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !post) {
      toast.error("로그인이 필요합니다");
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = currentImageUrl;

      if (imageFile) {
        // Delete old image if exists
        if (currentImageUrl) {
          await deleteOldImage(currentImageUrl);
        }
        
        // Upload new image
        const uploadedImageUrl = await uploadImage(imageFile);
        if (!uploadedImageUrl) {
          toast.error("이미지 업로드에 실패했습니다");
          return;
        }
        finalImageUrl = uploadedImageUrl;
      } else if (!imageUrl && currentImageUrl) {
        // Image was removed
        await deleteOldImage(currentImageUrl);
        finalImageUrl = null;
      }

      const { error } = await supabase
        .from('community_posts')
        .update({
          title: title.trim(),
          content: content.trim(),
          location_name: locationName.trim() || null,
          location_address: locationAddress.trim() || null,
          post_type: postType,
          image_url: finalImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (error) {
        throw error;
      }

      toast.success("글이 수정되었습니다!");
      handleClose();
      onPostUpdated();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error("글 수정 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setLocationName("");
    setLocationAddress("");
    setPostType("general");
    setImageFile(null);
    setImageUrl("");
    setCurrentImageUrl("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>커뮤니티 글 수정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="postType">글 유형</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger>
                <SelectValue placeholder="글 유형을 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">일반</SelectItem>
                <SelectItem value="recommendation">추천</SelectItem>
                <SelectItem value="question">질문</SelectItem>
                <SelectItem value="review">후기</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력해주세요"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력해주세요"
              rows={4}
              maxLength={1000}
            />
          </div>

          <div>
            <Label htmlFor="locationName">장소명 (선택)</Label>
            <Input
              id="locationName"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="강아지 동반 가능한 장소명"
            />
          </div>

          <div>
            <Label htmlFor="locationAddress">주소 (선택)</Label>
            <Input
              id="locationAddress"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="장소 주소"
            />
          </div>

          <div>
            <Label>사진 (선택)</Label>
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">사진 추가하기</p>
                </label>
              </div>
            )}
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
              disabled={isSubmitting || !title.trim() || !content.trim()}
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

export default CommunityPostEditModal;