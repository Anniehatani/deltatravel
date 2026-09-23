import React from 'react';

export function VietnamFlag({ className = 'w-4 h-3' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={`inline-block shrink-0 rounded-[2px] overflow-hidden shadow-2xs ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cờ Việt Nam"
    >
      <rect width="30" height="20" fill="#da251d" />
      <polygon
        points="15,4 16.545,8.755 21.548,8.755 17.502,11.695 19.048,16.45 15,13.51 10.952,16.45 12.498,11.695 8.452,8.755 13.455,8.755"
        fill="#ffff00"
      />
    </svg>
  );
}

export function UKFlag({ className = 'w-4 h-3' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={`inline-block shrink-0 rounded-[2px] overflow-hidden shadow-2xs ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="English / UK Flag"
    >
      <clipPath id="uk-clip-bounds">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#uk-clip-bounds)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#c8102e" strokeWidth="2" />
        <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
      </g>
    </svg>
  );
}
