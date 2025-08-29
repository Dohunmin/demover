import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

const Footer = () => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <footer className="bg-background px-4 py-6 text-xs text-muted-foreground mt-auto mb-20 md:mb-6">
      <div className="max-w-4xl mx-auto space-y-4 md:px-0">
        {/* Footer Links */}
        <div className="flex justify-center gap-3 pb-4">
          <button className="hover:text-foreground transition-colors text-xs">
            이용약관
          </button>
          <span className="text-border">•</span>
          <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
            <DialogTrigger asChild>
              <button className="hover:text-foreground transition-colors text-xs">
                개인정보 처리방침
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>개인정보 처리방침 (카카오 간편가입 관련)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>챗메이드랩스</strong>(이하 "회사")는 「개인정보보호법」 등 관련 법령을 준수하며, 카카오 계정을 통한 회원가입 및 서비스 이용과 관련하여 다음과 같이 개인정보를 처리합니다.
                </p>
                
                <div>
                  <h3 className="font-semibold mb-2">1. 수집하는 개인정보 항목</h3>
                  <p className="mb-2">회사는 카카오 간편가입을 통해 아래와 같은 정보를 수집할 수 있습니다.</p>
                  <p><strong>필수 항목:</strong> 카카오 계정(이메일), 프로필 정보(성함, 닉네임, 프로필 사진)</p>
                  <p><strong>선택 항목:</strong> 카카오톡 채널 추가 여부</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2. 개인정보의 수집·이용 목적</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>회원 식별 및 본인 확인</li>
                    <li>서비스 가입, 로그인 및 이용 편의 제공</li>
                    <li>계정 관리 및 고객 상담 응대</li>
                    <li>맞춤형 서비스 제공 및 서비스 품질 향상</li>
                    <li>관련 법령에 따른 보관 의무 이행</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3. 개인정보의 보유 및 이용기간</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>회원 탈퇴 시 또는 동의 철회 시 즉시 파기</li>
                    <li>단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">4. 개인정보의 제3자 제공</h3>
                  <p>회사는 이용자의 동의 없이는 수집한 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 근거가 있는 경우 예외로 합니다.</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">5. 이용자의 권리와 행사 방법</h3>
                  <p className="mb-2">이용자는 언제든지 카카오 계정 연동 해제 및 개인정보 열람·정정·삭제를 요청할 수 있습니다.</p>
                  <p>요청은 고객센터 또는 sdi0@g.skku.edu로 접수 가능합니다.</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">6. 문의처</h3>
                  <p>개인정보보호책임자: 도훈민</p>
                  <p>연락처: 010-9262-2694</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <span className="text-border">•</span>
          <a href="mailto:sdi0@g.skku.edu" className="hover:text-foreground transition-colors text-xs">
            고객센터
          </a>
        </div>

        {/* Company Info - Clean minimal style like Knewnew */}
        <div className="space-y-2 text-center">
          <div className="text-xs text-muted-foreground">
            <span>챗메이드랩스</span>
            <span className="mx-2">•</span>
            <span>대표: 도훈민</span>
          </div>
          <div className="text-xs text-muted-foreground">
            사업자등록번호: 205-48-09670
          </div>
          <div className="text-xs text-muted-foreground">
            사업장 소재지: 경기도 수원시 장안구 율전로8번길 22
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground pt-2 text-center">
          ©2024 챗메이드랩스 ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
};

export default Footer;