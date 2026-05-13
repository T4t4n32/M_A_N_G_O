import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Lock, Search, X } from "lucide-react";
import { docs, type Doc } from "@/components/DocumentationSection";
import { Button } from "@/components/ui/button";
import { listItems as listPanelItems } from "@/lib/panelEmmaContent";

/**
 * Lista TODOS los archivos descargables del proyecto desde el panel
 * autenticado: los formatos editables (DOCX, XLSX, PPTX, MD, TXT, ZIP)
 * y también los PDFs públicos. De este modo, el personal autorizado
 * puede acceder desde un único lugar a la documentación completa,
 * mientras que la sección pública del sitio sólo expone los PDFs.
 */
const EDITABLE_FORMATS = ["PDF", "DOCX", "XLSX", "PPTX", "MD", "TXT", "ZIP"];

const FORMAT_BADGE: Record<string, string> = {
  PDF: "bg-red-500/15 text-red-300 border-red-500/30",
  DOCX: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  XLSX: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  PPTX: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  MD: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  TXT: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  ZIP: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
};

const staticEditableDocs: Doc[] = docs
  .map((d) => ({ ...d, files: d.files.filter((f) => EDITABLE_FORMATS.includes(f.label)) }))
  .filter((d) => d.files.length > 0);

function buildEditableDocs(): Doc[] {
  const local = listPanelItems("document")
    .filter((it) => EDITABLE_FORMATS.includes((it.format ?? "").toUpperCase()))
    .map<Doc>((it) => ({
      title: it.title,
      desc: it.description,
      category: it.category,
      date: it.addedAt ? new Date(it.addedAt).toLocaleDateString() : "2025",
      icon: FileText,
      files: [{ label: (it.format ?? "FILE").toUpperCase(), href: it.src }],
    }));
  const seen = new Set(staticEditableDocs.map((d) => d.title));
  return [...local.filter((d) => !seen.has(d.title)), ...staticEditableDocs];
}

export function RestrictedDocsPanel() {
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState<string | null>(null);
  const [editableDocs, setEditableDocs] = useState<Doc[]>(() => buildEditableDocs());

  useEffect(() => {
    const refresh = () => setEditableDocs(buildEditableDocs());
    window.addEventListener("storage", refresh);
    window.addEventListener("panel-emma::content-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("panel-emma::content-changed", refresh);
    };
  }, []);

  const filtered = useMemo(() => {
    let result = editableDocs;
    if (format) {
      result = result.filter((d) => d.files.some((f) => f.label === format));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.desc.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q),
      );
    }
    return result;
  }, [search, format, editableDocs]);

  const totalFiles = editableDocs.reduce((acc, d) => acc + d.files.length, 0);

  return (
    <section
      id="archivos-editables"
      className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4"
      aria-labelledby="archivos-editables-title"
    >
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Lock className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 id="archivos-editables-title" className="text-sm font-semibold text-white">
              Archivos editables del proyecto
            </h2>
            <p className="text-xs text-white/50">
              {totalFiles} archivos restringidos · acceso limitado a personal autorizado
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar archivo editable…"
            aria-label="Buscar archivo editable"
            className="w-full pl-10 pr-9 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por formato">
          <button
            type="button"
            onClick={() => setFormat(null)}
            aria-pressed={format === null}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
              format === null
                ? "bg-amber-500/20 text-amber-200 border-amber-500/40"
                : "bg-white/[0.03] text-white/55 border-white/10 hover:text-white"
            }`}
          >
            Todos
          </button>
          {EDITABLE_FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(format === f ? null : f)}
              aria-pressed={format === f}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                format === f
                  ? FORMAT_BADGE[f]
                  : "bg-white/[0.03] text-white/55 border-white/10 hover:text-white"
              }`}
            >
              .{f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-8 text-sm text-white/40">
          No se encontraron archivos editables con esos filtros.
        </p>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {filtered.map((doc) => (
            <li
              key={doc.title}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 flex items-start gap-3"
            >
              <span className="p-2 rounded-md bg-white/[0.04] text-white/60 shrink-0">
                <FileText className="h-4 w-4" aria-hidden />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate" title={doc.title}>
                  {doc.title}
                </h3>
                <p className="text-xs text-white/45 line-clamp-2 mt-0.5">{doc.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {doc.files.map((f) => (
                    <Button
                      key={f.href}
                      asChild
                      size="sm"
                      variant="outline"
                      className={`h-7 px-2 text-[11px] gap-1 border ${FORMAT_BADGE[f.label] ?? "border-white/15 text-white/60"}`}
                    >
                      <a href={f.href} download aria-label={`Descargar ${doc.title} (${f.label})`}>
                        <Download className="h-3 w-3" aria-hidden /> .{f.label.toLowerCase()}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}