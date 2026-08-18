import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BubbleMenu from "@/components/effects/BubbleMenu";
import { ChevronDown, ChevronUp } from "lucide-react";
import icono from "@/assets/icono.png";
import { navigateToSection } from "@/lib/sectionNav";

const bubbleItems = [
  {
    label: "Proyecto",
    href: "#proyecto",
    ariaLabel: "Ir a Proyecto",
    rotation: -6,
    hoverStyles: { bgColor: "hsl(168, 72%, 42%)", textColor: "#ffffff" },
  },
  {
    label: "Documentación",
    href: "/documentacion",
    ariaLabel: "Ir a Documentación",
    rotation: 5,
    hoverStyles: { bgColor: "hsl(204, 70%, 53%)", textColor: "#ffffff" },
  },
  {
    label: "Galería",
    href: "/galeria",
    ariaLabel: "Ir a Galería",
    rotation: -4,
    hoverStyles: { bgColor: "hsl(50, 90%, 58%)", textColor: "hsl(205, 40%, 12%)" },
  },
  {
    label: "Sobre",
    href: "/sobre",
    ariaLabel: "Ir a Sobre",
    rotation: 6,
    hoverStyles: { bgColor: "hsl(180, 55%, 42%)", textColor: "#ffffff" },
  },
  {
    label: "Contacto",
    href: "#contacto",
    ariaLabel: "Ir a Contacto",
    rotation: -5,
    hoverStyles: { bgColor: "hsl(195, 70%, 48%)", textColor: "#ffffff" },
  },
  {
    label: "Acceso",
    href: "/login",
    ariaLabel: "Acceso Institucional",
    rotation: 4,
    hoverStyles: { bgColor: "hsl(168, 72%, 35%)", textColor: "#ffffff" },
  },
];

export function Header() {
  const [visible, setVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Refs avoid stale-closure bugs in the scroll handler
  const visibleRef   = useRef(true);
  const manualRef    = useRef(false); // true = user explicitly hid it; scroll-up won't restore
  const lastY        = useRef(0);

  const show = useCallback(() => {
    visibleRef.current  = true;
    manualRef.current   = false;
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    visibleRef.current  = false;
    manualRef.current   = true;
    setVisible(false);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y     = window.scrollY;
      const delta = y - lastY.current;
      lastY.current = y;

      setIsScrolled(y > 20);

      // Always restore at the very top of the page
      if (y <= 10) {
        visibleRef.current = true;
        manualRef.current  = false;
        setVisible(true);
        return;
      }

      // If user manually hid the header, honour that until they click the periscope
      if (manualRef.current) return;

      if (delta > 8 && y > 100 && visibleRef.current) {
        visibleRef.current = false;
        setVisible(false);
      } else if (delta < -4 && !visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleItemClick = (href: string) => navigateToSection(navigate, href);

  const easing = "cubic-bezier(0.4, 0, 0.2, 1)";

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-full focus:bg-accent focus:text-accent-foreground focus:font-semibold focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      {/* ── Desktop nav bar ─────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 hidden lg:block ${
          isScrolled
            ? "bg-[hsl(210,35%,8%)]/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
        style={{
          transform: visible ? "translateY(0)" : "translateY(-100%)",
          transition: `transform 280ms ${easing}, background-color 300ms, box-shadow 300ms`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <a
              href="/"
              className="flex items-center gap-2 group"
              onClick={(e) => {
                e.preventDefault();
                if (window.location.pathname === "/") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  navigate("/");
                }
              }}
            >
              <img src={icono} alt="M.A.N.G.O" className="h-9 w-9 rounded-full" />
              <span className="text-xl font-bold text-white tracking-wide">
                M.A.N.G.O
              </span>
            </a>

            {/* Nav + collapse button */}
            <nav className="flex items-center gap-1">
              {bubbleItems.slice(0, 5).map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleItemClick(item.href)}
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-accent transition-colors rounded-lg hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(210,35%,8%)]"
                >
                  {item.label}
                </button>
              ))}

              <Button
                onClick={() => navigate("/login")}
                className="ml-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6 font-semibold"
              >
                Acceso Institucional
              </Button>

              {/* Collapse trigger */}
              <button
                type="button"
                onClick={hide}
                title="Ocultar barra de navegación"
                aria-label="Ocultar barra de navegación"
                className="ml-2 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/65 hover:bg-white/[0.06] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Periscope tab — hangs from top when header is hidden ────────── */}
      {/*
        translateY(-100%) when visible (above the viewport, out of sight)
        translateY(0)      when hidden (drops down, flush to top of screen)
      */}
      <div
        aria-hidden={visible}
        className="fixed top-0 z-50 hidden lg:block"
        style={{
          left: "50%",
          transform: `translateX(-50%) translateY(${visible ? "-100%" : "0"})`,
          transition: `transform 280ms ${easing}`,
          pointerEvents: visible ? "none" : "auto",
        }}
      >
        <button
          type="button"
          onClick={show}
          tabIndex={visible ? -1 : 0}
          aria-label="Mostrar barra de navegación"
          className="group flex items-center gap-2.5 px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-white/55 hover:text-white/90 transition-colors"
          style={{
            background: "hsla(210, 35%, 8%, 0.97)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderRadius: "0 0 14px 14px",
            borderLeft:   "1px solid rgba(0, 201, 167, 0.20)",
            borderRight:  "1px solid rgba(0, 201, 167, 0.20)",
            borderBottom: "1px solid rgba(0, 201, 167, 0.20)",
            boxShadow:
              "0 8px 28px rgba(0, 201, 167, 0.10), inset 0 -1px 0 rgba(0, 201, 167, 0.07)",
          }}
        >
          <img
            src={icono}
            alt=""
            className="h-[15px] w-[15px] rounded-full opacity-60 group-hover:opacity-90 transition-opacity"
          />
          <span>M.A.N.G.O</span>
          <ChevronDown className="h-3 w-3 opacity-45 group-hover:opacity-70 transition-opacity" />
        </button>
      </div>

      {/* ── Mobile + Tablet BubbleMenu (unchanged) ──────────────────────── */}
      <div className="lg:hidden">
        <BubbleMenu
          logo={<img src={icono} alt="M.A.N.G.O" className="w-9 h-9 rounded-full" />}
          items={bubbleItems}
          onItemClick={handleItemClick}
          useFixedPosition
          menuBg="hsl(205, 35%, 14%)"
          menuContentColor="hsl(168, 72%, 60%)"
          menuAriaLabel="Abrir menú de navegación"
          className="top-3 right-3"
          style={{ zIndex: 100 }}
        />
      </div>
    </>
  );
}
