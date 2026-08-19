import { type ReactNode, type CSSProperties } from 'react';

interface MarqueeItem {
  node?: ReactNode;
  src?: string;
  alt?: string;
  title?: string;
  href?: string;
}

interface BendingMarqueeProps {
  logos: MarqueeItem[];
  speed?: number;
  direction?: 'left' | 'right';
  logoHeight?: number;
  gap?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  /** Vertical travel of the bend wave, in px. */
  bendAmplitude?: number;
  /** Rotation extremes of the bend wave, in degrees. */
  bendRotate?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Marquee where each item rides its own "bend" wave (translateY + rotate,
 * out of phase across neighbors) on top of the horizontal scroll — the row
 * ripples as it flows instead of translating as a flat rigid strip.
 */
export default function BendingMarquee({
  logos,
  speed = 80,
  direction = 'left',
  logoHeight = 40,
  gap = 48,
  fadeOut = true,
  fadeOutColor = 'hsl(205, 35%, 12%)',
  bendAmplitude = 7,
  bendRotate = 4,
  className = '',
  style,
}: BendingMarqueeProps) {
  const items = [...logos, ...logos, ...logos];
  const scrollDur = `${Math.max(10, (logos.length * gap) / speed) * 3}s`;
  const bendDur = `${Math.max(1.6, logos.length * 0.18)}s`;
  const bendStep = logos.length > 0 ? parseFloat(bendDur) / logos.length : 0;

  return (
    <div
      className={`relative ${className}`}
      style={{ height: logoHeight + 80, ...style }}
      aria-label="Technology logos"
    >
      <div className="absolute inset-x-0 top-3 bottom-0 overflow-x-clip overflow-y-visible">
        {fadeOut && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${fadeOutColor}, transparent)` }} />
            <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: `linear-gradient(to left, ${fadeOutColor}, transparent)` }} />
          </>
        )}
        <div
          className="flex items-start whitespace-nowrap"
          style={{
            gap,
            animation: `bendingMarqueeScroll ${scrollDur} linear infinite`,
            animationDirection: direction === 'right' ? 'reverse' : 'normal',
            paddingTop: 4,
          }}
        >
          {items.map((logo, i) => {
            const content = logo.node || (
              <img
                src={logo.src}
                alt={logo.alt || logo.title || ''}
                style={{ height: logoHeight, width: 'auto' }}
                className="object-contain opacity-50 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0"
                loading="lazy"
              />
            );

            const wrapped = (
              <span
                className="inline-flex shrink-0"
                style={{
                  animation: `bendingMarqueeWave ${bendDur} ease-in-out infinite`,
                  animationDelay: `${(i % logos.length) * bendStep}s`,
                  ['--bend-y' as string]: `${bendAmplitude}px`,
                  ['--bend-rot' as string]: `${bendRotate}deg`,
                }}
              >
                {content}
              </span>
            );

            return logo.href ? (
              <a
                key={i}
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-start"
                title={logo.title}
                style={{ minHeight: logoHeight + 36 }}
              >
                {wrapped}
              </a>
            ) : (
              <span key={i} className="shrink-0 flex items-start" title={logo.title} style={{ minHeight: logoHeight + 36 }}>
                {wrapped}
              </span>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes bendingMarqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes bendingMarqueeWave {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(calc(var(--bend-y) * -1)) rotate(calc(var(--bend-rot) * -1)); }
          75% { transform: translateY(var(--bend-y)) rotate(var(--bend-rot)); }
        }
      `}</style>
    </div>
  );
}
