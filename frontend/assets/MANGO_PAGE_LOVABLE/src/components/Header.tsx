import { useState, useEffect } from "react";
import { Menu, X, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginModal } from "./LoginModal";

const navItems = [
{ label: "Proyecto", href: "#proyecto" },
{ label: "Documentación", href: "#documentacion" },
{ label: "Galería", href: "#galeria" },
{ label: "Sobre", href: "#sobre" },
{ label: "Contacto", href: "#contacto" }];


export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ?
        "bg-mango-dark/95 backdrop-blur-md shadow-lg" :
        "bg-transparent"}`
        }>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="#" className="flex items-center gap-2 group" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <Leaf className="h-7 w-7 text-accent" />
              <span className="text-xl font-bold text-white tracking-wide">
                M.A.N.G.O
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) =>
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-accent transition-colors rounded-lg hover:bg-white/5">

                  {item.label}
                </button>
              )}
              <Button
                onClick={() => setLoginOpen(true)}
                className="ml-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6 font-semibold">

                Acceso Institucional
              </Button>
            </nav>

            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu">

              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileOpen &&
        <div className="md:hidden bg-mango-dark/95 backdrop-blur-md border-t border-white/10">
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) =>
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className="block w-full text-left px-4 py-3 text-white/80 hover:text-accent hover:bg-white/5 rounded-lg transition-colors">

                  {item.label}
                </button>
            )}
              <Button
              onClick={() => {setLoginOpen(true);setMobileOpen(false);}}
              className="w-full mt-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full font-semibold">

                Acceso Institucional
              </Button>
            </div>
          </div>
        }
      </header>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>);

}