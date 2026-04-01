import { useState, useEffect, useRef } from "react";
import { Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sportImages = [
  { src: "/images/sports/intercolegiados-1.jpg", alt: "Premiación en podio — Intercolegiados" },
  { src: "/images/sports/intercolegiados-2.jpg", alt: "Equipo celebrando con trofeo" },
  { src: "/images/sports/intercolegiados-3.jpg", alt: "Medalla de oro y trofeo de campeonato" },
];

const captions = [
  "Podio de campeones 🏆",
  "Victoria del equipo 🥇",
  "Trofeo y medalla de oro ✨",
];

export function SportsAchievements() {
  const [isHovered, setIsHovered] = useState(false);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!isHovered || sportImages.length <= 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % sportImages.length);
    }, 2500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isHovered]);

  // Calculate popover position to avoid overflow on mobile
  const updatePopoverPosition = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const popoverWidth = 224; // w-56 = 14rem = 224px
    const viewportWidth = window.innerWidth;
    const centerX = rect.left + rect.width / 2;
    const halfPopover = popoverWidth / 2;

    let translateX = "-50%";
    let left = "50%";

    // If popover would overflow left
    if (centerX - halfPopover < 8) {
      left = "0px";
      translateX = "0%";
    }
    // If popover would overflow right
    else if (centerX + halfPopover > viewportWidth - 8) {
      left = "auto";
      translateX = "0%";
    }

    setPopoverStyle({
      left: left === "auto" ? undefined : left,
      right: left === "auto" ? "0px" : undefined,
      transform: `translateX(${translateX})`,
    });
  };

  const handleEnter = () => {
    setIsHovered(true);
    setCurrent(0);
    updatePopoverPosition();
  };

  return (
    <div
      ref={containerRef}
      className="mt-2 relative z-50 inline-flex flex-col items-center"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Trigger badge */}
      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/[0.08] border border-amber-500/[0.12] text-amber-300/90 text-xs font-medium shadow-[0_0_12px_hsl(45_90%_50%/0.06)] cursor-default select-none">
        <Trophy className="h-3.5 w-3.5" />
        🥇 1er Puesto — Intercolegiados
      </span>

      {/* Hover popover with auto-carousel */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-2 z-[100] w-56 rounded-xl bg-[hsl(var(--mango-deep)/0.95)] backdrop-blur-md border border-white/10 shadow-xl overflow-hidden"
            style={popoverStyle}
          >
            {/* Image carousel */}
            <div className="relative w-full h-32 overflow-hidden bg-black/20">
              <AnimatePresence mode="wait">
                <motion.img
                  key={current}
                  src={sportImages[current].src}
                  alt={sportImages[current].alt}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              </AnimatePresence>

              {/* Gradient overlay for text readability */}
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Caption */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={`cap-${current}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-1.5 left-2 right-2 text-white/90 text-[10px] font-medium truncate"
                >
                  {captions[current]}
                </motion.p>
              </AnimatePresence>

              {/* Dots */}
              <div className="absolute bottom-1.5 right-2 flex gap-1">
                {sportImages.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full transition-all duration-300 ${i === current ? "bg-accent w-2.5" : "bg-white/40"}`}
                  />
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="px-3 py-2">
              <p className="text-white/80 text-xs font-semibold">Logro Deportivo</p>
              <p className="text-white/50 text-[10px] leading-tight mt-0.5">
                Campeón Juegos Intercolegiados — Colegio Coomeva, Cali.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
