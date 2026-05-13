import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  children: ReactNode;
  className?: string;
  floatDistance?: number;
  duration?: number;
  scrub?: boolean | number;
  stagger?: number;
  animateTarget?: 'self' | 'children';
}

export default function ScrollFloat({
  children,
  className = '',
  floatDistance = 40,
  duration = 1,
  scrub = 1,
  stagger = 0.1,
  animateTarget = 'self',
}: ScrollFloatProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = animateTarget === 'children' ? el.children : [el];

    gsap.set(targets, { y: floatDistance, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        end: 'top 40%',
        scrub,
        toggleActions: 'play none none reverse',
      },
    });

    tl.to(targets, {
      y: 0,
      opacity: 1,
      duration,
      stagger,
      ease: 'power3.out',
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [floatDistance, duration, scrub, stagger, animateTarget]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
