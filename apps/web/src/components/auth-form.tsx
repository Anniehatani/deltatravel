'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { Button } from './ui/button';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';

interface AuthFormProps {
  register?: boolean;
  forgot?: boolean;
}

export function AuthForm({ register = false, forgot = false }: AuthFormProps) {
  const { accept } = useAuth();
  const { t, lang } = useLanguage();
  const router = useRouter();

  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(
    forgot ? 'forgot' : register ? 'register' : 'login',
  );

  // Common Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Forgot Password Fields
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Status
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleCopyOtp = () => {
    if (sentOtp) {
      navigator.clipboard.writeText(sentOtp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  // Submit Handler
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    // ─── REGISTER FLOW ───
    if (mode === 'register') {
      if (!name.trim()) {
        setError(lang === 'en' ? 'Please enter your full name.' : 'Vui lòng nhập họ và tên của bạn.');
        return;
      }
      if (!email.trim()) {
        setError(lang === 'en' ? 'Please enter a valid email address.' : 'Vui lòng nhập địa chỉ email hợp lệ.');
        return;
      }
      if (password.length < 6) {
        setError(lang === 'en' ? 'Password must be at least 6 characters.' : 'Mật khẩu phải có tối thiểu 6 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setError(
          lang === 'en'
            ? 'Passwords do not match. Please re-check.'
            : 'Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại.',
        );
        return;
      }

      setBusy(true);
      try {
        const input = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        };
        const result = await authApi.register(input);
        accept(result);

        if (result.user.role === 'ADMIN' || result.user.role === 'OPERATIONS') {
          router.push('/admin');
        } else {
          router.push('/tours');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Đăng ký tài khoản không thành công.');
      } finally {
        setBusy(false);
      }
      return;
    }

    // ─── LOGIN FLOW ───
    if (mode === 'login') {
      if (!email.trim()) {
        setError(lang === 'en' ? 'Please enter your email.' : 'Vui lòng nhập địa chỉ email.');
        return;
      }
      if (!password) {
        setError(lang === 'en' ? 'Please enter your password.' : 'Vui lòng nhập mật khẩu.');
        return;
      }

      setBusy(true);
      try {
        const result = await authApi.login({
          email: email.trim().toLowerCase(),
          password,
        });
        accept(result);

        if (result.user.role === 'ADMIN' || result.user.role === 'OPERATIONS') {
          router.push('/admin');
        } else {
          router.push('/tours');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Đăng nhập không thành công. Vui lòng kiểm tra email và mật khẩu.');
      } finally {
        setBusy(false);
      }
      return;
    }

    // ─── FORGOT PASSWORD FLOW ───
    if (mode === 'forgot') {
      // Step 1: Request OTP
      if (forgotStep === 1) {
        if (!email.trim() || !email.includes('@')) {
          setError(lang === 'en' ? 'Please enter a valid email address.' : 'Vui lòng nhập địa chỉ email hợp lệ.');
          return;
        }

        setBusy(true);
        try {
          const res = await authApi.requestPasswordReset(email.trim().toLowerCase());
          setSentOtp(res.code);
          setForgotStep(2);
          setSuccess(
            lang === 'en'
              ? `Verification code has been sent to ${email.trim()} (valid for 10 minutes).`
              : `Mã xác thực 6 số đã được gửi tới email ${email.trim()} (hiệu lực 10 phút).`,
          );
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Chưa thể gửi mã xác nhận. Vui lòng thử lại sau.');
        } finally {
          setBusy(false);
        }
        return;
      }

      // Step 2: Verify OTP & Set New Password
      if (forgotStep === 2) {
        if (!otpCode.trim() || otpCode.trim().length !== 6) {
          setError(
            lang === 'en'
              ? 'Please enter the 6-digit verification code.'
              : 'Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP.',
          );
          return;
        }
        if (newPassword.length < 6) {
          setError(
            lang === 'en'
              ? 'New password must be at least 6 characters.'
              : 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
          );
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setError(
            lang === 'en'
              ? 'New passwords do not match. Please re-check.'
              : 'Mật khẩu mới nhập lại không khớp. Vui lòng kiểm tra lại.',
          );
          return;
        }

        setBusy(true);
        try {
          await authApi.resetPassword({
            email: email.trim().toLowerCase(),
            code: otpCode.trim(),
            newPassword,
          });

          setSuccess(
            lang === 'en'
              ? 'Password reset successfully! Logging you in...'
              : 'Đặt lại mật khẩu thành công! Đang tự động đăng nhập...',
          );

          // Auto login with new password
          const result = await authApi.login({
            email: email.trim().toLowerCase(),
            password: newPassword,
          });
          accept(result);

          setTimeout(() => {
            if (result.user.role === 'ADMIN' || result.user.role === 'OPERATIONS') {
              router.push('/admin');
            } else {
              router.push('/tours');
            }
          }, 800);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Không thể đặt lại mật khẩu.');
        } finally {
          setBusy(false);
        }
      }
    }
  }

  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-7 sm:p-9 md:p-10 shadow-luxury max-w-md mx-auto">
      {/* ─── TITLE & SUBTITLE ─── */}
      <div className="text-center mb-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 block mb-1">
          {t('auth_member_system')}
        </span>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          {mode === 'register'
            ? lang === 'en'
              ? 'Create Account'
              : 'Tạo Tài Khoản Mới'
            : mode === 'forgot'
            ? lang === 'en'
              ? 'Reset Password'
              : 'Khôi Phục Mật Khẩu'
            : lang === 'en'
            ? 'Welcome Back'
            : 'Chào Mừng Trở Lại'}
        </h2>
        <p className="mt-1.5 text-xs text-stone-500">
          {mode === 'register'
            ? lang === 'en'
              ? 'Sign up to manage your bookings and unlock exclusive member rates'
              : 'Đăng ký để quản lý đơn đặt vé và nhận các ưu đãi hành trình độc quyền'
            : mode === 'forgot'
            ? lang === 'en'
              ? 'Enter your registered email to receive a 6-digit verification code'
              : 'Nhập email đã đăng ký để nhận mã xác thực OTP 6 số và đặt lại mật khẩu'
            : lang === 'en'
            ? 'Sign in to access your itinerary and reservations'
            : 'Đăng nhập vào tài khoản DELTA TRAVEL để quản lý hành trình'}
        </p>
      </div>

      {/* ─── FORM (noValidate disables browser native English validation bubbles) ─── */}
      <form onSubmit={submit} noValidate className="space-y-4">
        {/* Name (Only in Register mode) */}
        {mode === 'register' && (
          <div>
            <label htmlFor="name" className="text-xs font-bold text-stone-800 block mb-1">
              Họ và tên của bạn *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Ví dụ: Nguyễn Văn An"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 transition"
              />
            </div>
          </div>
        )}

        {/* Email (Shown in all modes, read-only if in forgot step 2) */}
        {!(mode === 'forgot' && forgotStep === 2) && (
          <div>
            <label htmlFor="email" className="text-xs font-bold text-stone-800 block mb-1">
              Địa chỉ email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 transition"
              />
            </div>
          </div>
        )}

        {/* Password (Login and Register) */}
        {mode !== 'forgot' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="text-xs font-bold text-stone-800">
                Mật khẩu *
              </label>
              {mode === 'register' && (
                <span className="text-[10px] text-amber-700 font-semibold">Tối thiểu 6 ký tự</span>
              )}
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    resetMessages();
                    setForgotStep(1);
                  }}
                  className="text-[11px] font-semibold text-amber-800 hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 transition"
              />
            </div>
          </div>
        )}

        {/* Confirm Password (Register mode only) */}
        {mode === 'register' && (
          <div>
            <label htmlFor="confirmPassword" className="text-xs font-bold text-stone-800 block mb-1">
              Nhập lại mật khẩu *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu vừa đặt"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 transition"
              />
            </div>
          </div>
        )}

        {/* ─── FORGOT STEP 2 FIELDS ─── */}
        {mode === 'forgot' && forgotStep === 2 && (
          <div className="space-y-3.5 pt-1">
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email xác thực: {email}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    resetMessages();
                  }}
                  className="text-[11px] underline text-amber-800 hover:text-black"
                >
                  Đổi email
                </button>
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                Vui lòng kiểm tra hộp thư (hoặc mục Spam). Nhập mã 6 chữ số bên dưới để đặt lại mật khẩu.
              </p>
            </div>

            {/* Simulated Live OTP Copy helper for instant testing */}
            {sentOtp && (
              <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-between">
                <div className="text-[11px] text-stone-700">
                  <span>Mã OTP của bạn: </span>
                  <strong className="font-mono text-xs text-stone-950 font-bold ml-1 tracking-widest">
                    {sentOtp}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOtp}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-stone-300 text-[10px] font-bold text-stone-800 hover:bg-stone-50 transition active:scale-95"
                >
                  {copiedOtp ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedOtp ? 'Đã chép' : 'Sao chép mã'}</span>
                </button>
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label htmlFor="otpCode" className="text-xs font-bold text-stone-800 block mb-1">
                Mã xác thực OTP (6 chữ số) *
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập 6 số (ví dụ: 123456)"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-4 py-2.5 text-xs text-stone-900 font-mono tracking-widest text-center font-bold focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 transition"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="newPassword" className="text-xs font-bold text-stone-800">
                  Mật khẩu mới *
                </label>
                <span className="text-[10px] text-amber-700 font-semibold">Tối thiểu 6 ký tự</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Đặt mật khẩu mới"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 transition"
                />
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmNewPassword" className="text-xs font-bold text-stone-800 block mb-1">
                Nhập lại mật khẩu mới *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── ERROR & SUCCESS MESSAGES ─── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{success}</span>
          </div>
        )}

        {/* ─── SUBMIT BUTTON ─── */}
        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl shadow-md text-xs font-bold uppercase tracking-wider transition active:scale-[0.99] cursor-pointer"
        >
          {busy
            ? 'Đang xử lý...'
            : mode === 'register'
            ? 'Tạo tài khoản ngay'
            : mode === 'forgot'
            ? forgotStep === 1
              ? 'Gửi mã xác nhận qua email'
              : 'Xác nhận đặt lại mật khẩu'
            : 'Đăng nhập ngay'}
        </Button>

        {/* ─── BOTTOM NAVIGATION SWITCHERS ─── */}
        <div className="pt-2 text-center text-xs text-stone-500 border-t border-stone-100 space-y-1.5">
          {mode === 'login' && (
            <div>
              <span>Chưa có tài khoản?</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  resetMessages();
                }}
                className="font-bold text-amber-800 hover:underline cursor-pointer"
              >
                Đăng ký tại đây
              </button>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <span>Đã có tài khoản?</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetMessages();
                }}
                className="font-bold text-amber-800 hover:underline cursor-pointer"
              >
                Đăng nhập tại đây
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetMessages();
                  setForgotStep(1);
                }}
                className="font-bold text-stone-700 hover:text-black hover:underline cursor-pointer"
              >
                ← Quay lại đăng nhập
              </button>
              {forgotStep === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    resetMessages();
                  }}
                  className="font-bold text-amber-800 hover:underline cursor-pointer"
                >
                  Gửi lại mã OTP
                </button>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
