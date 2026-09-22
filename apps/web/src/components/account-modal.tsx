'use client';

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useAuth } from '@/providers/auth-provider';
import {
  User,
  Camera,
  Mail,
  Phone,
  Crown,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Upload,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
];

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const { user, accept, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('0988 123 456');
  const [avatar, setAvatar] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      if (typeof window !== 'undefined') {
        const storedAvatar = localStorage.getItem(`tour_avatar_${user.email}`) || localStorage.getItem('tour_avatar') || '';
        const storedPhone = localStorage.getItem(`tour_phone_${user.email}`) || '0988 123 456';
        setAvatar(storedAvatar);
        setPhone(storedPhone);
      }
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      if (avatar) {
        localStorage.setItem(`tour_avatar_${user.email}`, avatar);
        localStorage.setItem('tour_avatar', avatar);
      }
      localStorage.setItem(`tour_phone_${user.email}`, phone);

      // Update user in local storage if fallback user exists
      const savedUserStr = localStorage.getItem('tour_local_user');
      if (savedUserStr) {
        try {
          const u = JSON.parse(savedUserStr);
          u.name = name.trim() || user.name;
          localStorage.setItem('tour_local_user', JSON.stringify(u));
          accept({
            accessToken: localStorage.getItem('tour_local_token') || 'local_token',
            expiresIn: 900,
            user: u,
          });
        } catch {}
      }
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg rounded-[32px] liquid-glass-card border border-white/80 p-8 md:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.25)] text-black animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 h-9 w-9 rounded-full liquid-glass-pill flex items-center justify-center text-neutral-600 hover:text-black hover:scale-105 transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header with VIP Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-pill text-[10px] font-black uppercase tracking-widest text-amber-800 mb-2 border border-amber-300/60 shadow-sm">
            <Crown className="h-3.5 w-3.5 text-amber-600" />
            <span>DELTA PRIVÉ • THÀNH VIÊN THƯỢNG LƯU</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-black">
            Quản Lý Tài Khoản
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Tùy chỉnh ảnh đại diện, thông tin định danh và quyền lợi khách hàng VIP.
          </p>
        </div>

        {/* Avatar Upload & Preview Section */}
        <div className="flex flex-col items-center mb-7">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-amber-300/80 shadow-[0_10px_25px_rgba(0,0,0,0.12)] relative bg-neutral-100 flex items-center justify-center">
              {avatar ? (
                <img
                  src={avatar}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-2xl">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              {/* Hover overlay to change avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold"
              >
                <Camera className="h-5 w-5 mb-0.5" />
                <span>Đổi ảnh</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Quick Upload Action Pill */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-black text-white flex items-center justify-center shadow-lg border border-white hover:scale-110 transition-transform"
              title="Tải ảnh lên từ máy tính"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Preset Avatar Selection */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[11px] font-bold text-neutral-500 mr-1">Gợi ý ảnh:</span>
            {PRESET_AVATARS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatar(preset)}
                className={`h-7 w-7 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${
                  avatar === preset ? 'border-amber-500 scale-110 ring-2 ring-amber-300' : 'border-white'
                }`}
              >
                <img src={preset} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* User Information Form */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700 block mb-1">
              Họ và tên
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-pill border border-neutral-200 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700 block mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-100/70 border border-neutral-200 text-xs font-medium text-neutral-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700 block mb-1">
              Số điện thoại liên hệ
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0988 123 456"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-pill border border-neutral-200 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {savedSuccess && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 justify-center animate-fade-in">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Đã cập nhật thông tin tài khoản thành công!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-6 rounded-full bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-neutral-800 transition-all hover:scale-[1.02] shadow-md flex items-center justify-center gap-2"
          >
            <Check className="h-3.5 w-3.5 text-amber-300" />
            <span>Lưu Thay Đổi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              void logout();
              onClose();
            }}
            className="py-3 px-5 rounded-full border border-neutral-200 liquid-glass-pill text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
