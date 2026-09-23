/**
 * High-Performance Luxury Asset Preloading & In-Memory Decoding Cache
 * Preloads 3D Hero video sequence frames and critical tour imagery
 * to eliminate scroll stutter, blank frames, and image loading lag.
 */

export const TOTAL_FRAMES = 150;

export function getFramePath(idx: number): string {
  const pad = idx.toString().padStart(3, '0');
  return `/frames/ezgif-frame-${pad}.png`;
}

// In-memory HTMLImageElement cache prevents garbage collection and ensures instant decode
export const frameCache = new Map<number, HTMLImageElement>();
export const imageCache = new Map<string, HTMLImageElement>();

export const CRITICAL_TOUR_IMAGES = [
  '/favicon_logo_delta.png',
  '/tour-ha-long.jpg',
  '/tour-hue.jpg',
  '/tour-phu-quoc.jpg',
  '/tour-da-nang.jpg',
  '/tour-ninh-binh.jpg',
  '/tour-sapa.jpg',
  '/tour-can-tho.jpg',
  '/tour-nha-trang.jpg',
  '/tour-tay-ninh.jpg',
];

// Essential frames needed for initial hero & earth zoom sequence (1 to 35 + key anchors)
export const INITIAL_CRITICAL_FRAMES = [
  ...Array.from({ length: 35 }, (_, i) => i + 1),
  45, 60, 75, 90, 105, 120, 135, 150,
];

export function preloadSingleImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    // If already in cache and complete, resolve immediately
    if (imageCache.has(src)) {
      const cached = imageCache.get(src)!;
      if (cached.complete) {
        resolve(cached);
        return;
      }
    }

    const img = new Image();
    img.src = src;

    if (img.complete) {
      imageCache.set(src, img);
      resolve(img);
      return;
    }

    img.onload = () => {
      imageCache.set(src, img);
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {}).finally(() => resolve(img));
      } else {
        resolve(img);
      }
    };

    img.onerror = () => {
      imageCache.set(src, img);
      resolve(img);
    };
  });
}

export function preloadFrame(frameIdx: number): Promise<HTMLImageElement> {
  const path = getFramePath(frameIdx);
  return preloadSingleImage(path).then((img) => {
    frameCache.set(frameIdx, img);
    return img;
  });
}

/**
 * Preload all critical initial assets while tracking progress (0 - 100)
 */
export function preloadCriticalAssets(
  onProgress?: (progress: number, loadedItem: string) => void
): Promise<void> {
  const allTasks: Array<{ type: 'frame' | 'image'; item: number | string }> = [
    ...INITIAL_CRITICAL_FRAMES.map((idx) => ({ type: 'frame' as const, item: idx })),
    ...CRITICAL_TOUR_IMAGES.map((path) => ({ type: 'image' as const, item: path })),
  ];

  const total = allTasks.length;
  let loaded = 0;

  return new Promise((resolve) => {
    if (total === 0) {
      onProgress?.(100, 'ready');
      resolve();
      return;
    }

    // Safety timeout: Never let preloader lock user for more than 3.5 seconds
    const safetyTimer = setTimeout(() => {
      onProgress?.(100, 'timeout_continue');
      resolve();
    }, 3500);

    const updateProgress = (name: string) => {
      loaded++;
      const pct = Math.min(100, Math.round((loaded / total) * 100));
      onProgress?.(pct, name);
      if (loaded >= total) {
        clearTimeout(safetyTimer);
        resolve();
      }
    };

    allTasks.forEach((task) => {
      if (task.type === 'frame') {
        preloadFrame(task.item as number).finally(() => {
          updateProgress(`Khung hình 3D #${task.item}`);
        });
      } else {
        preloadSingleImage(task.item as string).finally(() => {
          updateProgress(`Hình ảnh ${(task.item as string).split('/').pop()}`);
        });
      }
    });
  });
}

let backgroundPreloadStarted = false;

/**
 * Seamlessly preloads remaining frames in low-priority idle intervals
 * to ensure 100% zero-stutter during deep scroll.
 */
export function startBackgroundFramePreload() {
  if (typeof window === 'undefined' || backgroundPreloadStarted) return;
  backgroundPreloadStarted = true;

  // Identify all frames not yet preloaded
  const remainingFrames: number[] = [];
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    if (!frameCache.has(i)) {
      remainingFrames.push(i);
    }
  }

  let idx = 0;
  const loadBatch = () => {
    // Process 3 frames per batch to avoid network saturation
    const batch = remainingFrames.slice(idx, idx + 3);
    if (batch.length === 0) return;

    idx += 3;
    Promise.all(batch.map((f) => preloadFrame(f))).then(() => {
      if (idx < remainingFrames.length) {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(loadBatch, { timeout: 100 });
        } else {
          setTimeout(loadBatch, 30);
        }
      }
    });
  };

  // Give the UI a short moment to settle before initiating background frame cache
  setTimeout(loadBatch, 300);
}
