import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CommunityPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const CommunityPostModal = ({ isOpen, onClose, onPostCreated }: CommunityPostModalProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [postType, setPostType] = useState("general");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOpen, onClose]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrl = null;
      if (imageFile) {
        uploadedImageUrl = await uploadImage(imageFile);
        if (!uploadedImageUrl) {
          toast.error("이미지 업로드에 실패했습니다");
          return;
        }
      }

      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          location_name: locationName.trim() || null,
          location_address: locationAddress.trim() || null,
          post_type: postType,
          image_url: uploadedImageUrl,
          is_anonymous: isAnonymous
        });

      if (error) {
        throw error;
      }

      toast.success("글이 작성되었습니다!");
      handleClose();
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error("글 작성 중 오류가 발생했습니다");
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
    setIsAnonymous(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto max-h-[85dvh] overflow-y-auto touch-pan-y overscroll-contain">
        <DialogHeader>
          <DialogTitle>커뮤니티 글 작성</DialogTitle>
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
              autoFocus={false}
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
              autoFocus={false}
            />
          </div>

          <div>
            <Label htmlFor="locationName">장소명 (선택)</Label>
            <Input
              id="locationName"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="강아지 동반 가능한 장소명"
              autoFocus={false}
            />
          </div>

          <div>
            <Label htmlFor="locationAddress">주소 (선택)</Label>
            <Input
              id="locationAddress"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="장소 주소"
              autoFocus={false}
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

          <div className="flex items-center justify-between">
            <Label htmlFor="anonymous">익명으로 작성</Label>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
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
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex-1"
            >
              {isSubmitting ? "작성 중..." : "작성하기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityPostModal;