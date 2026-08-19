import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { X, Mail, Phone, MapPin } from "lucide-react";
import { useSiteValue } from "@/lib/siteContent";
import type { DynamicNavItem } from "@/components/effects/DynamicNav";

interface SidebarMenuDrawerProps {
  logo: string;
  name: string;
  items: DynamicNavItem[];
  onClose: () => void;
  onItemClick: (href: string) => void;
}

const contactLinks: { Icon: typeof Mail; href: string; label: string; external: boolean }[] = [
  {
    Icon: Mail,
    href: "https://mail.google.com/mail/?view=cm&to=mango.monitoring@integramosoe.com&su=Contacto%20-%20Proyecto%20M.A.N.G.O",
    label: "Correo",
    external: true,
  },
  { Icon: Phone, href: "tel:+573217693339", label: "Teléfono", external: false },
  {
    Icon: MapPin,
    href: "https://www.google.com/maps/place/Cali,+Valle+del+Cauca,+Colombia",
    label: "Ubicación",
    external: true,
  },
];

/**
 * Fullscreen editorial drawer for DynamicNav's left-docked (scrolled) state
 * — numbered list, active-route highlight, mono/brand type pairing, modeled
 * on the "Sidebar Navigation" Framer reference the user linked. Its
 * social-icon row and Imprint/Terms/Privacy links have no honest equivalent
 * here (no social accounts, no legal pages exist), so the footer keeps only
 * real contact channels — same destinations as Footer.tsx — and the real
 * copyright string.
 */
export function SidebarMenuDrawer({ logo, name, items, onClose, onItemClick }: SidebarMenuDrawerProps) {
  const location = useLocation();
  const copyright = useSiteValue("footer.copyright", "M.A.N.G.O — Todos los derechos reservados");

  return (
    <>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      <motion.div
        key="drawer"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed inset-y-0 left-0 z-50 flex h-screen w-full max-w-[420px] flex-col justify-between bg-[hsl(210,35%,8%)] shadow-[12px_0_60px_-12px_rgba(255,184,0,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="flex items-center justify-between px-6 pt-6 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-8 w-8 rounded-full" />
            <span className="font-mono text-sm font-semibold tracking-wide text-white">{name}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-white/50 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Menu <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col justify-center px-6 sm:px-8" aria-label="Navegación principal">
          {items.map((item, i) => {
            const active = item.href.startsWith("/") && location.pathname === item.href;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => onItemClick(item.href)}
                aria-label={item.ariaLabel || item.label}
                className={`group flex items-baseline gap-4 border-b py-4 text-left transition-colors sm:gap-5 sm:py-5 ${
                  i === 0 ? "border-t" : ""
                } ${active ? "border-[#FFB800]/70" : "border-white/10"}`}
              >
                <span
                  className={`font-mono text-xs tabular-nums transition-colors ${
                    active ? "text-[#FFB800]" : "text-white/35 group-hover:text-white/60"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`font-brand text-2xl font-bold tracking-tight transition-colors sm:text-3xl ${
                    active ? "text-white" : "text-white/55 group-hover:text-white"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-4 px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="flex items-center gap-5">
            {contactLinks.map(({ Icon, href, label, external }) => (
              <a
                key={label}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                aria-label={label}
                className="text-white/35 transition-colors hover:text-white/70"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <p className="text-center font-mono text-[10px] text-white/30">{copyright}</p>
        </div>
      </motion.div>
    </>
  );
}
