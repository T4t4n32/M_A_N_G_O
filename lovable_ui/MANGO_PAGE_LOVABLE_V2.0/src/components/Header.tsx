import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BubbleMenu from "@/components/effects/BubbleMenu";
import icono from "@/assets/icono.png";

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
    href: "#documentacion",
    ariaLabel: "Ir a Documentación",
    rotation: 5,
    hoverStyles: { bgColor: "hsl(204, 70%, 53%)", textColor: "#ffffff" },
  },
  {
    label: "Galería",
    href: "#galeria",
    ariaLabel: "Ir a Galería",
    rotation: -4,
    hoverStyles: { bgColor: "hsl(50, 90%, 58%)", textColor: "hsl(205, 40%, 12%)" },
  },
  {
    label: "Sobre",
    href: "#sobre",
    ariaLabel: "Ir a Sobre nosotros",
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
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleItemClick = (href: string) => {
    if (href.startsWith("/")) {
      navigate(href);
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Desktop nav bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 hidden md:block ${
          isScrolled
            ? "bg-[hsl(210,35%,8%)]/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a
              href="#"
              className="flex items-center gap-2 group"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <img src={icono} alt="M.A.N.G.O" className="h-9 w-9 rounded-full" />
              <span className="text-xl font-bold text-white tracking-wide">
                M.A.N.G.O
              </span>
            </a>

            <nav className="flex items-center gap-1">
              {bubbleItems.slice(0, 5).map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleItemClick(item.href)}
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-accent transition-colors rounded-lg hover:bg-white/5"
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
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile BubbleMenu */}
      <div className="md:hidden">
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
