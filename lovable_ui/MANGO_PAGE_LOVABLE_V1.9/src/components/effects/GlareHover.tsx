import { useRef, useState, type ReactNode, type CSSProperties } from 'react';

interface GlareHoverProps {
  children: ReactNode;
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  glareSize?: number;
  transitionDuration?: number;
  className?: string;
  style?: CSSProperties;
}

export default function GlareHover({
  children,
  glareColor = '#ffffff',
  glareOpacity = 0.18,
  glareAngle = -30,
  glareSize = 250,
  transitionDuration = 600,
  className = '',
  style,
}: GlareHoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [glare, setGlare] = useState({ x: 50, y: 50, active: false });

  const handleMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlare({ x, y, active: true });
  };

  const handleLeave = () => setGlare(prev => ({ ...prev, active: false }));

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {children}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: glare.active
            ? `radial-gradient(${glareSize}px circle at ${glare.x}% ${glare.y}%, ${glareColor}${Math.round(glareOpacity * 255).toString(16).padStart(2, '0')}, transparent 60%)`
            : 'none',
          transform: `rotate(${glareAngle}deg) scale(1.5)`,
          transition: `opacity ${transitionDuration}ms ease`,
          opacity: glare.active ? 1 : 0,
        }}
      />
    </div>
  );
}
