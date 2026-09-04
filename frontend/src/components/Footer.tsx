import { useState } from "react";
import { useNavigate } from "react-router-dom";
import icono from "@/assets/icono.png";
import { useToast } from "@/hooks/use-toast";
import GradientText from "@/components/effects/GradientText";
import { ScrollReveal } from "@/components/ScrollReveal";
import SpotlightCard from "@/components/effects/SpotlightCard";
import { LoginModal } from "@/components/LoginModal";
import StarBorder from "@/components/effects/StarBorder";
import { Mail, Phone, MapPin, Lock } from "lucide-react";
import { useSiteValue } from "@/lib/siteContent";
import { navigateToSection } from "@/lib/sectionNav";
import { FramerEmbed } from "@/components/effects/FramerEmbed";

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
  { label: "Galería", href: "/galeria" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contacto", href: "#contacto" },
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
    // Nothing painted here on purpose — no fill, no ambient glow. Whatever
    // sits behind the footer (the page's own background, set by whichever
    // page renders it) shows straight through everywhere outside the
    // rounded panel below, so the footer reads as a card floating directly
    // on the page rather than another band with its own backdrop.
    <footer className="text-white/70 relative overflow-hidden">
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
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
        <div className="p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
          <ScrollReveal variant="fade-up" delay={0}>
          <SpotlightCard className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm" spotlightColor="rgba(0, 201, 167, 0.15)">
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
