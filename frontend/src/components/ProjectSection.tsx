import { lazy, Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Cpu, FlaskConical, BarChart3, Globe, Lock, LogIn, Mail, ChevronLeft, ChevronRight, Box as BoxIcon, ExternalLink } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import GradientText from "@/components/effects/GradientText";
import BorderGlow from "@/components/effects/BorderGlow";
import StarBorder from "@/components/effects/StarBorder";
import { useSiteValue } from "@/lib/siteContent";
import { parseValue, useResolvedSrc, MediaDescriptor } from "@/lib/siteMedia";

const ModelViewer = lazy(() => import("@/components/effects/ModelViewer"));

const MODEL_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb";

const tabsBase = [
  {
    value: "que-es",
    keyPrefix: "queEs",
    label: "¿Qué es?",
    title: "¿Qué es M.A.N.G.O?",
    text: "M.A.N.G.O es un sistema de monitoreo ambiental autónomo diseñado para medir y registrar en tiempo real las condiciones de los ecosistemas de manglar. Combina sensores avanzados, conectividad IoT y análisis de datos para ofrecer información precisa a instituciones de investigación y conservación.",
    icon: Globe,
    glowColors: ['#00c9a7', '#38bdf8', '#00c9a7'] as string[],
    has3D: true,
  },
  {
    value: "componentes",
    keyPrefix: "componentes",
    label: "Componentes",
    title: "Componentes del Sistema",
    text: "El sistema integra sensores de temperatura, pH, salinidad, turbidez y nivel de agua. Cuenta con una unidad de procesamiento central basada en microcontroladores, módulos de comunicación inalámbrica y una plataforma web para visualización de datos.",
    icon: Cpu,
    glowColors: ['#38bdf8', '#c084fc', '#38bdf8'] as string[],
  },
  {
    value: "metodologia",
    keyPrefix: "metodologia",
    label: "Metodología",
    title: "Metodología de Desarrollo",
    text: "Se emplea una metodología de prototipado iterativo, comenzando con investigación de campo en ecosistemas de manglar, seguida de diseño electrónico, programación de firmware, pruebas de laboratorio y validación en campo.",
    icon: FlaskConical,
    glowColors: ['#c084fc', '#f472b6', '#c084fc'] as string[],
  },
  {
    value: "funciones",
    keyPrefix: "funciones",
    label: "Funciones",
    title: "Funciones Principales",
    text: "Mapeo y registro periódico de las condiciones ambientales del manglar, alertas automáticas ante parámetros fuera de rango, generación de reportes con datos históricos y exportación de información para análisis científico avanzado.",
    icon: Activity,
    glowColors: ['#00c9a7', '#eab308', '#00c9a7'] as string[],
  },
  {
    value: "impacto",
    keyPrefix: "impacto",
    label: "Impacto",
    title: "Impacto Ambiental",
    text: "M.A.N.G.O permite la detección temprana de degradación ambiental, apoya la toma de decisiones para políticas de conservación, y genera datos confiables para investigaciones sobre cambio climático y salud de ecosistemas costeros.",
    icon: BarChart3,
    glowColors: ['#38bdf8', '#00c9a7', '#38bdf8'] as string[],
  },
  {
    value: "acceso",
    keyPrefix: "acceso",
    label: "Acceso",
    title: "Acceso al Sistema",
    text: "El acceso a la plataforma de datos está restringido a instituciones autorizadas vinculadas a proyectos de investigación ambiental. Se requieren credenciales institucionales para consultar información en tiempo real y datos históricos.",
    hasActions: true,
    icon: Lock,
    glowColors: ['#eab308', '#f97316', '#eab308'] as string[],
  },
];

