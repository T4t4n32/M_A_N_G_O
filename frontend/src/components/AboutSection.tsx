import { useState } from "react";
import { Users, ExternalLink, Star, Heart, ImageIcon, ChevronDown } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import BorderGlow from "@/components/effects/BorderGlow";
import ProfileCard from "@/components/effects/ProfileCard";
import SpotlightCard from "@/components/effects/SpotlightCard";
import { Button } from "@/components/ui/button";
import { PersonasHero } from "@/components/leader/PersonasHero";
import { SiteMediaVisual } from "@/components/SiteMediaVisual";
import calibotsLogo from "@/assets/calibots-logo.png";
import calibotsSubmerged from "@/assets/calibots-submerged.jpeg";
import padreFoto from "@/assets/padre-foto.png";
import madreFoto from "@/assets/madre-foto.png";
import sandBg from "@/assets/sand-bg.jpg";
import unearthedLogo from "@/assets/unearthed-logo.png";
import firstAgeLogo from "@/assets/first-age-logo.png";
import { useSiteValue } from "@/lib/siteContent";

export function AboutSection() {
  const [mencionOpen, setMencionOpen] = useState(false);
  const heading = useSiteValue("about.heading", "El equipo detrás de M.A.N.G.O");
  const subheading = useSiteValue("about.subheading", "Estudiantes e investigadores de Cali, Colombia, que construyeron este sistema desde cero");
  const calibotsEyebrow = useSiteValue("about.calibots.eyebrow", "Lo más reciente del equipo CALIBOTS");
  const calibotsTitle = useSiteValue("about.calibots.title", "UNEARTHED");
  const calibotsSubtitle = useSiteValue("about.calibots.subtitle", "FIRST LEGO League — Temporada 2024-2025");
  const calibotsText = useSiteValue("about.calibots.text", "CALIBOTS es el equipo de robótica que dio origen a M.A.N.G.O. Con cada temporada de FIRST LEGO League, el equipo desarrolla soluciones reales para problemas ambientales y científicos.");
  const contributorsTitle = useSiteValue("about.contributors.title", "Personas clave del proyecto");
  const pillarsDescription = useSiteValue("about.pillars.description", "");
  return (
    // No section-level background paint here — the page's own bg-mango-dark
    // (set on Sobre.tsx's <main>) carries through uninterrupted from hero to
    // footer. Painting a slightly different tone here (as before) created a
    // visible seam right where this section ended and the footer began.
    <section id="sobre" className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,hsl(168_72%_42%/0.05),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold">
            <DecryptedText
              text={heading}
              speed={40}
              maxIterations={8}
              animateOn="view"
              className="text-white"
              encryptedClassName="text-accent/40"
            />
          </h2>
          <p className="mt-3 text-white/60 max-w-2xl mx-auto">
            {subheading}
          </p>
        </div>

        {/* Personas + Librería — bio hero, then Drawer Cards + the 3D
            bookshelf, in normal document flow with scroll-reveal fades. */}
        <PersonasHero />

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent my-10" />

        <div className="text-center mb-10">
          <p className="text-accent/70 text-xs font-semibold uppercase tracking-[0.2em] mb-2">Agradecimientos</p>
          <h3 className="text-2xl md:text-3xl font-bold text-white">Raíces y apoyo del proyecto</h3>
        </div>

         {/* Bottom row: Calibots + Contribuyentes */}
         <div className="grid md:grid-cols-2 gap-8">
           {/* Calibots — order-2 on mobile so Contribuyentes appear first */}
           <BorderGlow className="order-2 md:order-1" glowColor="168 72 42" backgroundColor="hsl(var(--mango-dark, 210 40% 6%))" borderRadius={16} colors={['#00c9a7', '#38bdf8', '#c084fc']} glowIntensity={0.8} coneSpread={25}>
              <div className="relative overflow-hidden rounded-2xl min-h-[480px] flex flex-col">
                {/* Sand background with fade */}
                <div className="absolute inset-0">
                  <img
                    src={sandBg}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    width={1920}
                    height={1080}
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-[hsl(210_35%_8%/0.3)] via-[hsl(210_35%_8%/0.7)] to-[hsl(210_35%_8%/0.97)]" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-end flex-1 p-7 pt-8 text-center">
                  {/* Season logos row */}
                  <div className="flex items-center justify-center gap-5 mb-5">
                    <a href="https://www.firstlegoleague.org/" target="_blank" rel="noopener noreferrer">
                      <img
                        src={unearthedLogo}
                        alt="UNEARTHED"
                        className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg hover:scale-110 transition-transform duration-300"
                      />
                    </a>
                    <a href="https://www.firstlegoleague.org/" target="_blank" rel="noopener noreferrer">
                      <img
                        src={firstAgeLogo}
                        alt="FIRST AGE presented by Qualcomm"
                        className="h-12 md:h-16 object-contain drop-shadow-lg hover:scale-110 transition-transform duration-300"
                      />
                    </a>
                  </div>

                  <span className="text-accent/70 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
                    {calibotsEyebrow}
                  </span>

                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-1 drop-shadow-lg">
                    {calibotsTitle}
                  </h3>
                  <p className="text-accent font-semibold text-sm tracking-wide mb-5">
                    {calibotsSubtitle}
                  </p>

                  {/* Calibots logo — bigger */}
                  <div className="mb-5">
                    <a href="https://calibots.lovable.app" target="_blank" rel="noopener noreferrer">
                      <img
                        src={calibotsLogo}
                        alt="CALIBOTS"
                        className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-accent/30 bg-white/90 object-contain p-2 shadow-[0_0_30px_hsl(168_72%_42%/0.25)] hover:scale-110 transition-transform duration-300"
                      />
                    </a>
                  </div>

                  <p className="text-white/75 leading-relaxed text-sm max-w-sm mx-auto mb-6">
                    {calibotsText}
                  </p>

                  <Button
                    asChild
                    className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 py-2.5 font-semibold gap-2 shadow-[0_0_24px_hsl(168_72%_42%/0.25)] hover:shadow-[0_0_32px_hsl(168_72%_42%/0.4)] transition-all duration-300">
                    <a href="https://calibots.lovable.app" target="_blank" rel="noopener noreferrer">
                      Conoce CALIBOTS <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <SiteMediaVisual
                    fieldKey="about.calibots.media"
                    className="mt-6 max-w-md mx-auto"
                    ariaLabel="Material multimedia de CALIBOTS"
                  />
                </div>
              </div>
             </BorderGlow>

          {/* Contribuyentes */}
          <BorderGlow className="order-1 md:order-2" glowColor="35 80 50" backgroundColor="hsl(var(--mango-dark, 210 40% 6%))" borderRadius={16} colors={['#f59e0b', '#fb923c', '#fbbf24']} glowIntensity={0.8} coneSpread={25}>
            <div className="p-7 relative overflow-hidden rounded-2xl">
              {/* Warm radial background */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,hsl(35_80%_50%/0.06),transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,hsl(25_90%_55%/0.04),transparent_50%)]" />

              <div className="relative z-10">
                {/* Title with DecryptedText */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400"><Users className="h-5 w-5" /></div>
                  <h3 className="text-lg font-bold">
                    <DecryptedText
                      text={contributorsTitle}
                      speed={40}
                      maxIterations={8}
                      animateOn="view"
                      className="text-white"
                      encryptedClassName="text-amber-400/40"
                    />
                  </h3>
                </div>

                {/* Familia — ProfileCards. This label used to wrongly read
                    "Pilares Fundamentales" (copy-pasted from the Logros
                    section) instead of naming what this card actually is. */}
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">Apoyo y Mentoría</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                  {[
                    { name: "Yamileth Chacón", role: "Madre del líder del proyecto — Apoyo integral y soporte incondicional", photo: madreFoto },
                    { name: "Héctor Ignacio Sánchez", role: "Padre del líder del proyecto — Apoyo fundamental y presencia incondicional", photo: padreFoto },
                  ].map((c, i) => (
                    <ProfileCard
                      key={i}
                      avatarUrl={c.photo}
                      name={c.name}
                      title={c.role}
                      showUserInfo={false}
                      enableTilt={true}
                      innerGradient="linear-gradient(145deg, hsl(35 80% 50% / 0.2) 0%, hsl(25 70% 40% / 0.15) 100%)"
                      behindGlowEnabled={true}
                      behindGlowColor="hsla(35, 80%, 50%, 0.3)"
                      className="!w-full sm:!w-auto"
                    />
                  ))}
                </div>
                {pillarsDescription && (
                  <p className="text-white/65 text-xs leading-relaxed text-justify max-w-md mx-auto mb-4">
                    {pillarsDescription}
                  </p>
                )}
                <SiteMediaVisual
                  fieldKey="about.pillars.media"
                  className="mb-6"
                  ariaLabel="Galería de apoyo y mentoría"
                />

                {/* Mención Honorífica — SpotlightCard collapsible */}
                <SpotlightCard
                  className="rounded-2xl mb-6"
                  spotlightColor="rgba(245, 158, 11, 0.12)"
                >
                  <div className="rounded-2xl border border-amber-500/20 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setMencionOpen((v) => !v)}
                      aria-expanded={mencionOpen}
                      aria-controls="mencion-honorifica"
                      className="w-full flex items-center gap-3 px-4 py-3 bg-amber-500/[0.08] hover:bg-amber-500/[0.14] transition-colors text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                    >
                      <Star className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="text-white font-semibold text-sm flex-1">✦ Mención Honorífica</span>
                      <ChevronDown
                        className={`h-4 w-4 text-amber-400/60 group-hover:text-amber-400 transition-transform duration-200 ${mencionOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div
                      id="mencion-honorifica"
                      role="region"
                      aria-label="Mención honorífica"
                      hidden={!mencionOpen}
                      className="px-4 py-4 space-y-3 bg-amber-500/[0.04]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl border border-amber-500/20 bg-white/[0.04] flex items-center justify-center shrink-0">
                          <ImageIcon className="h-5 w-5 text-amber-400/30" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">Nini Geohana Chacón</p>
                          <p className="text-amber-400 text-xs font-medium flex items-center gap-1">
                            <Heart className="h-3 w-3" /> Tía — Inspiración Fundamental
                          </p>
                        </div>
                      </div>
                      <blockquote className="border-l-2 border-amber-500/30 pl-3 italic text-white/70 text-sm leading-relaxed">
                        "Gracias a mi tía, estoy en robótica y en todo el mundo de la tecnología. Ella fue quien me dio mi primer curso de robótica y la que de algún modo sembró esa semilla en mí, que hoy está dando grandes frutos."
                      </blockquote>
                    </div>
                  </div>
                </SpotlightCard>

                {/* Contribuyentes individuales — Grid de SpotlightCards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { name: "Samuel Monsalve", role: "Co-desarrollo inicial" },
                    { name: "Prof. Víctor Mario Perilla", role: "Asesoría electrónica/mecatrónica" },
                    { name: "Richard Suarez", role: "Asesoría técnica" },
                    { name: "CALIBOTS — Temp. Submerged", role: "Equipo en la temporada Submerged — base del proyecto M.A.N.G.O", photo: calibotsSubmerged },
                  ] as Array<{ name: string; role: string; photo?: string }>).map((c, i) => (
                    <SpotlightCard
                      key={i}
                      className="rounded-2xl"
                      spotlightColor="rgba(245, 158, 11, 0.1)"
                    >
                      <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex items-center gap-3">
                        {c.photo ? (
                          <img src={c.photo} alt={c.name} className="w-12 h-12 rounded-full border border-amber-500/20 object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                            {c.name[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium text-sm">{c.name}</p>
                          <p className="text-white/50 text-xs">{c.role}</p>
                        </div>
                      </div>
                    </SpotlightCard>
                  ))}
                </div>
                <SiteMediaVisual
                  fieldKey="about.contributors.media"
                  className="mt-6"
                  ariaLabel="Material multimedia de contribuyentes"
                />
              </div>
            </div>
          </BorderGlow>
        </div>
      </div>
    </section>);
}
