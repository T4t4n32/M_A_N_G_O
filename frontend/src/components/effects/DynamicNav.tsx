import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export type DynamicNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
  hoverStyles?: { bgColor?: string; textColor?: string };
};

interface DynamicNavProps {
  logo: string;
  logoAlt: string;
  name: string;
  items: DynamicNavItem[];
  onLogoClick: () => void;
  onItemClick: (href: string) => void;
  className?: string;
}

const SCROLL_THRESHOLD = 24;
const EDGE_GAP = 24;
const TOP_GAP = 20;

/**
 * Floating nav with two shapes. At the top of the page: a centered
 * horizontal "island" — icon + wordmark, expands sideways into a row of
 * links on click. Past SCROLL_THRESHOLD it morphs into a left-docked,
 * vertically-centered sidebar — icon only, expands downward into a stacked
 * column of links on click. Same DOM/state, framer-motion `layout` handles
 * the row⇄column reflow; the position tween (left/top/x/y) lives on the
 * outer wrapper so it never fights the inner size tween.
 */
export function DynamicNav({ logo, logoAlt, name, items, onLogoClick, onItemClick, className = "" }: DynamicNavProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => window.scrollY > SCROLL_THRESHOLD);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const spring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.9 };
  const positionSpring = { type: "spring" as const, stiffness: 300, damping: 30 };

  return (
    <motion.div
      ref={rootRef}
      className={className}
      animate={
        scrolled
          ? { left: EDGE_GAP, top: "50%", x: 0, y: "-50%" }
          : { left: "50%", top: TOP_GAP, x: "-50%", y: 0 }
      }
      transition={positionSpring}
    >
      <motion.div
        layout
        transition={spring}
        onClick={() => !open && setOpen(true)}
        className={`flex overflow-hidden border border-white/10 bg-[hsl(210,35%,8%)]/90 backdrop-blur-md shadow-lg ${
          scrolled ? "flex-col items-stretch rounded-3xl" : "flex-row items-center rounded-full"
        }`}
        style={{ cursor: open ? "default" : "pointer" }}
      >
        <motion.button
          layout
          transition={spring}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!open) {
              setOpen(true);
              return;
            }
            setOpen(false);
            onLogoClick();
          }}
          aria-label={open ? logoAlt : "Abrir menú de navegación"}
          aria-expanded={open}
          className={`shrink-0 flex items-center h-14 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(210,35%,8%)] ${
            scrolled ? "w-14 justify-center" : "pl-2"
          }`}
          style={!scrolled ? { paddingRight: 16 } : undefined}
        >
          <img src={logo} alt="" className="h-9 w-9 shrink-0 rounded-full" />
          <AnimatePresence initial={false}>
            {!scrolled && (
              <motion.span
                key="name"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="ml-2.5 whitespace-nowrap text-base font-bold tracking-wide text-white"
              >
                {name}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.nav
              key="items"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.18 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              aria-label="Navegación principal"
              className={
                scrolled
                  ? "flex flex-col items-stretch gap-1 px-2 pb-2"
                  : "flex flex-row items-center gap-1 pr-2"
              }
            >
              {items.map((item, i) => {
                const isLast = i === items.length - 1;
                const base = scrolled
                  ? "w-full text-left px-4 py-2.5 rounded-xl"
                  : "whitespace-nowrap px-4 py-2 rounded-full";
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      setOpen(false);
                      onItemClick(item.href);
                    }}
                    aria-label={item.ariaLabel || item.label}
                    className={
                      isLast
                        ? `${base} ${scrolled ? "mt-1" : "ml-1"} text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(210,35%,8%)]`
                        : `${base} text-sm font-medium text-white/80 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(210,35%,8%)]`
                    }
                    style={
                      !isLast
                        ? ({ "--hover-bg": item.hoverStyles?.bgColor || "rgba(255,255,255,0.06)" } as React.CSSProperties)
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      if (isLast || !item.hoverStyles?.bgColor) return;
                      e.currentTarget.style.backgroundColor = item.hoverStyles.bgColor;
                      if (item.hoverStyles.textColor) e.currentTarget.style.color = item.hoverStyles.textColor;
                    }}
                    onMouseLeave={(e) => {
                      if (isLast) return;
                      e.currentTarget.style.backgroundColor = "";
                      e.currentTarget.style.color = "";
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className={
                  scrolled
                    ? "mt-1 h-8 w-8 self-center shrink-0 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    : "ml-1 mr-1 h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                }
              >
                <X className="h-4 w-4" />
              </button>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
