"use client";

// Pip the fox mascot — a friendly SVG face that appears throughout the app.
export function Mascot({ size = 64, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Pip the fox mascot"
    >
      {/* ears */}
      <polygon points="22,30 30,8 42,28" className="fill-orange-400" />
      <polygon points="78,30 70,8 58,28" className="fill-orange-400" />
      <polygon points="26,28 31,16 38,27" className="fill-orange-200" />
      <polygon points="74,28 69,16 62,27" className="fill-orange-200" />
      {/* head */}
      <ellipse cx="50" cy="56" rx="32" ry="30" className="fill-orange-400" />
      {/* cheeks / muzzle */}
      <ellipse cx="50" cy="66" rx="18" ry="14" className="fill-orange-100" />
      {/* eyes */}
      <circle cx="38" cy="52" r="4.5" className="fill-stone-800" />
      <circle cx="62" cy="52" r="4.5" className="fill-stone-800" />
      <circle cx="39.5" cy="50.5" r="1.4" className="fill-white" />
      <circle cx="63.5" cy="50.5" r="1.4" className="fill-white" />
      {/* nose */}
      <ellipse cx="50" cy="63" rx="3.4" ry="2.6" className="fill-stone-800" />
      {/* smile */}
      <path d="M44 67 Q50 73 56 67" className="fill-none stroke-stone-800" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
