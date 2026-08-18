import { Link } from "react-router-dom";
import { Github, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import icono from "@/assets/icono.png";

const NAV_LINKS = [
  { label: "Inicio", to: "/" },
  { label: "Documentación", to: "/documentacion" },
  { label: "Galería", to: "/galeria" },
];

interface DocsNavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function DocsNavbar({ theme, onToggleTheme }: DocsNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={icono} alt="M.A.N.G.O" className="h-7 w-7 rounded-full" />
          <span className="font-bold text-foreground tracking-wide">M.A.N.G.O</span>
          <span className="hidden sm:inline text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
            docs
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                item.to === "/documentacion"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5" role="group" aria-label="Cambiar tema">
            <Sun className={`h-3.5 w-3.5 ${theme === "light" ? "text-primary" : "text-muted-foreground"}`} />
            <Switch
              checked={theme === "dark"}
              onCheckedChange={onToggleTheme}
              aria-label="Alternar modo oscuro"
            />
            <Moon className={`h-3.5 w-3.5 ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <a
            href="https://github.com/T4t4n32/M_A_N_G_O"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver repositorio en GitHub"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </div>
    </header>
  );
}
