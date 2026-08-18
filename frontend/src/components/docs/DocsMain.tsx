import { Download } from "lucide-react";
import type { Doc } from "@/components/DocumentationSection";
import type { DocsCategoryMeta } from "./docsCategories";

interface DocsMainProps {
  category: DocsCategoryMeta;
  docs: Doc[];
}

export function DocsMain({ category, docs }: DocsMainProps) {
  const Icon = category.icon;

  return (
    <main id="docs-main" className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-10 md:py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          {category.label}
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2.5">
          <Icon className="h-6 w-6 text-primary" />
          {category.label}
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">{category.description}</p>

        <div className="h-px bg-border my-8" />

        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
          Documentos ({docs.length})
        </h3>

        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin documentos en esta categoría todavía.</p>
        ) : (
          <ul className="space-y-5">
            {docs.map((doc, i) => (
              <li key={`${doc.title}-${i}`} className="pb-5 border-b border-border last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {doc.title}
                      {doc.lang && (
                        <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide text-muted-foreground border border-border rounded px-1.5 py-0.5">
                          {doc.lang}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{doc.desc}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground/70">{doc.date}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {doc.files.map((f) => (
                      <a
                        key={f.href}
                        href={f.href}
                        download
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        aria-label={`Descargar ${doc.title} en formato ${f.label}`}
                      >
                        <Download className="h-3 w-3" />
                        {f.label}
                      </a>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
