import { motion, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Full-page parallax gradient orbs that drift subtly as the user scrolls.
 * GPU-accelerated with will-change: transform. Disabled on mobile for perf.
 */
export function ParallaxBackground() {
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll();

  // Each orb moves at a different rate for depth
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);
  const x1 = useTransform(scrollYProgress, [0, 1], ["0%", "6%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  // On mobile: static orbs (no scroll-driven transforms) to avoid jank
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,hsl(168_72%_42%/0.06),transparent_70%)]"
          style={{ bottom: "15%", left: "0%" }}
        />
        <div
          className="absolute w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle,hsl(204_70%_53%/0.05),transparent_70%)]"
          style={{ top: "25%", right: "0%" }}
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Teal orb — bottom-left */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(168_72%_42%/0.07),transparent_70%)] will-change-transform"
        style={{ bottom: "10%", left: "5%", y: y1, x: x1 }}
      />

      {/* Blue orb — top-right */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,hsl(204_70%_53%/0.06),transparent_70%)] will-change-transform"
        style={{ top: "20%", right: "8%", y: y2, x: x2 }}
      />

      {/* Gold accent orb — center */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,hsl(50_90%_58%/0.03),transparent_70%)] will-change-transform"
        style={{ top: "50%", left: "40%", y: y3 }}
      />
    </div>
  );
}
