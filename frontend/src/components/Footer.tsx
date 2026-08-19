import { useState } from "react";
import { useNavigate } from "react-router-dom";
import icono from "@/assets/icono.png";
import { useToast } from "@/hooks/use-toast";
import GradientText from "@/components/effects/GradientText";
import { ScrollReveal } from "@/components/ScrollReveal";
import LogoLoop from "@/components/effects/LogoLoop";
import SpotlightCard from "@/components/effects/SpotlightCard";
import { LoginModal } from "@/components/LoginModal";
import StarBorder from "@/components/effects/StarBorder";
import { Cpu, Radio, Wifi, Database, BarChart3, Globe, Shield, Zap, Mail, Phone, MapPin, Lock } from "lucide-react";
import { useSiteValue } from "@/lib/siteContent";
import { navigateToSection } from "@/lib/sectionNav";
import { FramerEmbed } from "@/components/effects/FramerEmbed";
import { BreathingGlow } from "@/components/effects/BreathingGlow";

// Published Framer.com "ProTextType": classic type/delete/pause typewriter,
// cycling through a list of strings. Only needs addPropertyControls/
// ControlType from "framer" (shimmed) plus framer-motion. Placed as a
// standalone line — not swapped in for the editable `tagline` above, which
// stays under Panel Emma's control — cycling real project facts already
// stated elsewhere on the site (ProjectSection's LoRa range spec, the
// footer's own location). Falls back to the first fact as plain static
// text if framer.com is unreachable.
const FRAMER_PRO_TEXT_TYPE_URL = "https://framer.com/m/ProTextType-KXoZ.js@zQQ6Rh7yVYyuhKxBRwZJ";
const FOOTER_TYPED_FACTS = [
  "pH · Temperatura · Turbidez — medidos cada pocos minutos",
  "Radio LoRa — hasta 5 km sin WiFi ni red celular",
  "Diseñado y ensamblado en Cali, Colombia",
];

