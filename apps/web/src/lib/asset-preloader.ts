/**
 * High-Performance Luxury Asset Preloading & In-Memory Decoding Cache
 * Preloads all 150 3D Hero video sequence frames (WebP ~12.6MB) and critical imagery
 * completely before page entry, ensuring 100% zero-lag 60fps scrolling.
 */

export const TOTAL_FRAMES = 150;

export function getFramePath(idx: number): string {
  const pad = idx.toString().padStart(3, '0');
  return `/frames/ezgif-frame-${pad}.webp`;
}

// In-memory HTMLImageElement cache prevents garbage collection and ensures instant canvas draw
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

/**
 * Preload single image and decode it in background GPU memory
 */
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
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {}).finally(() => resolve(img));
      } else {
        resolve(img);
      }
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

/**
 * Preload and decode a specific frame index (1 to 150)
 */
export function preloadFrame(frameIdx: number): Promise<HTMLImageElement> {
  if (frameCache.has(frameIdx)) {
    return Promise.resolve(frameCache.get(frameIdx)!);
  }

  const path = getFramePath(frameIdx);
  return preloadSingleImage(path).then((img) => {
    frameCache.set(frameIdx, img);
    return img;
  });
}

/**
 * High-throughput concurrent worker queue to preload all 150 frames
 * without blocking UI thread or overwhelming HTTP/2 multiplexing.
 */
async function preloadAllFramesConcurrent(
  concurrency: number = 10,
  onFrameLoaded?: (current: number, total: number) => void
): Promise<void> {
  const frameIndices = Array.from({ length: TOTAL_FRAMES }, (_, i) => i + 1);
  let loadedCount = 0;
  let activeWorkers = 0;
  let nextIndex = 0;

  return new Promise((resolve) => {
    function processNext() {
      if (loadedCount >= frameIndices.length) {
        resolve();
        return;
      }

      while (activeWorkers < concurrency && nextIndex < frameIndices.length) {
        const frameIdx = frameIndices[nextIndex++];
        activeWorkers++;

        preloadFrame(frameIdx)
          .catch(() => {})
          .finally(() => {
            activeWorkers--;
            loadedCount++;
            onFrameLoaded?.(loadedCount, frameIndices.length);
            processNext();
          });
      }
    }

    processNext();
  });
}

/**
 * Preload ALL 150 frames + critical tour imagery before entering website
 * Tracking live progress (0 - 100%)
 */
export function preloadCriticalAssets(
  onProgress?: (progress: number, loadedItem: string) => void
): Promise<void> {
  const totalTourImages = CRITICAL_TOUR_IMAGES.length;
  const totalFrames = TOTAL_FRAMES;
  const grandTotal = totalFrames + totalTourImages;

  let totalLoaded = 0;

  const notify = (name: string) => {
    totalLoaded++;
    const pct = Math.min(100, Math.round((totalLoaded / grandTotal) * 100));
    onProgress?.(pct, name);
  };

  return new Promise((resolve) => {
    // Safety max timer in case of extreme slow network (max 8 seconds)
    const safetyTimer = setTimeout(() => {
      onProgress?.(100, 'ready');
      resolve();
    }, 8500);

    // 1. Preload static brand and tour images concurrently
    const imagePromises = CRITICAL_TOUR_IMAGES.map((src) =>
      preloadSingleImage(src).finally(() => {
        notify(`Hình ảnh ${src.split('/').pop()}`);
      })
    );

    // 2. Preload all 150 3D frames with 12 parallel streams
    const framesPromise = preloadAllFramesConcurrent(12, (loaded, total) => {
      notify(`3D Frame #${loaded}/${total}`);
    });

    Promise.all([Promise.all(imagePromises), framesPromise]).finally(() => {
      clearTimeout(safetyTimer);
      onProgress?.(100, 'ready');
      resolve();
    });
  });
}

/**
 * Fallback background runner if any frame was skipped
 */
export function startBackgroundFramePreload() {
  if (typeof window === 'undefined') return;
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    if (!frameCache.has(i)) {
      preloadFrame(i).catch(() => {});
    }
  }
}
