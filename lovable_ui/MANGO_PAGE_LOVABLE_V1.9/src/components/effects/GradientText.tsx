import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'framer-motion';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  pauseOnHover?: boolean;
}

export default function GradientText({
  children,
  className = '',
  colors = ['#00c9a7', '#38bdf8', '#c084fc', '#00c9a7'],
  animationSpeed = 8,
  showBorder = false,
  direction = 'horizontal',
  pauseOnHover = false,
}: GradientTextProps) {
  const [isPaused, setIsPaused] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const dur = animationSpeed * 1000;

  useAnimationFrame(time => {
    if (isPaused) { lastTimeRef.current = null; return; }
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return; }
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += dt;
    const fullCycle = dur * 2;
    const ct = elapsedRef.current % fullCycle;
    progress.set(ct < dur ? (ct / dur) * 100 : 100 - ((ct - dur) / dur) * 100);
  });

  useEffect(() => { elapsedRef.current = 0; progress.set(0); }, [animationSpeed]);

  const backgroundPosition = useTransform(progress, p =>
    direction === 'vertical' ? `50% ${p}%` : `${p}% 50%`
  );

  const angle = direction === 'horizontal' ? 'to right' : direction === 'vertical' ? 'to bottom' : 'to bottom right';
  const gradientColors = [...colors, colors[0]].join(', ');
  const gradientStyle = {
    backgroundImage: `linear-gradient(${angle}, ${gradientColors})`,
    backgroundSize: direction === 'vertical' ? '100% 300%' : '300% 100%',
    backgroundRepeat: 'repeat' as const,
  };

  return (
    <motion.span
      className={`inline-flex items-center relative ${showBorder ? 'px-3 py-1 rounded-2xl' : ''} ${className}`}
      onMouseEnter={pauseOnHover ? () => setIsPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setIsPaused(false) : undefined}
    >
      {showBorder && (
        <motion.span
          className="absolute inset-0 rounded-inherit z-0 pointer-events-none"
          style={{ ...gradientStyle, backgroundPosition, borderRadius: 'inherit' }}
        >
          <span className="absolute inset-[1px] rounded-inherit bg-mango-deep" style={{ borderRadius: 'inherit' }} />
        </motion.span>
      )}
      <motion.span
        className="relative z-[2] inline-block bg-clip-text text-transparent"
        style={{ ...gradientStyle, backgroundPosition, WebkitBackgroundClip: 'text' }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}
