import { useRef, useState, useEffect } from "react";
import {
  GraduationCap,
  Cpu,
  Eye,
  ExternalLink,
  Youtube,
  ChevronDown,
  Wrench,
  Swords,
  Recycle,
  Trophy,
  RotateCcw,
  Sparkles,
  Leaf,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import GradientText from "@/components/effects/GradientText";
import liderFoto from "@/assets/lider-foto.jpg";
import { useSiteValue } from "@/lib/siteContent";
import { parseValue, useResolvedSrc } from "@/lib/siteMedia";
import { SiteMediaVisual } from "@/components/SiteMediaVisual";
import ImmersivePanel from "./ImmersivePanel";
import { milestones } from "./leaderData";
import type { MilestoneData } from "./leaderData";

const YOUTUBE_CHANNEL = "https://youtube.com/@tatan_32?si=PV-gF7wt1bdklHtR";

const sportImages = [
  { src: "/images/sports/intercolegiados-1.jpg", alt: "Premiación en podio — Intercolegiados" },
  { src: "/images/sports/intercolegiados-2.jpg", alt: "Equipo celebrando con trofeo" },
  { src: "/images/sports/intercolegiados-3.jpg", alt: "Medalla de oro y trofeo de campeonato" },
];

const inicisMilestone = milestones.find((m) => m.id === "inicios")!;
const robisoftMilestone = milestones.find((m) => m.id === "robisoft")!;
const ecolatasMilestone = milestones.find((m) => m.id === "ecolatas")!;

interface ChipMilestoneColor {
  glow: string;
  accent: string;
  border: string;
  Icon: LucideIcon;
  logo: string;
}

const chipMilestoneColors: Record<string, ChipMilestoneColor> = {
  inicios: {
    glow: "rgba(0,201,167,0.22)",
    accent: "hsl(168 72% 42%)",
    border: "rgba(0,201,167,0.3)",
    Icon: Wrench,
    logo: "/images/milestones/sbtds_logo.png",
  },
  robisoft: {
    glow: "rgba(249,115,22,0.22)",
    accent: "hsl(25 95% 55%)",
    border: "rgba(249,115,22,0.3)",
    Icon: Swords,
    logo: "/images/milestones/robisoft_logo.png",
  },
  ecolatas: {
    glow: "rgba(34,197,94,0.22)",
    accent: "hsl(142 60% 45%)",
    border: "rgba(34,197,94,0.3)",
    Icon: Recycle,
    logo: "/images/gallery/leader/ecolatas_logo.png",
  },
};

type ChipId = "inicios" | "vision";

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return prefers;
}

function track(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window !== "undefined") {
    const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
    if (dl) dl.push({ event, ...payload });
    window.dispatchEvent(new CustomEvent("vision-hero:track", { detail: { event, ...payload } }));
  }
}

