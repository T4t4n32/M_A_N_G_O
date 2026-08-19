import { useState, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";

interface RippleCtaProps {
  label: string;
  onActivate: () => void;
  /** Real photo shown faintly behind the gradient, overlay-blended. */
  backgroundImage?: string;
  className?: string;
}

let rippleSeq = 0;

/**
 * A pill CTA with a cursor-tracked water-glow and a spawned expanding ring
 * on click — a native, dependency-free take on the "Ripple" interaction
 * (the published Framer.com component needs `Shader`/`RichText`/`defineShader`
 * etc. from the "framer" runtime, which frontend/public/framer-shim.js does
 * not implement; FramerEmbed already fails soft onto this component).
 */
export function RippleCta({ label, onActivate, backgroundImage, className = "" }: RippleCtaProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const id = ++rippleSeq;
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
    ]);
    onActivate();
  };

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    e.currentTarget.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      className={`group relative isolate overflow-hidden rounded-full px-10 py-4 text-base font-semibold text-white
        bg-gradient-to-r from-[hsl(168,72%,42%)] to-[hsl(204,70%,53%)]
        shadow-[0_0_30px_hsl(168_72%_42%/0.35)] hover:shadow-[0_0_50px_hsl(168_72%_42%/0.5)]
        transition-[box-shadow,transform] duration-500 hover:scale-105
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[hsl(210,38%,6%)]
        ${className}`}
    >
      {backgroundImage && (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      {/* Cursor-tracked water-glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "radial-gradient(120px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.35), transparent 70%)",
        }}
      />

      {/* Click-spawned expanding ripple rings */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          onAnimationEnd={() => setRipples((prev) => prev.filter((p) => p.id !== r.id))}
          className="pointer-events-none absolute rounded-full bg-white/50 animate-ripple-expand"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}

      <span className="relative z-10 inline-flex items-center gap-2">
        {label}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </button>
  );
}