export function ProjectSection() {
  const heading = useSiteValue("project.heading", "El Proyecto");
  const subheading = useSiteValue("project.subheading", "Conoce en detalle el sistema de monitoreo ambiental M.A.N.G.O");
  const queEsImage = useSiteValue("project.queEs.image", "");
  const tabsData = tabsBase.map((t) => ({ ...t }));
  return (
    <section id="proyecto" className="py-20 md:py-28 bg-mango-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,hsl(204_70%_53%/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,hsl(168_72%_42%/0.06),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-3">
            <DecryptedText
              text={heading}
              speed={40}
              maxIterations={8}
              animateOn="view"
              className="text-white"
              encryptedClassName="text-[hsl(168,72%,42%)]/50"
            />
          </h2>
          <p className="mt-3 text-white/50 max-w-2xl mx-auto text-lg">
            <GradientText
              colors={['#94a3b8', '#00c9a7', '#38bdf8', '#94a3b8']}
              animationSpeed={12}
              className="text-lg"
            >
              {subheading}
            </GradientText>
          </p>
        </div>

        <Tabs defaultValue="que-es" className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-1 sm:gap-1.5 bg-transparent h-auto p-0 mb-10">
            {tabsData.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="relative px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold border
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(168,72%,42%)] data-[state=active]:to-[hsl(204,70%,53%)]
                  data-[state=active]:text-white data-[state=active]:border-white/30
                  data-[state=active]:shadow-[0_0_22px_hsl(168_72%_42%/0.55)]
                  data-[state=active]:ring-2 data-[state=active]:ring-[hsl(168,72%,55%)]/40 data-[state=active]:ring-offset-2 data-[state=active]:ring-offset-mango-dark
                  data-[state=inactive]:bg-white/[0.04] data-[state=inactive]:text-white/70 data-[state=inactive]:border-white/15
                  data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/[0.08] data-[state=inactive]:hover:border-white/25
                  transition-all duration-300"
                aria-label={`Sección ${tab.label}`}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabsData.map((tab) => {
            const Icon = tab.icon;
            const TabBody = () => {
              const label = useSiteValue(`project.${tab.keyPrefix}.label`, tab.label);
              const title = useSiteValue(`project.${tab.keyPrefix}.title`, tab.title);
              const text = useSiteValue(`project.${tab.keyPrefix}.text`, tab.text);
              return (
                <>
                  <div className="inline-flex items-center gap-2 text-[hsl(168,72%,42%)] px-4 py-2 rounded-full text-sm font-medium mb-4 bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{title}</h3>
                  <p className="text-white/60 leading-relaxed text-lg">{text}</p>
                </>
              );
            };
            const TabVisual = () => {
              const mediaRaw = useSiteValue(`project.${tab.keyPrefix}.media`, "");
              const v = parseValue(mediaRaw);
              const list: MediaDescriptor[] = !v ? [] : Array.isArray(v) ? v : [v];
              if (list.length > 0) {
                return <MediaVisual items={list} fallbackIcon={Icon} glowColors={tab.glowColors} />;
              }
              if ('has3D' in tab && tab.has3D && queEsImage) {
                return (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10">
                    <img src={queEsImage} alt="¿Qué es M.A.N.G.O?" className="w-full h-full object-cover" />
                  </div>
                );
              }
              if ('has3D' in tab && tab.has3D) {
                return (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10">
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Icon className="h-20 w-20 text-white/10 animate-pulse" /></div>}>
                      <ModelViewer url={MODEL_URL} autoRotate autoRotateSpeed={0.35} enableHoverRotation environmentPreset="forest" />
                    </Suspense>
                  </div>
                );
              }
              return (
                <BorderGlow borderRadius={20} glowRadius={25} glowIntensity={0.6} colors={tab.glowColors} className="aspect-video">
                  <div className="w-full h-full flex items-center justify-center bg-transparent rounded-[20px]">
                    <Icon className="h-20 w-20 text-white/10" />
                  </div>
                </BorderGlow>
              );
            };
            return (
              <TabsContent key={tab.value} value={tab.value}>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <TabBody />
                    {'hasActions' in tab && tab.hasActions && (
                      <div className="flex flex-wrap gap-3 mt-6">
                        <StarBorder
                          as="a"
                          href="/login"
                          color="hsl(168,72%,42%)"
                          speed="5s"
                          className="font-semibold text-base shadow-[0_0_25px_hsl(168_72%_42%/0.35)] hover:shadow-[0_0_40px_hsl(168_72%_42%/0.5)] transition-shadow duration-300"
                        >
                          <span className="flex items-center gap-2.5 px-8 py-3 text-white bg-[hsl(168,72%,42%)]/10 rounded-full">
                            <LogIn className="h-5 w-5" /> Acceder al sistema
                          </span>
                        </StarBorder>
                        <StarBorder
                          as="a"
                          href="#contacto"
                          color="rgba(56, 189, 248, 0.8)"
                          speed="6s"
                          className="font-semibold text-base shadow-[0_0_20px_hsl(204_70%_53%/0.25)] hover:shadow-[0_0_35px_hsl(204_70%_53%/0.4)] transition-shadow duration-300"
                        >
                          <span className="flex items-center gap-2.5 px-8 py-3 text-white bg-[hsl(204,70%,53%)]/10 rounded-full">
                            <Mail className="h-5 w-5" /> Solicitar acceso
                          </span>
                        </StarBorder>
                      </div>
                    )}
                  </div>
                  <TabVisual />
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* M.A.N.G.O. Videos — CTA audiovisual del proyecto */}
        <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-center sm:text-left">
            <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-1">
              Documentación audiovisual
            </p>
            <p className="text-white/55 text-sm">
              Registro en video del desarrollo y los avances del proyecto
            </p>
          </div>
          <a
            href="https://youtube.com/playlist?list=PLihEHjHiZwltNIlYLmrEdUG3jRNTNPq0M"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-red-500/[0.08] border border-red-500/[0.15] text-red-400 text-sm font-semibold hover:bg-red-500/[0.14] hover:border-red-500/30 transition-all duration-300 whitespace-nowrap shadow-[0_0_20px_hsl(0_70%_50%/0.06)] flex-shrink-0"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
            </svg>
            M.A.N.G.O. Videos
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ───────── Helper: render media descriptors as image/video/3D/gallery ───────── */

function SingleMedia({ d }: { d: MediaDescriptor }) {
  const url = useResolvedSrc(d);
  if (!url) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/40">
        <BoxIcon className="h-12 w-12" />
        <span className="text-xs">{d.name}</span>
      </div>
    );
  }
  if (d.type === "image") {
    return <img src={url} alt={d.name} className="w-full h-full object-cover" />;
  }
  if (d.type === "video") {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video src={url} controls className="w-full h-full object-cover bg-black" />
    );
  }
  if (d.type === "model") {
    if (/\.(glb|gltf)$/i.test(d.name)) {
      return (
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white/30">Cargando 3D…</div>}>
          <ModelViewer url={url} autoRotate autoRotateSpeed={0.35} enableHoverRotation environmentPreset="forest" />
        </Suspense>
      );
    }
    // .stl / .step → no in-browser viewer wired yet, show meta + download
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/60 p-4 text-center">
        <BoxIcon className="h-12 w-12 text-white/40" />
        <p className="text-sm font-medium text-white">{d.name}</p>
        <p className="text-xs text-white/40">Modelo 3D disponible para descarga</p>
        <a href={url} download={d.name} className="text-xs text-accent underline">Descargar</a>
      </div>
    );
  }
  return null;
}

function MediaVisual({ items, fallbackIcon: Icon, glowColors }: {
  items: MediaDescriptor[];
  fallbackIcon: typeof Globe;
  glowColors: string[];
}) {
  const [idx, setIdx] = useState(0);
  const cur = items[Math.min(idx, items.length - 1)];
  return (
    <BorderGlow borderRadius={20} glowRadius={25} glowIntensity={0.5} colors={glowColors} className="aspect-video">
      <div className="relative w-full h-full overflow-hidden rounded-[20px] bg-white/[0.03]">
        <SingleMedia d={cur} />
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/80 backdrop-blur"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % items.length)}
              aria-label="Siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/80 backdrop-blur"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {items.map((_, i) => (
                <button key={i} aria-label={`Ir a medio ${i + 1}`} onClick={() => setIdx(i)}
                  className={`h-1.5 w-4 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/30 hover:bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
        {!cur && <Icon className="h-20 w-20 text-white/10" />}
      </div>
    </BorderGlow>
  );
}