const links = [
  { label: "Proyecto", href: "#proyecto" },
  { label: "Documentación", href: "/documentacion" },
  { label: "Galería", href: "/galeria" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contacto", href: "#contacto" },
];

const techLogos = [
  { node: <a href="https://www.espressif.com/en/products/socs/esp32" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Cpu className="h-5 w-5" /><span className="text-xs font-semibold">ESP32</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Microcontrolador IoT</span></a>, title: "ESP32" },
  { node: <a href="https://lora-alliance.org" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Radio className="h-5 w-5" /><span className="text-xs font-semibold">LoRa</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Comunicación de largo alcance</span></a>, title: "LoRa" },
  { node: <a href="https://www.wi-fi.org" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Wifi className="h-5 w-5" /><span className="text-xs font-semibold">WiFi</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Conectividad inalámbrica</span></a>, title: "WiFi" },
  { node: <a href="https://www.postgresql.org" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Database className="h-5 w-5" /><span className="text-xs font-semibold">PostgreSQL</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Base de datos relacional</span></a>, title: "PostgreSQL" },
  { node: <a href="https://grafana.com" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><BarChart3 className="h-5 w-5" /><span className="text-xs font-semibold">Grafana</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Visualización de datos</span></a>, title: "Grafana" },
  { node: <a href="https://react.dev" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Globe className="h-5 w-5" /><span className="text-xs font-semibold">React</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Interfaz de usuario</span></a>, title: "React" },
  { node: <a href="https://developer.nvidia.com/embedded/jetson-tk1" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Shield className="h-5 w-5" /><span className="text-xs font-semibold">Jetson TK1</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">GPU para edge computing</span></a>, title: "Jetson TK1" },
  { node: <a href="https://platformio.org" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Zap className="h-5 w-5" /><span className="text-xs font-semibold">PlatformIO</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">IDE para embebidos</span></a>, title: "PlatformIO" },
];

export function Footer() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const tagline = useSiteValue("footer.tagline", "M.A.N.G.O. es un dispositivo autónomo que monitorea la salud del agua en ecosistemas de manglar — registrando acidez, temperatura y turbidez de forma continua y en tiempo real.");
  const institutionsText = useSiteValue("footer.institutions.text", "Solicita acceso para tu institución o equipo de investigación ambiental.");
  const copyright = useSiteValue("footer.copyright", "M.A.N.G.O — Todos los derechos reservados");
  const legal = useSiteValue("footer.legal", "Proyecto de investigación con fines académicos y de conservación ambiental");

  const scrollTo = (href: string) => navigateToSection(navigate, href);

  const handlePhoneCopy = () => {
    navigator.clipboard.writeText("+573217693339");
    toast({ title: "Número copiado", description: "El número ha sido copiado al portapapeles." });
  };

  return (
    <footer className="bg-mango-dark text-white/70 relative overflow-hidden">
      {/* Breathing ambient glow — styled after the Framer "Breathing Footer"
          reference; see BreathingGlow.tsx for why it's reproduced natively
          instead of embedded. Sits at z-0 so every real section below
          needs relative z-10 to paint above it. */}
      <BreathingGlow />

      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(168,72%,42%)]/15 to-transparent z-10" />

      {/* Tech Stack LogoLoop */}
      <div className="border-b border-white/[0.06] py-5 overflow-visible relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-[10px] uppercase tracking-widest text-white/25 text-center mb-3 font-semibold">Tecnologías utilizadas en el proyecto</p>
          <LogoLoop
            logos={techLogos}
            speed={60}
            direction="left"
            logoHeight={28}
            gap={56}
            fadeOut
            fadeOutColor="hsl(210, 35%, 8%)"
          />
        </div>
      </div>

      {/* Liquid-glass slab — styled after the Framer "Liquid Glass Footer"
          reference (https://framer.com/m/Liquid-Glass-Footer-PpecQS.js@NwnM5wWKuZaTzAqqZTeX):
          its whole footer is one big rounded panel (gradient + layered soft
          shadow + inset bevel highlight, no real blur — it's a static
          light-mode gradient standing in for glass). We have real
          `backdrop-blur` available and a colorful page behind us, so this
          translates the same technique into actual frosted glass in our
          dark palette, letting BreathingGlow show through it. Its own real
          content (a newsletter form posting to a Framer-hosted endpoint,
          "Product/Company/Resources" link columns, social buttons with no
          real destinations, "Made by Matt") is placeholder with nothing to
          adapt honestly — no newsletter/social backend exists here — so
          only the glass panel silhouette + divider + bottom-row layout is
          reproduced; every card and function already in this footer moves
          inside it unchanged. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative z-10">
        <div className="relative overflow-hidden rounded-[32px] md:rounded-[40px] border border-white/10 bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-white/[0.05] backdrop-blur-2xl shadow-[0_24px_70px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.3)]">
        <div className="p-6 md:p-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <ScrollReveal variant="fade-up" delay={0}>
          <SpotlightCard className="sm:col-span-2 lg:col-span-1 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm" spotlightColor="rgba(0, 201, 167, 0.15)">
            <div className="flex items-center gap-2 mb-4">
              <img src={icono} alt="M.A.N.G.O" className="h-8 w-8 rounded-full" />
              <GradientText
                colors={['#00c9a7', '#38bdf8', '#c084fc', '#00c9a7']}
                animationSpeed={10}
                className="text-lg font-bold"
              >
                M.A.N.G.O
              </GradientText>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              {tagline}
            </p>
          </SpotlightCard>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={0.1}>
          <SpotlightCard className="rounded-3xl border border-white/10 bg-white/[0.02] p-6" spotlightColor="rgba(0, 201, 167, 0.15)">
            <h4 className="text-base text-white font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-1.5 -mx-3">
              {links.map((l) => (
                <li key={l.href}>
                  <button
                    onClick={() => scrollTo(l.href)}
                    className="inline-flex text-sm text-white/65 hover:text-white hover:bg-white/[0.06] rounded-full px-3 py-1.5 transition-all duration-300"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </SpotlightCard>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={0.2}>
          <SpotlightCard className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_12px_40px_hsl(var(--background)/0.12)]" spotlightColor="rgba(0, 201, 167, 0.15)">
            <h4 className="text-base text-white font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://mail.google.com/mail/?view=cm&to=mango.monitoring@integramosoe.com&su=Contacto%20-%20Proyecto%20M.A.N.G.O"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/item flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/80 hover:text-[hsl(168,72%,42%)] hover:bg-white/[0.06] transition-all duration-300 hover:translate-x-1"
                >
                  <Mail className="h-4 w-4 shrink-0 text-white/40 group-hover/item:text-[hsl(168,72%,42%)] transition-colors duration-300" />
                  Equipo M.A.N.G.O
                </a>
              </li>
              <li>
                <button onClick={handlePhoneCopy} className="group/item flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-white/80 hover:text-[hsl(168,72%,42%)] hover:bg-white/[0.06] transition-all duration-300 cursor-pointer hover:translate-x-1">
                  <Phone className="h-4 w-4 shrink-0 text-white/40 group-hover/item:text-[hsl(168,72%,42%)] transition-colors duration-300" />
                  +57 321 7693339
                </button>
              </li>
              <li>
                <a
                  href="https://www.google.com/maps/place/Cali,+Valle+del+Cauca,+Colombia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/item flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/80 hover:text-[hsl(168,72%,42%)] hover:bg-white/[0.06] transition-all duration-300 hover:translate-x-1"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-white/40 group-hover/item:text-[hsl(168,72%,42%)] transition-colors duration-300" />
                  Cali, Valle del Cauca, Colombia
                </a>
              </li>
            </ul>
          </SpotlightCard>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={0.3}>
          <SpotlightCard className="rounded-3xl border border-white/10 bg-white/[0.02] p-6" spotlightColor="rgba(0, 201, 167, 0.15)">
            <h4 className="text-base text-white font-semibold mb-4">Acceso institucional</h4>
            <p className="text-sm text-white/70">{institutionsText}</p>
            <StarBorder
              as="button"
              color="hsl(168,72%,42%)"
              speed="5s"
              className="mt-4 w-full text-sm font-semibold"
              onClick={() => setIsLoginOpen(true)}
            >
              <span className="flex items-center justify-center gap-2 px-4 py-2.5 text-white w-full">
                <Lock className="h-4 w-4" /> Acceder al sistema
              </span>
            </StarBorder>
          </SpotlightCard>
          </ScrollReveal>
        </div>
        </div>

        {/* Divider, matching the reference's own "Divider" element */}
        <div className="h-px bg-white/10 mx-6 md:mx-10" />

        {/* Bottom row: typed facts + copyright/legal, now inside the slab
            (the reference keeps its own copyright + credit row inside the
            same glass panel as the link columns above it). The giant
            low-opacity "M.A.N.G.O" wordmark sits behind it as a watermark —
            the other half of the earlier "Breathing Footer" pass' signature
            look — purely decorative, so it's hidden from assistive tech. */}
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <p
            aria-hidden="true"
            className="absolute inset-x-0 -bottom-3 md:-bottom-5 text-center font-brand font-extrabold text-white/[0.05] leading-none tracking-tight whitespace-nowrap pointer-events-none select-none overflow-hidden"
            style={{ fontSize: "clamp(3rem, 12vw, 9rem)" }}
          >
            M.A.N.G.O
          </p>

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex justify-center">
              <FramerEmbed
                moduleUrl={FRAMER_PRO_TEXT_TYPE_URL}
                componentProps={{
                  text: FOOTER_TYPED_FACTS,
                  as: "p",
                  font: { fontSize: 12 },
                  sizingMode: "fixed",
                  typingSpeed: 45,
                  deletingSpeed: 25,
                  initialDelay: 400,
                  pauseDuration: 2200,
                  loop: true,
                  startOnVisible: true,
                  showCursor: true,
                  cursorCharacterPreset: "|",
                  textColors: ["rgba(255,255,255,0.4)"],
                  textAlign: "center",
                }}
                style={{ width: "100%", height: 24 }}
                fallback={<p className="text-xs text-white/40 text-center">{FOOTER_TYPED_FACTS[0]}</p>}
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
              <p>© {new Date().getFullYear()} {copyright}</p>
              <p>{legal}</p>
            </div>
          </div>
        </div>
        </div>
      </div>
      <LoginModal open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </footer>
  );
}