function TrophyCarousel({ paused }: { paused: boolean }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (paused || sportImages.length <= 1) return;
    const id = setInterval(() => setCurrent((p) => (p + 1) % sportImages.length), 2500);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div className="relative w-full h-full">
      {sportImages.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={img.alt}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" aria-hidden="true">
        {sportImages.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current ? "bg-amber-400 w-4" : "bg-white/40 w-1.5"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function MilestoneChipCard({
  milestone,
  colors,
  onClick,
  fullWidth = false,
}: {
  milestone: MilestoneData;
  colors: ChipMilestoneColor;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  const preview = milestone.media.find((m) => m.type === "image");
  const Icon = colors.Icon;
  return (
    <button
      onClick={onClick}
      className={`group relative rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-100 ${fullWidth ? "w-full" : ""}`}
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.glow.replace("0.22", "0.05"),
        boxShadow: `0 0 18px ${colors.glow.replace("0.22", "0.08")}`,
      }}
    >
      {preview && (
        <div className="relative h-28 overflow-hidden">
          <img
            src={preview.src}
            alt={preview.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210_35%_8%)] via-[hsl(210_35%_8%)]/30 to-transparent" />
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <div
            className="p-1 rounded-md flex-shrink-0"
            style={{ background: colors.glow.replace("0.22", "0.25") }}
          >
            <Icon className="h-3 w-3" style={{ color: colors.accent }} />
          </div>
          <div className="min-w-0">
            <p className="text-white/90 text-xs font-semibold leading-tight truncate">{milestone.title}</p>
            <p className="text-white/40 text-[10px]">{milestone.year}</p>
          </div>
        </div>
        <p className="text-white/55 text-[11px] leading-relaxed line-clamp-2">{milestone.description}</p>
        <span
          className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ color: colors.accent }}
        >
          Ver detalles →
        </span>
      </div>
    </button>
  );
}

export default function VisionHero() {
  const [flipped, setFlipped] = useState(false);
  const [expandedChip, setExpandedChip] = useState<ChipId | null>(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Editable fields
  const raw = useSiteValue("about.leader.photo", "");
  const parsed = raw ? parseValue(raw) : null;
  const desc = Array.isArray(parsed) ? parsed[0] ?? null : parsed;
  const overrideUrl = useResolvedSrc(desc);
  const photoSrc = overrideUrl || liderFoto;
  const photoAlt = desc?.alt || "Sebastián Sánchez Chacón";
  const extraDescription = useSiteValue("about.vision.description", "");
  const flipEyebrow = useSiteValue("about.vision.flip.eyebrow", "Logro Destacado");
  const flipTitle = useSiteValue("about.vision.flip.title", "1er Puesto");
  const flipSubtitle = useSiteValue("about.vision.flip.subtitle", "Intercolegiados");
  const flipDescription = useSiteValue(
    "about.vision.flip.description",
    "Campeón Juegos Intercolegiados — Colegio Coomeva, Cali."
  );

  const toggleFlip = (source: "click" | "keyboard") => {
    setFlipped((f) => {
      track("vision_hero_flip", { source, flipped: !f });
      return !f;
    });
  };

  const toggleChip = (id: ChipId) => {
    setExpandedChip((prev) => (prev === id ? null : id));
    setActiveMilestoneId(null);
  };

  const activeMilestone =
    activeMilestoneId === "inicios"
      ? inicisMilestone
      : activeMilestoneId === "robisoft"
      ? robisoftMilestone
      : activeMilestoneId === "ecolatas"
      ? ecolatasMilestone
      : null;

  const activeMilestoneColors = activeMilestoneId
    ? chipMilestoneColors[activeMilestoneId]
    : null;

  return (
    <div className="mb-16">
      <div className="relative rounded-2xl border border-white/[0.06] p-6 md:p-10 bg-gradient-to-br from-accent/[0.06] via-transparent to-transparent overflow-visible">
        {/* Decorative glows */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2 mb-8">
          <div className="w-1 h-6 rounded-full bg-accent" />
          <h3 className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em]">
            Visión y Liderazgo
          </h3>
        </div>

        {/* Main layout */}
        <div className="relative grid md:grid-cols-[260px_1fr] gap-8 md:gap-10 items-start">

          {/* ─── Flip Card ─── */}
          <div
            style={{ perspective: "1200px" }}
            className="relative mx-auto w-full max-w-[260px]"
          >
            {/* Pulsing accent ring — front only, respects reduced-motion */}
            {!prefersReducedMotion && !flipped && (
              <div
                className="absolute -inset-1.5 rounded-[22px] border border-accent/30 animate-pulse pointer-events-none z-10"
                aria-hidden="true"
              />
            )}

            <button
              ref={cardRef}
              onClick={() => toggleFlip("click")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleFlip("keyboard");
                }
              }}
              aria-pressed={flipped}
              aria-label={
                flipped
                  ? "Ver foto del desarrollador"
                  : "Ver logro — 1er Puesto Intercolegiados"
              }
              aria-describedby="vision-hero-flip-hint"
              className={`relative w-full aspect-[3/4] block [transform-style:preserve-3d] rounded-2xl
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/70
                focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(210_35%_8%)]
                ${prefersReducedMotion ? "" : "transition-[transform] duration-700 ease-in-out"}`}
              style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              {/* ── Front: photo ── */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <img
                  src={photoSrc}
                  alt={photoAlt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210_35%_8%)] via-transparent to-transparent opacity-70" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

                {/* Top hint — hidden on very small / reduced-motion */}
                {!prefersReducedMotion && (
                  <div
                    className="absolute top-3 left-3 right-3 hidden sm:flex items-center gap-1 opacity-65"
                    aria-hidden="true"
                  >
                    <Sparkles className="h-3 w-3 text-accent flex-shrink-0" />
                    <span className="text-accent text-[9px] font-medium">
                      Toca para descubrir más
                    </span>
                  </div>
                )}

                {/* Bottom overlays */}
                <div className="absolute bottom-4 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Leaf className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                    <span className="text-accent text-[9px] font-semibold uppercase tracking-wide">
                      Desarrollador Principal
                    </span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <RotateCcw className="h-3 w-3 text-white/70" />
                    <span className="text-white/60 text-[9px]">Voltear</span>
                  </div>
                </div>
              </div>

              {/* ── Back: achievement ── */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background:
                    "linear-gradient(160deg, hsl(30 40% 8%) 0%, hsl(210 35% 8%) 100%)",
                }}
              >
                {/* Amber radial glow */}
                <div
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,hsl(40_90%_50%/0.12),transparent_65%)]"
                  aria-hidden="true"
                />

                {/* Header */}
                <div className="relative flex flex-col items-center pt-6 px-4 gap-0.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-1">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-amber-400/70 text-[9px] font-semibold uppercase tracking-widest">
                    {flipEyebrow}
                  </p>
                  <h3 className="text-white font-black text-2xl leading-none">{flipTitle}</h3>
                  <p className="text-amber-400 font-semibold text-sm">{flipSubtitle}</p>
                </div>

                {/* Carousel */}
                <div className="relative flex-1 mx-3 mt-3 rounded-xl overflow-hidden border border-amber-500/15 min-h-0">
                  <TrophyCarousel paused={!flipped} />
                </div>

                {/* Description */}
                <p className="relative text-white/45 text-[10px] text-center leading-relaxed px-4 pt-2">
                  {flipDescription}
                </p>

                {/* Flip back hint */}
                <div className="relative flex justify-center pb-4 pt-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.08] border border-white/[0.12]">
                    <RotateCcw className="h-3 w-3 text-white/60" />
                    <span className="text-white/50 text-[9px]">Voltear</span>
                  </div>
                </div>
              </div>
            </button>

            <span id="vision-hero-flip-hint" className="sr-only">
              Presiona Enter o Espacio para voltear y ver el logro destacado del desarrollador
            </span>
          </div>

          {/* ─── Text content ─── */}
          <div className="flex flex-col space-y-6">
            {/* Name & role */}
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                <DecryptedText
                  text="Sebastián Sánchez Chacón"
                  speed={35}
                  maxIterations={6}
                  animateOn="view"
                  className="text-white"
                  encryptedClassName="text-accent/30"
                />
              </h2>
              <GradientText
                className="text-base md:text-lg font-medium"
                colors={["#00c9a7", "#38bdf8", "#c084fc", "#00c9a7"]}
                animationSpeed={6}
              >
                Líder de Desarrollo — M.A.N.G.O
              </GradientText>
            </div>

            <p className="text-white/60 text-sm md:text-base leading-relaxed text-justify max-w-xl">
              Estudiante y líder técnico con una trayectoria forjada en competencias de robótica
              a nivel nacional e internacional. Combina electrónica, programación y visión ambiental
              para desarrollar tecnología con propósito.
            </p>

            <div className="w-full h-px bg-gradient-to-r from-accent/20 via-white/[0.06] to-transparent" />

            {/* Three pillar chips + expandable panels */}
            <div>
              <div className="grid sm:grid-cols-3 gap-3">
                {/* FORMACIÓN — link to YouTube channel */}
                <a
                  href={YOUTUBE_CHANNEL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.04] hover:bg-red-500/[0.10] hover:border-red-500/40 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="relative p-2.5 rounded-xl bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <p className="text-white/90 text-xs font-semibold uppercase tracking-wider">Formación</p>
                  <p className="text-white/50 text-xs leading-relaxed text-justify">
                    Comfandi El Prado · Técnico en Electrónica (SENA)
                  </p>
                  <span className="inline-flex items-center gap-1 mt-auto text-[10px] font-semibold text-red-400/80 group-hover:text-red-400 uppercase tracking-wider transition-colors">
                    <Youtube className="h-3 w-3" />
                    Ver canal
                    <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                  </span>
                </a>

                {/* INICIOS — expandable */}
                <button
                  onClick={() => toggleChip("inicios")}
                  aria-expanded={expandedChip === "inicios"}
                  aria-controls="inicios-expansion"
                  className={`group relative flex flex-col items-center text-center gap-2 p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                    expandedChip === "inicios"
                      ? "border-accent/40 bg-accent/[0.10]"
                      : "border-accent/[0.08] bg-accent/[0.04] hover:bg-accent/[0.08] hover:border-accent/20"
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-b from-accent/[0.08] to-transparent pointer-events-none transition-opacity duration-300 ${
                      expandedChip === "inicios"
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                  <div className="relative p-2.5 rounded-xl bg-accent/10 text-accent">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <p className="text-white/90 text-xs font-semibold uppercase tracking-wider">Inicios</p>
                  <p className="text-white/50 text-xs leading-relaxed text-justify">
                    Robótica educativa desde temprana edad — Scratch + SB-TDS
                  </p>
                  <span className="inline-flex items-center gap-1 mt-auto text-[10px] font-semibold text-accent/70 group-hover:text-accent uppercase tracking-wider transition-colors">
                    Explorar
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-300 ${
                        expandedChip === "inicios" ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>

                {/* VISIÓN — expandable */}
                <button
                  onClick={() => toggleChip("vision")}
                  aria-expanded={expandedChip === "vision"}
                  aria-controls="vision-expansion"
                  className={`group relative flex flex-col items-center text-center gap-2 p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                    expandedChip === "vision"
                      ? "border-emerald-400/40 bg-emerald-400/[0.10]"
                      : "border-emerald-400/[0.08] bg-emerald-400/[0.04] hover:bg-emerald-400/[0.08] hover:border-emerald-400/20"
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-b from-emerald-400/[0.08] to-transparent pointer-events-none transition-opacity duration-300 ${
                      expandedChip === "vision"
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                  <div className="relative p-2.5 rounded-xl bg-emerald-400/10 text-emerald-400">
                    <Eye className="h-4 w-4" />
                  </div>
                  <p className="text-white/90 text-xs font-semibold uppercase tracking-wider">Visión</p>
                  <p className="text-white/50 text-xs leading-relaxed text-justify">
                    Tecnología al servicio de la conservación de ecosistemas marítimos
                  </p>
                  <span className="inline-flex items-center gap-1 mt-auto text-[10px] font-semibold text-emerald-400/70 group-hover:text-emerald-400 uppercase tracking-wider transition-colors">
                    Explorar
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-300 ${
                        expandedChip === "vision" ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>
              </div>

              {/* Expansion — Inicios */}
              <div
                id="inicios-expansion"
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedChip === "inicios"
                    ? "max-h-[700px] opacity-100 mt-4"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-0.5 h-5 rounded-full bg-accent" />
                    <span className="text-accent text-xs font-semibold uppercase tracking-widest">
                      Inicios del Creador — Sebastián Sánchez
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <MilestoneChipCard
                      milestone={inicisMilestone}
                      colors={chipMilestoneColors.inicios}
                      onClick={() => setActiveMilestoneId("inicios")}
                    />
                    <MilestoneChipCard
                      milestone={robisoftMilestone}
                      colors={chipMilestoneColors.robisoft}
                      onClick={() => setActiveMilestoneId("robisoft")}
                    />
                  </div>
                </div>
              </div>

              {/* Expansion — Visión */}
              <div
                id="vision-expansion"
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedChip === "vision"
                    ? "max-h-[500px] opacity-100 mt-4"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.03] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-0.5 h-5 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">
                      Origen del Compromiso Ambiental
                    </span>
                  </div>
                  <MilestoneChipCard
                    milestone={ecolatasMilestone}
                    colors={chipMilestoneColors.ecolatas}
                    onClick={() => setActiveMilestoneId("ecolatas")}
                    fullWidth
                  />
                </div>
              </div>
            </div>


          </div>
        </div>

        {(extraDescription || true) && (
          <div className="relative mt-8 space-y-4">
            {extraDescription && (
              <p className="text-white/65 text-sm md:text-base leading-relaxed text-justify max-w-3xl mx-auto">
                {extraDescription}
              </p>
            )}
            <SiteMediaVisual
              fieldKey="about.vision.media"
              className="max-w-3xl mx-auto"
              ariaLabel="Galería del Desarrollador Principal"
            />
          </div>
        )}
      </div>

      {/* ImmersivePanel for chip expansions */}
      {activeMilestone && activeMilestoneColors && (
        <ImmersivePanel
          isOpen={!!activeMilestoneId}
          onClose={() => setActiveMilestoneId(null)}
          title={activeMilestone.title}
          subtitle={activeMilestone.subtitle}
          description={activeMilestone.description}
          narrative={activeMilestone.narrative}
          accentColor={activeMilestoneColors.accent}
          media={activeMilestone.media}
          headerIcon={activeMilestoneColors.logo}
          extraContent={
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
              <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
                Importancia
              </h3>
              <p className="text-white/70 text-sm leading-relaxed text-justify">
                {activeMilestone.importance}
              </p>
            </div>
          }
        />
      )}
    </div>
  );
}
