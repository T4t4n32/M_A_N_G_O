import icono from "@/assets/icono.png";
import { useToast } from "@/hooks/use-toast";

const links = [
  { label: "Proyecto", href: "#proyecto" },
  { label: "Documentación", href: "#documentacion" },
  { label: "Galería", href: "#galeria" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contacto", href: "#contacto" },
];

export function Footer() {
  const { toast } = useToast();

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePhoneCopy = () => {
    navigator.clipboard.writeText("+573217693339");
    toast({ title: "Número copiado", description: "El número ha sido copiado al portapapeles." });
  };

  return (
    <footer className="bg-mango-dark text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={icono} alt="M.A.N.G.O" className="h-8 w-8 rounded-full" />
              <span className="text-lg font-bold text-white">M.A.N.G.O</span>
            </div>
            <p className="text-sm leading-relaxed">
              Sistema de Monitoreo Autónomo de Niveles y Gestión Oceánica para la protección de ecosistemas de manglar.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.href}>
                  <button onClick={() => scrollTo(l.href)} className="text-sm hover:text-accent transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://mail.google.com/mail/?view=cm&to=mango.monitoring@integramosoe.com&su=Contacto%20-%20Proyecto%20M.A.N.G.O"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  Equipo M.A.N.G.O
                </a>
              </li>
              <li>
                <button onClick={handlePhoneCopy} className="hover:text-accent transition-colors cursor-pointer">
                  +57 321 7693339
                </button>
              </li>
              <li>
                <a
                  href="https://www.google.com/maps/place/Cali,+Valle+del+Cauca,+Colombia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  Cali, Valle del Cauca, Colombia
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Instituciones</h4>
            <p className="text-sm">Acceso autorizado exclusivo para instituciones vinculadas a proyectos de investigación ambiental.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} M.A.N.G.O — Todos los derechos reservados</p>
          <p>Proyecto de investigación con fines académicos y de conservación</p>
        </div>
      </div>
    </footer>
  );
}
