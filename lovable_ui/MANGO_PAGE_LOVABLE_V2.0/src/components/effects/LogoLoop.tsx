import { type ReactNode, type CSSProperties } from 'react';

interface LogoItem {
  node?: ReactNode;
  src?: string;
  alt?: string;
  title?: string;
  href?: string;
}

interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: 'left' | 'right';
  logoHeight?: number;
  gap?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  className?: string;
  style?: CSSProperties;
}

export default function LogoLoop({
  logos,
  speed = 80,
  direction = 'left',
  logoHeight = 40,
  gap = 48,
  fadeOut = true,
  fadeOutColor = 'hsl(205, 35%, 12%)',
  className = '',
  style,
}: LogoLoopProps) {
  // Duplicate for seamless loop
  const items = [...logos, ...logos, ...logos];
  const dur = `${Math.max(10, (logos.length * gap) / speed) * 3}s`;

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
            animation: `logoloop ${dur} linear infinite`,
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
                {content}
              </a>
            ) : (
              <span key={i} className="shrink-0 flex items-start" title={logo.title} style={{ minHeight: logoHeight + 36 }}>
                {content}
              </span>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes logoloop {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
