import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl }: PasswordResetRequest = await req.json();

    console.log("Sending password reset email to:", email);

    const emailResponse = await resend.emails.send({
      from: "멍멍! 일단 출발해! <onboarding@resend.dev>",
      to: [email],
      subject: "비밀번호 재설정 요청",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">🐕 멍멍! 일단 출발해!</h1>
            <p style="color: #6b7280; margin: 0;">반려견과 함께하는 스마트한 여행</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">비밀번호 재설정</h2>
            <p style="color: #475569; margin-bottom: 25px; line-height: 1.6;">
              비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(to right, #2563eb, #4f46e5); 
                        color: white; 
                        text-decoration: none; 
                        padding: 15px 30px; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                비밀번호 재설정하기
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 25px; line-height: 1.5;">
              이 링크는 1시간 동안 유효합니다. 만약 비밀번호 재설정을 요청하지 않으셨다면, 
              이 이메일을 무시해주세요.
            </p>
          </div>
          
          <div style="text-align: center; color: #94a3b8; font-size: 12px;">
            <p>© 2025 멍멍! 일단 출발해! - 반려견과 함께하는 여행 플랫폼</p>
          </div>
        </div>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);