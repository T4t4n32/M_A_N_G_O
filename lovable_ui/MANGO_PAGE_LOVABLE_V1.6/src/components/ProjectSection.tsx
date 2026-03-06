import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Cpu, FlaskConical, BarChart3, Globe, Lock } from "lucide-react";

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
  text: "Monitoreo continuo 24/7, alertas automáticas ante condiciones anómalas, generación de reportes periódicos, almacenamiento histórico de datos, y exportación de información para análisis científico avanzado.",
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
  icon: Lock
}];


export function ProjectSection() {
  return (
    <section id="proyecto" className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">El Proyecto</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Conoce en detalle el sistema de monitoreo ambiental M.A.N.G.O
          </p>
        </div>

        <Tabs defaultValue="que-es" className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-1 bg-transparent h-auto p-0 mb-8">
            {tabsData.map((tab) =>
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-4 py-2.5 rounded-full text-sm font-medium data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted transition-all">

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
                    <div className="inline-flex items-center gap-2 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4 bg-muted">
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{tab.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">{tab.text}</p>
                  </div>
                  <div className="bg-muted rounded-xl aspect-video flex items-center justify-center">
                    <Icon className="h-20 w-20 text-muted-foreground/30" />
                  </div>
                </div>
              </TabsContent>);

          })}
        </Tabs>
      </div>
    </section>);

}