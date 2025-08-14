import React from "react";

const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t px-6 py-4 text-xs text-muted-foreground mb-16">
      <div className="max-w-4xl mx-auto space-y-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>사업자등록번호: 205-48-09670</span>
          <span>상호: 챗메이드랩스</span>
          <span>대표: 도훈민</span>
        </div>
        <div>
          사업장 소재지: 경기도 수원시 장안구 율전로8번길 22
        </div>
        <div className="text-center pt-2">
          Copyright 2024 챗메이드랩스 All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;