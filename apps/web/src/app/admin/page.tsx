'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/tours');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center select-none">
      <div className="h-9 w-9 rounded-full border-2 border-stone-200 border-t-amber-500 animate-spin mb-4" />
      <h3 className="text-sm font-black uppercase tracking-wider text-stone-800">
        Đang mở Trung Tâm Quản Lý Tour
      </h3>
      <p className="mt-1 text-xs text-stone-500">
        Hệ thống tự động đưa bạn vào khu vực vận hành và quản lý danh mục...
      </p>
    </div>
  );
}
