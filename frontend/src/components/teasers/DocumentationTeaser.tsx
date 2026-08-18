import { useMemo } from "react";
import { docs } from "@/components/DocumentationSection";
import { SectionTeaser } from "./SectionTeaser";

export function DocumentationTeaser() {
  const { total, categories } = useMemo(() => {
    const cats = [...new Set(docs.map((d) => d.category))];
    return { total: docs.length, categories: cats };
  }, []);

  return (
    <SectionTeaser
      id="documentacion"
      eyebrow="Investigación y desarrollo"
      title="Documentación del Proyecto"
      description={`${total} documentos — investigación, bitácoras, presentaciones y fuentes del proyecto, organizados por categoría.`}
      ctaLabel="Ver documentación completa"
      to="/documentacion"
      accent="blue"
    >
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <span
            key={cat}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.05] border border-white/10 text-white/60"
          >
            {cat}
          </span>
        ))}
      </div>
    </SectionTeaser>
  );
}
