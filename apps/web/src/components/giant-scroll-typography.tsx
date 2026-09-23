'use client';

import { useEffect, useRef } from 'react';

interface GiantScrollTypographyProps {
  text: string;
  direction?: 'left' | 'right';
  speed?: number;
  className?: string;
  outline?: boolean;
  repeat?: number;
}

export function GiantScrollTypography({
  text,
  direction = 'left',
  speed = 0.8,
  className = '',
  outline = true,
  repeat = 16,
}: GiantScrollTypographyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const scrollOffset = useRef(0);
  const lastScrollY = useRef(0);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    lastScrollY.current = window.scrollY || window.pageYOffset || 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const delta = currentScrollY - lastScrollY.current;
      lastScrollY.current = currentScrollY;
      // Scroll adds momentum in direction of motion
      scrollOffset.current += delta * speed * (direction === 'left' ? -1 : 1);
    };

    const render = () => {
      if (!isMounted) return;

      // Base continuous smooth glide speed (always running!)
      const baseGlide = direction === 'left' ? -1.2 : 1.2;

      // Decay scroll momentum smoothly
      pos.current += baseGlide + scrollOffset.current * 0.15;
      scrollOffset.current *= 0.85; // Damping

      if (textRef.current) {
        // Infinite seamless modulo wrapping
        const width = textRef.current.scrollWidth / 2;
        if (width > 0) {
          if (pos.current < -width) {
            pos.current += width;
          } else if (pos.current > 0) {
            pos.current -= width;
          }
        }
        textRef.current.style.transform = `translate3d(${pos.current.toFixed(2)}px, 0, 0)`;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    animFrameId.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      window.removeEventListener('scroll', handleScroll);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [direction, speed]);

  // Clean repeat items with elegant translucent visibility
  const items = Array.from({ length: repeat }, (_, i) => (
    <span key={i} className="inline-flex items-center mx-10 shrink-0 select-none">
      <span
        style={
          outline
            ? {
                WebkitTextStroke: '1.5px rgba(0, 0, 0, 0.12)',
                color: 'transparent',
              }
            : {
                color: 'rgba(0, 0, 0, 0.05)',
              }
        }
        className="font-black tracking-wider uppercase select-none"
      >
        {text}
      </span>
    </span>
  ));

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none select-none overflow-hidden whitespace-nowrap will-change-transform z-0 ${className}`}
    >
      <div
        ref={textRef}
        className="giant-typography-dynamic inline-flex items-center text-[11vw] sm:text-[9vw] lg:text-[7.5vw] font-black leading-none will-change-transform"
      >
        {items}
      </div>
    </div>
  );
}
