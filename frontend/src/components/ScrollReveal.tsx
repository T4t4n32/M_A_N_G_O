import { useEffect, useRef, forwardRef, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  variant?: "fade-up" | "fade-left" | "fade-right" | "scale";
  delay?: number;
  duration?: number;
}

export const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(
  function ScrollReveal({ children, className, delay = 0, duration = 0.6 }, ref) {
    const localRef = useRef<HTMLDivElement>(null);
    const elRef = (ref as React.RefObject<HTMLDivElement>) ?? localRef;

    useEffect(() => {
      const el = elRef.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "none";
            obs.disconnect();
          }
        },
        { threshold: 0.05 }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }, [elRef]);

    return (
      <div
        ref={elRef}
        className={className}
        style={{
          opacity: 0,
          transform: "translateY(24px)",
          transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
          willChange: "opacity, transform",
        }}
      >
        {children}
      </div>
    );
  }
);
