import { useState } from "react";
import { FileText, Download, BookOpen, Presentation, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

const filters = ["Todos", "Informes", "PDFs", "Bitácoras", "Presentaciones"];

const docs = [
  { title: "Informe de Avance Q4 2025", desc: "Resultados del monitoreo en zona piloto.", type: "Informes", date: "Dic 2025", icon: FileText },
  { title: "Manual Técnico del Sistema", desc: "Documentación completa de hardware y software.", type: "PDFs", date: "Nov 2025", icon: BookOpen },
  { title: "Bitácora de Campo #12", desc: "Registro de actividades en la estación de manglar.", type: "Bitácoras", date: "Oct 2025", icon: ClipboardList },
  { title: "Presentación SENA 2025", desc: "Presentación del proyecto ante evaluadores SENA.", type: "Presentaciones", date: "Sep 2025", icon: Presentation },
  { title: "Análisis de Datos Sensor pH", desc: "Reporte de calibración y lecturas del sensor de pH.", type: "Informes", date: "Ago 2025", icon: FileText },
  { title: "Guía de Instalación", desc: "Instrucciones para despliegue en campo.", type: "PDFs", date: "Jul 2025", icon: BookOpen },
];

export function DocumentationSection() {
  const [active, setActive] = useState("Todos");
  const filtered = active === "Todos" ? docs : docs.filter((d) => d.type === active);

  return (
    <section id="documentacion" className="py-20 md:py-28 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Documentación</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Recursos, informes y documentos del proyecto
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                active === f
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doc, i) => {
            const Icon = doc.icon;
            return (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-secondary/10 text-secondary shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{doc.desc}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">{doc.date}</span>
                      <Button size="sm" variant="ghost" className="text-secondary hover:text-secondary/80 gap-1 text-xs">
                        <Download className="h-3.5 w-3.5" /> Descargar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
