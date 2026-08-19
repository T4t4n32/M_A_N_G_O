import { useNavigate } from "react-router-dom";
import BubbleMenu from "@/components/effects/BubbleMenu";
import { DynamicNav } from "@/components/effects/DynamicNav";
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
  const navigate = useNavigate();

  const handleItemClick = (href: string) => navigateToSection(navigate, href);

  const handleLogoClick = () => {
    if (window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-full focus:bg-accent focus:text-accent-foreground focus:font-semibold focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      {/* ── Desktop dynamic nav — floating island, logo → capsule of links ── */}
      <DynamicNav
        logo={icono}
        logoAlt="M.A.N.G.O — inicio"
        name="M.A.N.G.O"
        items={bubbleItems}
        onLogoClick={handleLogoClick}
        onItemClick={handleItemClick}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 hidden lg:block"
      />

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
