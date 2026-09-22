'use client';
import { useEffect, useState } from 'react';
import type { Schedule } from '@tour/shared';
import { scheduleApi } from '@/lib/api';
export function useAvailability(scheduleId?: string) {
  const [data, setData] = useState<Schedule | null>(null),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!scheduleId) return;
    setData(null);
    setError(null);
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const value = await scheduleApi.availability(scheduleId, controller.signal);
        if (!controller.signal.aborted) {
          setData(value);
          setError(null);
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Không thể kiểm tra chỗ');
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 3000);
      }
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [scheduleId]);
  return { data, error };
}
