import { lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Cpu, FlaskConical, BarChart3, Globe, Lock, LogIn, Mail } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import GradientText from "@/components/effects/GradientText";
import BorderGlow from "@/components/effects/BorderGlow";
import StarBorder from "@/components/effects/StarBorder";

const ModelViewer = lazy(() => import("@/components/effects/ModelViewer"));

const MODEL_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb";

const tabsData = [
  {
    value: "que-es",
    label: "¿Qué es?",
    title: "¿Qué es M.A.N.G.O?",
    text: "M.A.N.G.O es un sistema de monitoreo ambiental autónomo diseñado para medir y registrar en tiempo real las condiciones de los ecosistemas de manglar. Combina sensores avanzados, conectividad IoT y análisis de datos para ofrecer información precisa a instituciones de investigación y conservación.",
    icon: Globe,
    glowColors: ['#00c9a7', '#38bdf8', '#00c9a7'] as string[],
    has3D: true,
  },
  {
    value: "componentes",
    label: "Componentes",
    title: "Componentes del Sistema",
    text: "El sistema integra sensores de temperatura, pH, salinidad, turbidez y nivel de agua. Cuenta con una unidad de procesamiento central basada en microcontroladores, módulos de comunicación inalámbrica y una plataforma web para visualización de datos.",
    icon: Cpu,
    glowColors: ['#38bdf8', '#c084fc', '#38bdf8'] as string[],
  },
  {
    value: "metodologia",
    label: "Metodología",
    title: "Metodología de Desarrollo",
    text: "Se emplea una metodología de prototipado iterativo, comenzando con investigación de campo en ecosistemas de manglar, seguida de diseño electrónico, programación de firmware, pruebas de laboratorio y validación en campo.",
    icon: FlaskConical,
    glowColors: ['#c084fc', '#f472b6', '#c084fc'] as string[],
  },
  {
    value: "funciones",
    label: "Funciones",
    title: "Funciones Principales",
    text: "Mapeo y registro periódico de las condiciones ambientales del manglar, alertas automáticas ante parámetros fuera de rango, generación de reportes con datos históricos y exportación de información para análisis científico avanzado.",
    icon: Activity,
    glowColors: ['#00c9a7', '#eab308', '#00c9a7'] as string[],
  },
  {
    value: "impacto",
    label: "Impacto",
    title: "Impacto Ambiental",
    text: "M.A.N.G.O permite la detección temprana de degradación ambiental, apoya la toma de decisiones para políticas de conservación, y genera datos confiables para investigaciones sobre cambio climático y salud de ecosistemas costeros.",
    icon: BarChart3,
    glowColors: ['#38bdf8', '#00c9a7', '#38bdf8'] as string[],
  },
  {
    value: "acceso",
    label: "Acceso",
    title: "Acceso al Sistema",
    text: "El acceso a la plataforma de datos está restringido a instituciones autorizadas vinculadas a proyectos de investigación ambiental. Se requieren credenciales institucionales para consultar información en tiempo real y datos históricos.",
    hasActions: true,
    icon: Lock,
    glowColors: ['#eab308', '#f97316', '#eab308'] as string[],
  },
];

export function ProjectSection() {
  return (
    <section id="proyecto" className="py-20 md:py-28 bg-mango-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,hsl(204_70%_53%/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,hsl(168_72%_42%/0.06),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-3">
            <DecryptedText
              text="El Proyecto"
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
              Conoce en detalle el sistema de monitoreo ambiental M.A.N.G.O
            </GradientText>
          </p>
        </div>

        <Tabs defaultValue="que-es" className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-1 sm:gap-1.5 bg-transparent h-auto p-0 mb-10">
            {tabsData.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(168,72%,42%)]/20 data-[state=active]:to-[hsl(204,70%,53%)]/20
                  data-[state=active]:text-white data-[state=active]:backdrop-blur-sm data-[state=active]:border data-[state=active]:border-white/15
                  data-[state=active]:shadow-[0_0_15px_hsl(168_72%_42%/0.15)]
                  data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/60
                  data-[state=inactive]:hover:bg-white/[0.05]
                  transition-all duration-300 border-0"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabsData.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsContent key={tab.value} value={tab.value}>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[hsl(168,72%,42%)] px-4 py-2 rounded-full text-sm font-medium mb-4 bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]">
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{tab.title}</h3>
                    <p className="text-white/60 leading-relaxed text-lg">{tab.text}</p>
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
                    {'has3D' in tab && tab.has3D && (
                      <p className="text-white/30 text-xs mt-4 italic">
                        ⓘ Modelo 3D placeholder — se reemplazará con el modelo real de M.A.N.G.O
                      </p>
                    )}
                  </div>

                  {'has3D' in tab && tab.has3D ? (
                    <div className="aspect-video rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10">
                      <Suspense fallback={
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="h-20 w-20 text-white/10 animate-pulse" />
                        </div>
                      }>
                        <ModelViewer
                          url={MODEL_URL}
                          autoRotate
                          autoRotateSpeed={0.35}
                          enableHoverRotation
                          environmentPreset="forest"
                        />
                      </Suspense>
                    </div>
                  ) : (
                    <BorderGlow
                      borderRadius={20}
                      glowRadius={25}
                      glowIntensity={0.6}
                      colors={tab.glowColors}
                      className="aspect-video"
                    >
                      <div className="w-full h-full flex items-center justify-center bg-transparent rounded-[20px]">
                        <Icon className="h-20 w-20 text-white/10" />
                      </div>
                    </BorderGlow>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </section>
  );
}
