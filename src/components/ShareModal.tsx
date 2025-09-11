import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Copy, MessageCircle, Facebook, Twitter, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  url: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, content, url }) => {
  const copyToClipboard = async (text: string, type: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success(`${type}이(가) 클립보드에 복사되었습니다!`);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          toast.success(`${type}이(가) 클립보드에 복사되었습니다!`);
        } catch (err) {
          toast.error('복사에 실패했습니다.');
        }
        
        document.body.removeChild(textArea);
      }
    } catch (error) {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleCopyLink = () => {
    copyToClipboard(url, '링크');
  };

  const handleCopyAll = () => {
    const shareText = `${title}\n\n${content}\n\n${url}`;
    copyToClipboard(shareText, '내용');
  };

  const handleKakaoShare = () => {
    // 카카오톡 공유 (실제 구현 시 카카오 SDK 필요)
    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(kakaoUrl, '_blank', 'width=500,height=500');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `${title} - ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
          url: url,
        });
      } else {
        toast.error('이 브라우저에서는 네이티브 공유를 지원하지 않습니다.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('공유에 실패했습니다.');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            공유하기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 네이티브 공유 (모바일에서 주로 사용) */}
          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              className="w-full justify-start gap-3 h-12"
              variant="outline"
            >
              <Share2 className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">앱으로 공유</div>
                <div className="text-xs text-muted-foreground">다른 앱으로 직접 공유</div>
              </div>
            </Button>
          )}

          {/* 소셜미디어 공유 */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={handleKakaoShare}
              className="flex flex-col gap-1 h-16 bg-yellow-400 hover:bg-yellow-500 text-gray-800"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">카카오</span>
            </Button>
            
            <Button
              onClick={handleFacebookShare}
              className="flex flex-col gap-1 h-16 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Facebook className="w-5 h-5" />
              <span className="text-xs">페이스북</span>
            </Button>
            
            <Button
              onClick={handleTwitterShare}
              className="flex flex-col gap-1 h-16 bg-blue-400 hover:bg-blue-500 text-white"
            >
              <Twitter className="w-5 h-5" />
              <span className="text-xs">트위터</span>
            </Button>
          </div>

          {/* 복사 옵션들 */}
          <div className="space-y-2">
            <Button
              onClick={handleCopyLink}
              className="w-full justify-start gap-3 h-12"
              variant="outline"
            >
              <Link2 className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">링크 복사</div>
                <div className="text-xs text-muted-foreground">URL만 클립보드에 복사</div>
              </div>
            </Button>
            
            <Button
              onClick={handleCopyAll}
              className="w-full justify-start gap-3 h-12"
              variant="outline"
            >
              <Copy className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium">전체 내용 복사</div>
                <div className="text-xs text-muted-foreground">제목, 내용, 링크 모두 복사</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;