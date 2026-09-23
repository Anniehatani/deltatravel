'use client';

import { AuthForm } from '@/components/auth-form';
import { PageShell } from '@/components/page-shell';
import { useLanguage } from '@/providers/language-provider';

export default function ForgotPasswordPage() {
  const { lang } = useLanguage();
  return (
    <PageShell
      title={lang === 'en' ? 'Forgot Password' : 'Khôi Phục Mật Khẩu'}
      description={
        lang === 'en'
          ? 'Enter your email to receive a 6-digit verification code.'
          : 'Nhập email đã đăng ký để nhận mã xác thực (OTP) 6 số và đặt lại mật khẩu.'
      }
    >
      <AuthForm forgot />
    </PageShell>
  );
}
