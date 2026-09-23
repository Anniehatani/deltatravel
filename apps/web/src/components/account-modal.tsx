'use client';

import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { LiquidGlassBadge } from '@/components/ui/liquid-glass-badge';
import {
  User,
  Camera,
  Mail,
  Phone,
  Crown,
  Check,
  X,
  Upload,
  LogOut,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
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
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('0988 123 456');
  const [avatar, setAvatar] = useState<string>('');
  const [rawImage, setRawImage] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Avatar Adjustment (Căn chỉnh ảnh) states
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (user) {
      setName(user.name);
      if (typeof window !== 'undefined') {
        const storedAvatar =
          localStorage.getItem(`tour_avatar_${user.email}`) ||
          localStorage.getItem('tour_avatar') ||
          '';
        const storedPhone =
          localStorage.getItem(`tour_phone_${user.email}`) || '0988 123 456';
        setAvatar(storedAvatar);
        setRawImage(storedAvatar);
        setPhone(storedPhone);
      }
    }
  }, [user, isOpen]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Direct mouse & touch dragging on avatar preview
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAdjusting) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setPan({
      x: Math.max(-80, Math.min(80, newX)),
      y: Math.max(-80, Math.min(80, newY)),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isAdjusting || e.touches.length === 0) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStartRef.current.x;
    const newY = touch.clientY - dragStartRef.current.y;
    setPan({
      x: Math.max(-80, Math.min(80, newX)),
      y: Math.max(-80, Math.min(80, newY)),
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Apply crop into crisp 320x320 Canvas
  const applyCrop = useCallback((): string => {
    const source = rawImage || avatar;
    if (!source || typeof window === 'undefined') return avatar;

    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = source;

      const canvas = document.createElement('canvas');
      const size = 320;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return avatar;

      // Circular clipping mask
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, size, size);

      if (img.naturalWidth && img.naturalHeight) {
        const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight) * zoom;
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;

        const factor = size / 96; // 96px is h-24 w-24 preview
        const x = (size - w) / 2 + pan.x * factor;
        const y = (size - h) / 2 + pan.y * factor;

        ctx.drawImage(img, x, y, w, h);
        const cropped = canvas.toDataURL('image/jpeg', 0.92);
        setAvatar(cropped);
        setIsAdjusting(false);
        return cropped;
      }
    } catch (e) {
      console.warn('Canvas cropping exception:', e);
    }
    return avatar;
  }, [rawImage, avatar, zoom, pan]);

  if (!isOpen || !user) return null;

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setRawImage(reader.result);
          setAvatar(reader.result);
          setZoom(1.15);
          setPan({ x: 0, y: 0 });
          setIsAdjusting(true); // Open adjuster immediately on upload
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    let finalAvatar = avatar;
    if (isAdjusting) {
      finalAvatar = applyCrop();
    }

    if (typeof window !== 'undefined') {
      if (finalAvatar) {
        localStorage.setItem(`tour_avatar_${user.email}`, finalAvatar);
        localStorage.setItem('tour_avatar', finalAvatar);
        // Broadcast sync to navbar, AI assistant chat, and other listeners
        window.dispatchEvent(new Event('tour_avatar_updated'));
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
            accessToken:
              localStorage.getItem('tour_local_token') || 'local_token',
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
    }, 700);
  };

  return (
    <div
      className="fixed inset-0 z-[20000] flex items-center justify-center p-4 sm:p-6 bg-black/30 backdrop-blur-[7px] animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="liquid-modal-glass relative w-full max-w-lg rounded-[32px] overflow-hidden p-6 sm:p-8 md:p-9 text-black z-[20001] animate-fade-in-scale select-none max-h-[92vh] overflow-y-auto"
        style={{
          boxShadow:
            '0 30px 80px -15px rgba(0, 0, 0, 0.22), inset 0 1.5px 2px 0 rgba(255, 255, 255, 1), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Optical Light Scattering */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay z-0"
          style={{
            background:
              'radial-gradient(ellipse at 35% 15%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%)',
          }}
        />

        {/* Top Glare Beam */}
        <div className="absolute inset-x-4 top-1 h-32 rounded-t-[28px] bg-gradient-to-b from-white/70 via-white/10 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/95 to-transparent pointer-events-none z-20" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('acc_title')}
          className="group/close absolute top-5 right-5 sm:top-6 sm:right-6 h-9 w-9 rounded-full flex items-center justify-center text-neutral-600 hover:text-black bg-white/70 hover:bg-white border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md z-30 transition-all duration-300"
        >
          <X className="h-4 w-4 transition-transform duration-300 group-hover/close:rotate-90 group-hover/close:scale-110" />
        </button>

        {/* Header */}
        <div className="relative z-20 text-center mb-6">
          <div className="mb-2 flex justify-center">
            <LiquidGlassBadge
              variant="gold"
              size="sm"
              icon={<Crown className="h-3.5 w-3.5 text-amber-600" />}
            >
              {t('acc_vip_badge')}
            </LiquidGlassBadge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black uppercase">
            {t('acc_title')}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-sm mx-auto font-normal leading-relaxed">
            {t('acc_desc')}
          </p>
        </div>

        {/* ─── Avatar Section with Real-Time Draggable Cropper ─── */}
        <div className="relative z-20 flex flex-col items-center mb-6">
          <div className="relative group/avatar">
            <div
              className="p-1 rounded-full shadow-[0_10px_28px_-4px_rgba(0,0,0,0.18)]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(251,191,36,0.7) 50%, rgba(255,255,255,0.9) 100%)',
              }}
            >
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`h-24 w-24 rounded-full overflow-hidden relative bg-neutral-900 flex items-center justify-center border border-white/60 select-none ${
                  isAdjusting ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'
                }`}
              >
                {avatar ? (
                  <img
                    src={rawImage || avatar}
                    alt={user.name}
                    draggable={false}
                    className="max-w-none select-none pointer-events-none transition-transform duration-75"
                    style={{
                      transform: isAdjusting
                        ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                        : undefined,
                      transformOrigin: 'center center',
                      width: '100%',
                      height: '100%',
                      objectFit: isAdjusting ? 'cover' : 'cover',
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-2xl drop-shadow-md">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}

                {/* Hover overlay if not adjusting */}
                {!isAdjusting && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white text-[10px] font-bold"
                  >
                    <Camera className="h-5 w-5 mb-0.5 text-amber-300" />
                    <span>{t('acc_change_avatar')}</span>
                  </button>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Quick Upload Action Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-black text-white flex items-center justify-center shadow-lg border border-white/80 hover:scale-110 transition-transform duration-300 z-30"
              title={t('acc_upload_hint')}
            >
              <Upload className="h-3.5 w-3.5 text-amber-300" />
            </button>
          </div>

          {/* Toggle Adjuster Button */}
          {avatar && (
            <button
              type="button"
              onClick={() => {
                if (!rawImage && avatar) setRawImage(avatar);
                setIsAdjusting(!isAdjusting);
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.04] hover:bg-black/[0.08] border border-black/10 text-[11px] font-bold text-neutral-800 transition"
            >
              <SlidersHorizontal className="h-3 w-3 text-amber-600" />
              <span>{isAdjusting ? t('acc_adjust_btn_hide') : t('acc_adjust_btn_show')}</span>
            </button>
          )}

          {/* ─── Dedicated Interactive Avatar Cropping & Alignment Panel ─── */}
          {isAdjusting && (
            <div className="w-full mt-3 p-4 rounded-2xl bg-black/[0.03] border border-amber-300/40 space-y-3 animate-fade-in shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                <span className="flex items-center gap-1 text-amber-800">
                  <Move className="h-3.5 w-3.5" />
                  {t('acc_adjust_drag_hint')}
                </span>
                <span className="font-mono text-neutral-500">{zoom.toFixed(1)}x</span>
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-2.5">
                <ZoomOut className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-amber-500 h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                  title="Thu phóng"
                />
                <ZoomIn className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              </div>

              {/* Vertical Pan (Dọc) Slider */}
              <div className="flex items-center gap-2 text-[10px] font-semibold text-neutral-600">
                <span className="w-16 shrink-0">{t('acc_adjust_vert')}</span>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  value={pan.y}
                  onChange={(e) => setPan((prev) => ({ ...prev, y: parseInt(e.target.value, 10) }))}
                  className="flex-1 accent-amber-500 h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                  title="Căn chỉnh vị trí trên/dưới"
                />
                <span className="w-8 text-right font-mono text-neutral-500">{pan.y}</span>
              </div>

              {/* Horizontal Pan (Ngang) Slider */}
              <div className="flex items-center gap-2 text-[10px] font-semibold text-neutral-600">
                <span className="w-16 shrink-0">{t('acc_adjust_horiz')}</span>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  value={pan.x}
                  onChange={(e) => setPan((prev) => ({ ...prev, x: parseInt(e.target.value, 10) }))}
                  className="flex-1 accent-amber-500 h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                  title="Căn chỉnh vị trí trái/phải"
                />
                <span className="w-8 text-right font-mono text-neutral-500">{pan.x}</span>
              </div>

              {/* Adjustment Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-500 hover:text-black transition"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t('acc_adjust_reset')}</span>
                </button>

                <button
                  type="button"
                  onClick={applyCrop}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition shadow-sm"
                >
                  <Check className="h-3 w-3" />
                  <span>{t('acc_adjust_apply')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Preset Avatar Selection */}
          {!isAdjusting && (
            <div className="mt-3.5 flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-600 mr-1">
                {t('acc_preset_hint')}
              </span>
              {PRESET_AVATARS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setRawImage(preset);
                    setAvatar(preset);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className={`h-7 w-7 rounded-full overflow-hidden border transition-all duration-300 hover:scale-110 ${
                    avatar === preset
                      ? 'border-amber-500 scale-110 ring-2 ring-amber-400 shadow-md'
                      : 'border-white/80 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset}
                    alt={`Preset ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── User Information Form ─── */}
        <div className="relative z-20 space-y-3">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-800 block mb-1">
              {t('acc_name_label')}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('acc_name_placeholder')}
                className="liquid-glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-black placeholder:text-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-800 block mb-1">
              {t('acc_email_label')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/[0.04] border border-black/[0.08] text-xs sm:text-sm font-medium text-neutral-600 cursor-not-allowed select-text"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-800 block mb-1">
              {t('acc_phone_label')}
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('acc_phone_placeholder')}
                className="liquid-glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-black placeholder:text-neutral-400"
              />
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {savedSuccess && (
          <div className="relative z-20 mt-4 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 justify-center animate-fade-in shadow-sm">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{t('acc_save_success')}</span>
          </div>
        )}

        {/* ─── Action Buttons ─── */}
        <div className="relative z-20 mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-6 rounded-full bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-neutral-800 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="h-4 w-4 text-amber-300" />
            <span>{t('acc_btn_save')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              void logout();
              onClose();
            }}
            className="py-3 px-5 rounded-full text-xs font-bold text-red-600 bg-red-500/10 hover:bg-red-500/20 border border-red-200/80 shadow-sm transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 text-red-500" />
            <span>{t('acc_btn_logout')}</span>
          </button>
        </div>

        {/* Admin Portal Shortcut if Admin / Operations */}
        {(user.role === 'ADMIN' || user.role === 'OPERATIONS' || user.email?.includes('admin')) && (
          <div className="relative z-20 mt-4 pt-3.5 border-t border-black/[0.08]">
            <Link
              href="/admin"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-full bg-amber-50 hover:bg-amber-100/90 border border-amber-300/80 text-amber-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-xs hover:scale-[1.01]"
            >
              <Crown className="h-4 w-4 text-amber-600" />
              <span>{t('admin_portal_btn')}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
