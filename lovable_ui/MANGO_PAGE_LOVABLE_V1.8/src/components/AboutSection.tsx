import { User, Rocket, Users, ExternalLink, Award, GraduationCap, Medal, Star, Heart, ImageIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpandableAwards } from "@/components/ExpandableAwards";
import { SportsAchievements } from "@/components/SportsAchievements";
import calibotsLogo from "@/assets/calibots-logo.png";
import liderFoto from "@/assets/lider-foto.jpg";

export function AboutSection() {
  const fllSeasons = [
    { year: "2021-2022", name: "Cargo Connect", level: "Regional & Nacional" },
    { year: "2022-2023", name: "SUPERPOWERED", level: "Regional & Nacional" },
    { year: "2023-2024", name: "MASTERPIECE", level: "🏆 1er Puesto Nacional → Internacional" },
    { year: "2024-2025", name: "Submerged", level: "Regional, Nacional & Internacional (Houston, TX)" },
  ];
  return (
    <section id="sobre" className="py-20 md:py-28 bg-mango-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,hsl(168_72%_42%/0.05),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Sobre el Proyecto</h2>
          <p className="mt-3 text-white/60 max-w-2xl mx-auto">
            Las personas e historia detrás de M.A.N.G.O
          </p>
        </div>

        {/* Líder de Desarrollo */}
        <div className="bg-white/[0.06] backdrop-blur rounded-xl border-2 border-secondary/20 p-7 md:p-10 hover:shadow-xl transition-all duration-300 mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent"><User className="h-5 w-5" /></div>
            <h3 className="text-xl font-bold text-white">Líder de Desarrollo</h3>
          </div>

          <div className="grid md:grid-cols-[220px_1fr] gap-8 items-start">
            {/* Foto + nombre */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-44 h-44 md:w-52 md:h-52 rounded-2xl border-2 border-secondary/20 overflow-hidden">
                <img src={liderFoto} alt="Sebastián Sánchez Chacón" className="w-full h-full object-cover" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">Sebastián Sánchez Chacón</p>
                <p className="text-accent text-sm font-medium">Desarrollador Principal</p>
                <p className="text-white/40 text-xs mt-1">M.A.N.G.O Project</p>
              </div>
              <a
                href="https://www.youtube.com/@Tatan_32"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-all text-xs font-semibold"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                Mi historia estudiantil
              </a>
              <SportsAchievements />
            </div>

            {/* Info */}
            <div className="space-y-6">
              {/* Formación + Inicios */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-accent" />
                    <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Formación</h4>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Estudiante de <span className="text-white/90 font-medium">Comfandi El Prado</span> con enfoque industrial.
                    Técnico en Mantenimiento y Reparación de Aparatos Electrónicos (SENA).
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-accent" />
                    <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Inicios</h4>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Desde temprana edad en electrónica y robótica con programas como
                    <span className="text-white/90 font-medium"> Innovación Educativa (Scratch + SB-TDS)</span>,
                    creando su primer seguidor de línea.
                  </p>
                </div>
              </div>

              {/* Trayectoria FLL */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Medal className="h-4 w-4 text-accent" />
                  <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Trayectoria First Lego League</h4>
                </div>
                <div className="flex flex-col gap-1.5">
                  {fllSeasons.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/[0.04] rounded-lg px-3 py-2">
                      <span className="text-accent font-mono text-xs font-bold shrink-0 w-20">{s.year}</span>
                      <span className="text-white/80 text-sm font-medium shrink-0">{s.name}</span>
                      <span className="text-white/40 text-xs hidden sm:inline">—</span>
                      <span className="text-white/50 text-xs hidden sm:inline">{s.level}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Premios expandibles con media */}
              <ExpandableAwards />

              {/* Logros Deportivos moved to leader photo column */}

              {/* Otros proyectos */}
              <p className="text-white/50 text-xs">
                También desarrolló <span className="text-accent/80 font-medium">ECOLATAS</span>, proyecto con impacto socio-ambiental.
                Diploma otorgado por Comfandi El Prado como representante y campeón nacional FLL Masterpiece.
              </p>
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
             <div className="block mb-6">
               <img src={calibotsLogo} alt="CALIBOTS Temporada Actual" className="w-[200px] h-[200px] mx-auto rounded-full border-4 border-accent/20 object-cover bg-mango-deep" />
             </div>
             <p className="text-white/70 leading-relaxed">
               M.A.N.G.O surgió del grupo de robótica{" "}
               <span className="text-accent font-semibold">CALIBOTS</span>{" "}
               (Club de Robótica de Comfandi El Prado), donde se estableció el enfoque en manglares
               y se definió la estrategia integral para la protección y conservación de ecosistemas marítimos.
             </p>
             {/* TODO: Cambiar href="#" por el link correcto de CALIBOTS */}
             <Button
               asChild
               className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6 font-semibold gap-2">
               <a href="#" onClick={(e) => e.preventDefault()}>
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

            {/* Mención Honorífica — Collapsible */}
            <div className="rounded-xl border border-accent/25 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('mencion-honorifica');
                  el?.classList.toggle('hidden');
                  const chevron = document.getElementById('mencion-chevron');
                  chevron?.classList.toggle('rotate-180');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-accent/[0.08] hover:bg-accent/[0.12] transition-colors text-left group"
              >
                <Star className="h-4 w-4 text-accent shrink-0" />
                <span className="text-white font-semibold text-sm flex-1">✦ Mención Honorífica</span>
                <ChevronDown id="mencion-chevron" className="h-4 w-4 text-accent/60 group-hover:text-accent transition-all duration-200" />
              </button>
              <div id="mencion-honorifica" className="hidden px-4 py-4 space-y-3 bg-accent/[0.04]">
                <div className="flex items-start gap-3">
                  {/* Placeholder foto */}
                  <div className="w-14 h-14 rounded-xl border border-accent/20 bg-white/[0.04] flex items-center justify-center shrink-0">
                    <ImageIcon className="h-5 w-5 text-accent/30" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Nini Geohana Chacón</p>
                    <p className="text-accent text-xs font-medium flex items-center gap-1">
                      <Heart className="h-3 w-3" /> Tía — Inspiración Fundamental
                    </p>
                  </div>
                </div>
                <blockquote className="border-l-2 border-accent/30 pl-3 italic text-white/70 text-sm leading-relaxed">
                  "Gracias a mi tía, estoy en robótica y en todo el mundo de la tecnología. Ella fue quien me dio mi primer curso de robótica y la que de algún modo sembró esa semilla en mí, que hoy está dando grandes frutos."
                </blockquote>
              </div>
            </div>

            <ul className="space-y-4 mt-5">
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
