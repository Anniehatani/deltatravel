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
  speed = 0.9,
  className = '',
  outline = true,
  repeat = 12,
  baseOffset,
}: GiantScrollTypographyProps) {
  // Appropriate base offset depending on direction so text fills screen throughout scroll
  const resolvedBaseOffset =
    baseOffset !== undefined
      ? baseOffset
      : direction === 'right'
        ? -4200
        : -800;

  const textRef = useRef<HTMLDivElement>(null);
  const currentPos = useRef(resolvedBaseOffset);
  const targetPos = useRef(resolvedBaseOffset);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      targetPos.current = resolvedBaseOffset + scrollY * speed * (direction === 'left' ? -1 : 1);
    };

    const render = () => {
      if (!isMounted) return;
      // Snappier, buttery smooth lerp damping for immediate mouse scroll responsiveness
      const diff = targetPos.current - currentPos.current;
      currentPos.current += diff * 0.16;

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
  }, [direction, speed, resolvedBaseOffset]);

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
        className="giant-typography-dynamic inline-flex items-center text-[11vw] sm:text-[9vw] lg:text-[7.5vw] font-black leading-none will-change-transform"
        style={{ transform: `translate3d(${resolvedBaseOffset}px, 0, 0)` }}
      >
        {items}
      </div>
    </div>
  );
}
