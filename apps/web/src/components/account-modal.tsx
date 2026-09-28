'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { LiquidGlassBadge } from '@/components/ui/liquid-glass-badge';
import { authApi, profileApi } from '@/lib/api';
import { getInitials } from '@/lib/format';
import {
  Camera,
  CheckCircle2,
  Crown,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const { user, updateUser, logout } = useAuth();
  const { t, lang } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl ?? null);
  }, [user?.avatarUrl, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setAvatarBusy(true);
    setAvatarError('');
    setAvatarMessage('');
    try {
      const updated = await profileApi.uploadAvatar(file);
      setAvatarUrl(updated.avatarUrl);
      updateUser(updated);
      setAvatarMessage(
        lang === 'en' ? 'Profile photo saved securely.' : 'Ảnh đại diện đã được lưu lên hệ thống.',
      );
    } catch (error) {
      setAvatarError(
        error instanceof Error
          ? error.message
          : lang === 'en'
            ? 'Unable to upload profile photo.'
            : 'Không thể tải ảnh đại diện.',
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarBusy(true);
    setAvatarError('');
    setAvatarMessage('');
    try {
      const updated = await profileApi.deleteAvatar();
      setAvatarUrl(updated.avatarUrl);
      updateUser(updated);
      setAvatarMessage(lang === 'en' ? 'Profile photo removed.' : 'Đã xóa ảnh đại diện.');
    } catch (error) {
      setAvatarError(
        error instanceof Error
          ? error.message
          : lang === 'en'
            ? 'Unable to remove profile photo.'
            : 'Không thể xóa ảnh đại diện.',
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!oldPassword) {
      setPwdError(
        lang === 'en' ? 'Please enter your current password.' : 'Vui lòng nhập mật khẩu hiện tại.',
      );
      return;
    }
    if (newPassword.length < 12) {
      setPwdError(
        lang === 'en'
          ? 'New password must contain at least 12 characters.'
          : 'Mật khẩu mới phải có tối thiểu 12 ký tự.',
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError(lang === 'en' ? 'New passwords do not match.' : 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (oldPassword === newPassword) {
      setPwdError(
        lang === 'en'
          ? 'The new password must differ from the current password.'
          : 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
      );
      return;
    }

    setPwdBusy(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setPwdSuccess(
        lang === 'en'
          ? 'Password changed successfully. Please sign in again.'
          : 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
      );
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      await logout();
      setTimeout(onClose, 700);
    } catch (error) {
      setPwdError(
        error instanceof Error
          ? error.message
          : lang === 'en'
            ? 'Unable to change password.'
            : 'Đổi mật khẩu không thành công.',
      );
    } finally {
      setPwdBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[7px]"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="liquid-modal-glass relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[32px] p-6 text-black shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={lang === 'en' ? 'Close' : 'Đóng'}
          className="absolute right-5 top-5 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/80 text-neutral-600 transition hover:bg-white hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 text-center">
          <div className="mb-2 flex justify-center">
            <LiquidGlassBadge
              variant="gold"
              size="sm"
              icon={<Crown className="h-3.5 w-3.5 text-amber-600" />}
            >
              {t('acc_vip_badge')}
            </LiquidGlassBadge>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">{t('acc_title')}</h2>
          <p className="mt-1 text-xs text-neutral-600">
            {lang === 'en'
              ? 'Your account data is synchronized with the DELTA TRAVEL server.'
              : 'Dữ liệu tài khoản được đồng bộ trực tiếp với máy chủ DELTA TRAVEL.'}
          </p>
        </div>

        <section className="mb-6 flex flex-col items-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-tr from-amber-500 to-amber-700 shadow-xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-black uppercase tracking-wider text-white">
                  {getInitials(user.name)}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={avatarBusy}
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-lg transition hover:scale-105 disabled:opacity-50"
              title={lang === 'en' ? 'Upload profile photo' : 'Tải ảnh đại diện'}
            >
              {avatarBusy ? (
                <Upload className="h-4 w-4 animate-pulse" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={avatarBusy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {lang === 'en' ? 'Upload photo' : 'Tải ảnh'}
            </button>
            {avatarUrl && (
              <button
                type="button"
                disabled={avatarBusy}
                onClick={handleRemoveAvatar}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {lang === 'en' ? 'Remove photo' : 'Xóa ảnh'}
              </button>
            )}
          </div>

          <p className="mt-2 text-center text-[10px] text-neutral-500">
            JPEG, PNG hoặc WebP, tối đa 2 MB.
          </p>
          {avatarMessage && (
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {avatarMessage}
            </p>
          )}
          {avatarError && <p className="mt-2 text-xs font-semibold text-red-700">{avatarError}</p>}
        </section>

        <section className="space-y-3 rounded-2xl border border-black/10 bg-white/65 p-4">
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-600">
              {lang === 'en' ? 'Full name' : 'Họ và tên'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                value={user.name}
                readOnly
                className="w-full rounded-xl border border-black/10 bg-black/[0.03] py-2.5 pl-10 pr-3 text-sm font-semibold text-black"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-600">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                value={user.email}
                readOnly
                className="w-full rounded-xl border border-black/10 bg-black/[0.03] py-2.5 pl-10 pr-3 text-sm font-medium text-neutral-700"
              />
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-neutral-500">
            {lang === 'en'
              ? 'Name and email editing are not enabled in the current backend contract.'
              : 'Phiên bản backend hiện tại chưa hỗ trợ sửa họ tên hoặc email, nên giao diện không giả lập việc lưu các trường này.'}
          </p>
        </section>

        <section className="mt-4 rounded-2xl border border-black/10 bg-white/65 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
              <KeyRound className="h-4 w-4 text-amber-600" />
              {lang === 'en' ? 'Change password' : 'Đổi mật khẩu'}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowPasswordSection((value) => !value);
                setPwdError('');
                setPwdSuccess('');
              }}
              className="text-[11px] font-bold text-amber-800 underline"
            >
              {showPasswordSection
                ? lang === 'en'
                  ? 'Collapse'
                  : 'Thu gọn'
                : lang === 'en'
                  ? 'Open'
                  : 'Mở'}
            </button>
          </div>

          {showPasswordSection && (
            <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
              {[
                {
                  value: oldPassword,
                  setter: setOldPassword,
                  label: lang === 'en' ? 'Current password' : 'Mật khẩu hiện tại',
                  autoComplete: 'current-password',
                },
                {
                  value: newPassword,
                  setter: setNewPassword,
                  label: lang === 'en' ? 'New password' : 'Mật khẩu mới',
                  autoComplete: 'new-password',
                },
                {
                  value: confirmNewPassword,
                  setter: setConfirmNewPassword,
                  label: lang === 'en' ? 'Confirm new password' : 'Nhập lại mật khẩu mới',
                  autoComplete: 'new-password',
                },
              ].map((field) => (
                <div key={field.label}>
                  <label className="mb-1 block text-[11px] font-bold text-neutral-800">
                    {field.label}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="password"
                      value={field.value}
                      onChange={(event) => field.setter(event.target.value)}
                      autoComplete={field.autoComplete}
                      className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-neutral-500">
                {lang === 'en'
                  ? 'New password must contain at least 12 characters.'
                  : 'Mật khẩu mới phải có tối thiểu 12 ký tự.'}
              </p>
              {pwdError && <p className="text-xs font-semibold text-red-700">{pwdError}</p>}
              {pwdSuccess && <p className="text-xs font-semibold text-emerald-700">{pwdSuccess}</p>}
              <button
                type="submit"
                disabled={pwdBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-black uppercase text-white disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                {pwdBusy
                  ? lang === 'en'
                    ? 'Saving...'
                    : 'Đang lưu...'
                  : lang === 'en'
                    ? 'Change password'
                    : 'Đổi mật khẩu'}
              </button>
            </form>
          )}
        </section>

        <button
          type="button"
          onClick={async () => {
            await logout();
            onClose();
          }}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-2.5 text-xs font-black uppercase text-neutral-800 transition hover:bg-black hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          {lang === 'en' ? 'Sign out' : 'Đăng xuất'}
        </button>
      </div>
    </div>
  );
}
