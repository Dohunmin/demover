import React from 'react';

// URL을 감지하는 정규표현식
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

// 텍스트 내의 URL을 링크로 변환하는 함수
export const linkifyText = (text: string): React.ReactNode[] => {
  const parts = text.split(URL_REGEX);
  const matches = text.match(URL_REGEX) || [];
  
  const result: React.ReactNode[] = [];
  let matchIndex = 0;
  
  for (let i = 0; i < parts.length; i++) {
    // 텍스트 부분 추가
    if (parts[i]) {
      result.push(parts[i]);
    }
    
    // URL 부분을 링크로 변환
    if (matchIndex < matches.length && i < parts.length - 1) {
      const url = matches[matchIndex];
      result.push(
        <a
          key={`link-${matchIndex}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {url}
        </a>
      );
      matchIndex++;
    }
  }
  
  return result;
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