import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Cpu, FlaskConical, BarChart3, Globe, Lock, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabsData = [
{
  value: "que-es",
  label: "¿Qué es?",
  title: "¿Qué es M.A.N.G.O?",
  text: "M.A.N.G.O es un sistema de monitoreo ambiental autónomo diseñado para medir y registrar en tiempo real las condiciones de los ecosistemas de manglar. Combina sensores avanzados, conectividad IoT y análisis de datos para ofrecer información precisa a instituciones de investigación y conservación.",
  icon: Globe
},
{
  value: "componentes",
  label: "Componentes",
  title: "Componentes del Sistema",
  text: "El sistema integra sensores de temperatura, pH, salinidad, turbidez y nivel de agua. Cuenta con una unidad de procesamiento central basada en microcontroladores, módulos de comunicación inalámbrica y una plataforma web para visualización de datos.",
  icon: Cpu
},
{
  value: "metodologia",
  label: "Metodología",
  title: "Metodología de Desarrollo",
  text: "Se emplea una metodología de prototipado iterativo, comenzando con investigación de campo en ecosistemas de manglar, seguida de diseño electrónico, programación de firmware, pruebas de laboratorio y validación en campo.",
  icon: FlaskConical
},
{
  value: "funciones",
  label: "Funciones",
  title: "Funciones Principales",
  text: "Mapeo y registro periódico de las condiciones ambientales del manglar, alertas automáticas ante parámetros fuera de rango, generación de reportes con datos históricos y exportación de información para análisis científico avanzado.",
  icon: Activity
},
{
  value: "impacto",
  label: "Impacto",
  title: "Impacto Ambiental",
  text: "M.A.N.G.O permite la detección temprana de degradación ambiental, apoya la toma de decisiones para políticas de conservación, y genera datos confiables para investigaciones sobre cambio climático y salud de ecosistemas costeros.",
  icon: BarChart3
},
{
  value: "acceso",
  label: "Acceso",
  title: "Acceso al Sistema",
  text: "El acceso a la plataforma de datos está restringido a instituciones autorizadas vinculadas a proyectos de investigación ambiental. Se requieren credenciales institucionales para consultar información en tiempo real y datos históricos.",
  hasActions: true,
  icon: Lock
}];


export function ProjectSection() {
  return (
    <section id="proyecto" className="py-20 md:py-28 bg-mango-dark relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,hsl(204_70%_53%/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,hsl(168_72%_42%/0.06),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">El Proyecto</h2>
          <p className="mt-3 text-white/50 max-w-2xl mx-auto">
            Conoce en detalle el sistema de monitoreo ambiental M.A.N.G.O
          </p>
        </div>

        <Tabs defaultValue="que-es" className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-1 bg-transparent h-auto p-0 mb-8">
            {tabsData.map((tab) =>
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-4 py-2.5 rounded-full text-sm font-medium data-[state=active]:bg-white/[0.12] data-[state=active]:text-white data-[state=active]:backdrop-blur-sm data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/60 data-[state=inactive]:hover:bg-white/[0.05] transition-all border-0">

                {tab.label}
              </TabsTrigger>
            )}
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
                    <h3 className="text-2xl font-bold text-white mb-4">{tab.title}</h3>
                    <p className="text-white/60 leading-relaxed text-lg">{tab.text}</p>
                    {tab.hasActions && (
                      <div className="flex flex-wrap gap-3 mt-6">
                        <Button asChild className="rounded-full gap-2 bg-gradient-to-r from-[hsl(168,72%,42%)] to-[hsl(204,70%,53%)] hover:from-[hsl(168,72%,38%)] hover:to-[hsl(204,70%,48%)] text-white font-semibold px-6 shadow-lg shadow-[hsl(168,72%,42%)]/20">
                          <a href="/login"><LogIn className="h-4 w-4" /> Acceder al sistema</a>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full gap-2 px-6 font-semibold border-white/20 text-white/80 hover:bg-white/[0.08] hover:text-white">
                          <a href="#contacto"><Mail className="h-4 w-4" /> Solicitar acceso</a>
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/[0.06] aspect-video flex items-center justify-center">
                    <Icon className="h-20 w-20 text-white/10" />
                  </div>
                </div>
              </TabsContent>);

          })}
        </Tabs>
      </div>
    </section>);

}