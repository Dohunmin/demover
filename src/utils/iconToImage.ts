import html2canvas from 'html2canvas';
import { LucideIcon } from 'lucide-react';

export interface CategoryIconData {
  id: string;
  label: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

// 아이콘 컴포넌트를 이미지로 변환하는 함수
export const createMarkerImageFromIcon = async (
  iconData: CategoryIconData,
  size: number = 32
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // 임시 div 요소 생성
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = `${size}px`;
      tempDiv.style.height = `${size}px`;
      
      // 마커 스타일 적용
      tempDiv.innerHTML = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${iconData.bgColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          <div style="
            width: ${size * 0.5}px;
            height: ${size * 0.5}px;
            color: ${iconData.iconColor};
          ">
            <!-- 아이콘은 별도로 렌더링 -->
          </div>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      // html2canvas로 이미지 생성
      html2canvas(tempDiv, {
        width: size,
        height: size,
        backgroundColor: null,
        scale: 2 // 고해상도
      }).then(canvas => {
        const imageUrl = canvas.toDataURL('image/png');
        document.body.removeChild(tempDiv);
        resolve(imageUrl);
      }).catch(error => {
        document.body.removeChild(tempDiv);
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};

// 테스트용 간단한 버전
export const createSimpleMarkerImage = async (
  bgColor: string,
  text: string,
  size: number = 32
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      
      tempDiv.innerHTML = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${bgColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          font-size: ${size * 0.4}px;
          font-weight: bold;
          color: white;
        ">${text}</div>
      `;
      
      document.body.appendChild(tempDiv);
      
      html2canvas(tempDiv, {
        width: size,
        height: size,
        backgroundColor: null,
        scale: 2
      }).then(canvas => {
        const imageUrl = canvas.toDataURL('image/png');
        document.body.removeChild(tempDiv);
        console.log('Generated marker image:', imageUrl.substring(0, 50) + '...');
        resolve(imageUrl);
      }).catch(error => {
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};