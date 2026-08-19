import { useEffect, useRef, useState } from "react";

interface ApertureDividerProps {
  /** Background of the section above the seam */
  fromColor: string;
  /** Background of the section below the seam */
  toColor: string;
  /** Seam glow color, revealed as the shutters part */
  glowColor: string;
}

/**
 * Scroll-triggered transition used once, between the documentation teaser
 * and the gallery teaser: two angled shutter panels (styled like the
 * documentation section's boxed layout) slide apart to reveal a glowing
 * seam and the gallery's open, edge-to-edge background underneath — the
 * divider itself enacts the shift from "contained" to "wide open" that the
 * gallery section is about. Every other section boundary on the landing
 * page uses the plain SectionLine hairline; this one is intentionally
 * different since it's the one seam where the content itself changes shape.
 */
export function ApertureDivider({ fromColor, toColor, glowColor }: ApertureDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOpen(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative h-20 md:h-28 overflow-hidden pointer-events-none"
      style={{ background: `linear-gradient(to bottom, ${fromColor}, ${toColor})` }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-px transition-[width,opacity] duration-1300 ease-out"
        style={{
          width: open ? "72%" : "0%",
          opacity: open ? 1 : 0,
          transform: "translate(-50%, -50%)",
          background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
          boxShadow: `0 0 36px 4px ${glowColor}`,
        }}
      />
      <div
        className="absolute inset-y-0 left-0 transition-transform duration-1100 ease-aperture"
        style={{
          width: "54%",
          background: fromColor,
          clipPath: "polygon(0 0, 100% 0, 84% 100%, 0 100%)",
          transform: open ? "translateX(-14%)" : "translateX(0%)",
        }}
      />
      <div
        className="absolute inset-y-0 right-0 transition-transform duration-1100 ease-aperture"
        style={{
          width: "54%",
          background: fromColor,
          clipPath: "polygon(16% 0, 100% 0, 100% 100%, 0 100%)",
          transform: open ? "translateX(14%)" : "translateX(0%)",
        }}
      />
    </div>
  );
}
