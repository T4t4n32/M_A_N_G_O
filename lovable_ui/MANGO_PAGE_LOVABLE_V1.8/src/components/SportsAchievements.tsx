import { useState, useEffect, useRef } from "react";
import { Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sportImages = [
  // Placeholder — replace with actual sports photos
  // { src: "/images/gallery/sports/photo1.jpg", alt: "Intercolegiados 1" },
];

export function SportsAchievements() {
  const [isHovered, setIsHovered] = useState(false);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isHovered || sportImages.length <= 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % sportImages.length);
    }, 2200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isHovered]);

  const hasImages = sportImages.length > 0;

  return (
    <div
      className="mt-2 relative inline-flex flex-col items-center"
      onMouseEnter={() => { setIsHovered(true); setCurrent(0); }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle trigger */}
      <span className="inline-flex items-center gap-1.5 text-white/30 hover:text-accent/70 transition-colors cursor-default text-[11px]">
        <Trophy className="h-3 w-3" />
        🥇 1er Puesto — Intercolegiados
      </span>

      {/* Hover popover with carousel */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-2 z-30 w-56 rounded-xl bg-mango-deep/95 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden"
          >
            <div className="px-3 py-2">
              <p className="text-white/80 text-xs font-semibold">Logro Deportivo</p>
              <p className="text-white/50 text-[10px] leading-tight mt-0.5">
                Campeón Juegos Intercolegiados — Colegio Coomeva, Cali.
              </p>
            </div>

            {hasImages ? (
              <div className="relative w-full h-32 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={current}
                    src={sportImages[current].src}
                    alt={sportImages[current].alt}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                </AnimatePresence>
                {sportImages.length > 1 && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                    {sportImages.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full transition-all ${i === current ? "bg-accent w-3" : "bg-white/40"}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-3 pb-2">
                <span className="text-white/20 text-[10px] italic">📸 Fotos próximamente</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
