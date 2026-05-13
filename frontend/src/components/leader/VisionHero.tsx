import { useRef, useState } from "react";
import { GraduationCap, Cpu, Eye, Leaf, ExternalLink } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import GradientText from "@/components/effects/GradientText";
import { SportsAchievements } from "@/components/SportsAchievements";
import liderFoto from "@/assets/lider-foto.jpg";
import { useSiteValue } from "@/lib/siteContent";
import { parseValue, useResolvedSrc } from "@/lib/siteMedia";
import { SiteMediaVisual } from "@/components/SiteMediaVisual";

const YOUTUBE_URL = "https://youtube.com/playlist?list=PLihEHjHiZwltNIlYLmrEdUG3jRNTNPq0M";

const chips = [
  {
    icon: GraduationCap,
    label: "Formación",
    text: "Comfandi El Prado · Técnico en Electrónica (SENA)",
  },
  {
    icon: Cpu,
    label: "Inicios",
    text: "Robótica educativa desde temprana edad — Scratch + SB-TDS",
  },
  {
    icon: Eye,
    label: "Visión",
    text: "Tecnología al servicio de la conservación de ecosistemas marítimos",
  },
];

export default function VisionHero() {
  const imgRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Foto editable desde el panel super-admin (about.leader.photo).
  // Si no hay override, usamos el asset original.
  const raw = useSiteValue("about.leader.photo", "");
  const parsed = raw ? parseValue(raw) : null;
  const desc = Array.isArray(parsed) ? parsed[0] ?? null : parsed;
  const overrideUrl = useResolvedSrc(desc);
  const photoSrc = overrideUrl || liderFoto;
  const photoAlt = desc?.alt || "Sebastián Sánchez Chacón";
  const extraDescription = useSiteValue("about.vision.description", "");

  const handleMove = (e: React.MouseEvent) => {
    const el = imgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <div className="mb-16">
      <div className="relative rounded-2xl border border-white/[0.06] p-6 md:p-10 bg-gradient-to-br from-accent/[0.06] via-transparent to-transparent overflow-visible">
        {/* Decorative glows */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-2 mb-8">
          <div className="w-1 h-6 rounded-full bg-accent" />
          <h3 className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em]">
            Visión y Liderazgo
          </h3>
        </div>

        {/* Main layout: photo + info */}
        <div className="relative grid md:grid-cols-[260px_1fr] gap-8 md:gap-10 items-start">
          {/* Photo with tilt */}
          <div
            ref={imgRef}
            onMouseMove={handleMove}
            onMouseLeave={resetTilt}
            className="relative mx-auto w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden cursor-crosshair"
            style={{
              transform: `perspective(800px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
              transition: "transform 0.15s ease-out",
            }}
          >
            <img
              src={photoSrc}
              alt={photoAlt}
              className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210_35%_8%)] via-transparent to-transparent opacity-60" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-1.5">
                <Leaf className="h-3.5 w-3.5 text-accent" />
                <span className="text-accent text-[10px] font-semibold uppercase tracking-wider">Desarrollador Principal</span>
              </div>
            </div>
          </div>

          {/* Text content */}
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

            {/* Description */}
            <p className="text-white/60 text-sm md:text-base leading-relaxed text-justify max-w-xl">
              Estudiante y líder técnico con una trayectoria forjada en competencias de
              robótica a nivel nacional e internacional. Combina electrónica, programación y visión
              ambiental para desarrollar tecnología con propósito.
            </p>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-accent/20 via-white/[0.06] to-transparent" />

            {/* Narrative chips */}
            <div className="grid sm:grid-cols-3 gap-3">
              {chips.map((chip) => (
                <div
                  key={chip.label}
                  className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border bg-accent/[0.04] border-accent/[0.08] hover:bg-accent/[0.08] hover:border-accent/20 transition-all duration-300"
                >
                  <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                    <chip.icon className="h-4 w-4" />
                  </div>
                  <p className="text-white/90 text-xs font-semibold uppercase tracking-wider">{chip.label}</p>
                  <p className="text-white/50 text-xs leading-relaxed text-justify">{chip.text}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-3">
              <SportsAchievements />
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500/[0.08] border border-red-500/[0.12] text-red-400/90 text-xs font-medium hover:bg-red-500/[0.14] hover:border-red-500/25 transition-all duration-300 shadow-[0_0_12px_hsl(0_70%_50%/0.06)]"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                Mi Historia Académica
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
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
    </div>
  );
}
