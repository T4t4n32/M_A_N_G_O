import { User, Rocket, Users, ExternalLink, Award, GraduationCap, Trophy, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AboutSection() {
  return (
    <section id="sobre" className="py-20 md:py-28 bg-gradient-to-br from-mango-deep to-mango-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Sobre el Proyecto</h2>
          <p className="mt-3 text-white/60 max-w-2xl mx-auto">
            Las personas e historia detrás de M.A.N.G.O
          </p>
        </div>

        {/* Principal - Full width top card */}
        <div className="bg-white/[0.06] backdrop-blur rounded-xl border-2 border-secondary/20 p-7 md:p-10 hover:shadow-xl transition-all duration-300 mb-8">
          <div className="flex items-center gap-3 mb-8">
            <User className="p-2.5 rounded-xl bg-accent/15 text-accent"><User className="h-5 w-5" /></User>
            <h3 className="text-xl font-bold text-white">Líder de Desarrollo</h3>
          </div>

          <div className="grid md:grid-cols-[240px_1fr] gap-8 items-start">
            {/* Profile image area */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-white/[0.08] border-2 border-secondary/20 flex items-center justify-center overflow-hidden">
                <div className="text-center text-white/30">
                  <Camera className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-xs">Foto del Líder</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">[Nombre del Líder]</p>
                <p className="text-accent text-sm font-medium">Desarrollador Principal</p>
                <p className="text-white/40 text-xs mt-1">M.A.N.G.O Project</p>
              </div>
            </div>

            {/* Info columns */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Formación */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="h-4 w-4 text-accent" />
                  <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Formación</h4>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Formación técnica en desarrollo de software y electrónica aplicada
                </p>
              </div>

              {/* Experiencia */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-accent" />
                  <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Experiencia</h4>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Miembro de CALIBOTS, liderando M.A.N.G.O desde su concepción
                </p>
              </div>

              {/* Logros - spans full width */}
              <div className="sm:col-span-2 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-accent" />
                  <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Logros Destacados</h4>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                  "Participaciones regionales en robótica",
                  "Participaciones nacionales en eventos tecnológicos",
                  "Participaciones internacionales en torneos",
                  "Copa RobiSoft: 7mo puesto Nacional"].
                  map((logro, i) =>
                  <div key={i} className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <p className="text-white/70 text-sm">{logro}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: Calibots + Contribuyentes */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Calibots */}
          <div className="bg-white/[0.06] backdrop-blur rounded-xl border-2 border-secondary/20 p-7 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-accent/15 text-accent"><Rocket className="h-5 w-5" /></div>
              <h3 className="text-lg font-bold text-white">Inicios del Proyecto</h3>
            </div>
            <p className="text-white/70 leading-relaxed">
              M.A.N.G.O surgió del grupo de robótica{" "}
              <span className="text-accent font-semibold">CALIBOTS</span>{" "}
              (Club de Robótica de Comfandi El Prado), donde se estableció el enfoque en manglares
              y se seleccionaron los sensores ideales para el monitoreo ambiental.
            </p>
            <Button
              asChild
              className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6 font-semibold gap-2">

              <a href="https://calibots.org" target="_blank" rel="noopener noreferrer">
                Conoce CALIBOTS <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Contribuyentes */}
          <div className="bg-white/[0.06] backdrop-blur rounded-xl border-2 border-secondary/20 p-7 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-accent/15 text-accent"><Users className="h-5 w-5" /></div>
              <h3 className="text-lg font-bold text-white">Contribuyentes Clave</h3>
            </div>
            {/* Padres del líder — contribuyentes principales */}
            <div className="mb-5 p-4 rounded-xl bg-accent/[0.07] border border-accent/20">
              <p className="text-accent text-xs font-semibold uppercase tracking-wider mb-3">Pilares Fundamentales</p>
              {[
                { name: "Héctor Ignacio Sánchez", role: "Padre del líder del proyecto — Apoyo integral y soporte incondicional" },
                { name: "Yamileth Chacón", role: "Madre del líder del proyecto — Apoyo integral y soporte incondicional" },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{c.name}</p>
                    <p className="text-white/60 text-xs">{c.role}</p>
                  </div>
                </div>
              ))}
            </div>

            <ul className="space-y-4">
              {[
              { name: "Samuel Monsalve", role: "Co-desarrollo inicial" },
              { name: "Prof. Víctor Mario Perilla", role: "Asesoría electrónica/mecatrónica" },
              { name: "Richard Suarez", role: "Asesoría técnica" },
              { name: "CALIBOTS", role: "Fundación inicial del proyecto" }].
              map((c, i) =>
              <li key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center text-secondary font-bold text-sm shrink-0">
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{c.name}</p>
                    <p className="text-white/50 text-xs">{c.role}</p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>);

}