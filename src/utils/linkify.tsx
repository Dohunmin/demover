import React from 'react';

// URL을 감지하는 정규표현식 (더 포괄적이고 정확한 패턴)
const URL_REGEX = /(https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/[^\s]*)?)/g;

// 텍스트 내의 URL을 링크로 변환하는 함수
export const linkifyText = (text: string): React.ReactNode[] => {
  const parts = text.split(URL_REGEX);
  
  return parts.map((part, index) => {
    // 새로운 정규표현식 인스턴스로 테스트 (global flag 문제 해결)
    const urlTest = /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/[^\s]*)?$/.test(part);
    
    if (urlTest) {
      // URL인 경우 링크로 변환
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {part}
        </a>
      );
    }
    // 일반 텍스트인 경우 그대로 반환
    return part;
  }).filter(part => part !== ''); // 빈 문자열 제거
};

// 여러 줄 텍스트에 대해 linkify 적용
export const linkifyMultilineText = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      {linkifyText(line)}
      {lineIndex < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};