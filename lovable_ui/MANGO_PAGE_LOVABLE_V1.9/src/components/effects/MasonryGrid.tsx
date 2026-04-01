import { useEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface MasonryGridProps {
  children: ReactNode[];
  columns?: { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  className?: string;
  stagger?: number;
}

export default function MasonryGrid({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 16,
  className = '',
  stagger = 0.04,
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(columns.lg || 3);

  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCols(columns.xl || columns.lg || 4);
      else if (w >= 1024) setCols(columns.lg || 3);
      else if (w >= 640) setCols(columns.md || 2);
      else setCols(columns.sm || 1);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, [columns]);

  // Distribute children into columns
  const colArrays: ReactNode[][] = Array.from({ length: cols }, () => []);
  children.forEach((child, i) => {
    colArrays[i % cols].push(child);
  });

  // GSAP entrance animation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const items = el.querySelectorAll('[data-masonry-item]');
    if (!items.length) return;

    gsap.set(items, { y: 40, opacity: 0, scale: 0.95 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });

    tl.to(items, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.6,
      stagger,
      ease: 'power3.out',
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [cols, children.length, stagger]);

  return (
    <div
      ref={containerRef}
      className={`flex ${className}`}
      style={{ gap }}
    >
      {colArrays.map((column, colIdx) => (
        <div key={colIdx} className="flex-1 flex flex-col" style={{ gap }}>
          {column.map((child, itemIdx) => (
            <div key={itemIdx} data-masonry-item="">
              {child}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
