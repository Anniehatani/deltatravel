'use client';

import { useEffect, useRef } from 'react';

interface GiantScrollTypographyProps {
  text: string;
  direction?: 'left' | 'right';
  speed?: number;
  className?: string;
  outline?: boolean;
  repeat?: number;
  baseOffset?: number;
}

export function GiantScrollTypography({
  text,
  direction = 'left',
  speed = 0.25,
  className = '',
  outline = true,
  repeat = 8,
  baseOffset = -1200,
}: GiantScrollTypographyProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const currentPos = useRef(baseOffset);
  const targetPos = useRef(baseOffset);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      targetPos.current = baseOffset + scrollY * speed * (direction === 'left' ? -1 : 1);
    };

    const render = () => {
      if (!isMounted) return;
      // Smooth lerp damping for buttery smooth motion
      const diff = targetPos.current - currentPos.current;
      currentPos.current += diff * 0.12;

      if (textRef.current) {
        textRef.current.style.transform = `translate3d(${currentPos.current.toFixed(2)}px, 0, 0)`;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    animFrameId.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      window.removeEventListener('scroll', handleScroll);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [direction, speed, baseOffset]);

  // Clean repeat items without star icon, softer elegant translucent opacity
  const items = Array.from({ length: repeat }, (_, i) => (
    <span key={i} className="inline-flex items-center mx-12 shrink-0 select-none">
      <span
        style={
          outline
            ? {
                WebkitTextStroke: '1.5px rgba(0, 0, 0, 0.08)',
                color: 'transparent',
              }
            : {
                color: 'rgba(0, 0, 0, 0.04)',
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
      aria-hidden="true"
      className={`pointer-events-none select-none overflow-hidden whitespace-nowrap will-change-transform z-0 ${className}`}
    >
      <div
        ref={textRef}
        className="inline-flex items-center text-[11vw] sm:text-[9vw] lg:text-[7.5vw] font-black leading-none will-change-transform"
        style={{ transform: `translate3d(${baseOffset}px, 0, 0)` }}
      >
        {items}
      </div>
    </div>
  );
}
