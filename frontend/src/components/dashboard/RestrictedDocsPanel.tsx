import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Lock, Search, X, Archive, FolderOpen, BookOpen } from "lucide-react";
import { docs, type Doc } from "@/components/DocumentationSection";
import { Button } from "@/components/ui/button";
import { listItems as listPanelItems } from "@/lib/panelEmmaContent";

// ── Era classification ───────────────────────────────────────────────────────
type Era = "inicio" | "borrador" | "historico";

function classifyEra(doc: Doc): Era {
  if (
    doc.title.toLowerCase().includes("borradores") ||
    doc.title.toLowerCase().includes("borrador")
  ) return "borrador";

  if (
    doc.category === "Fuentes" ||
    /20(15|16|17|18|19|20|21|22|23|24)/.test(doc.date)
  ) return "historico";

  return "inicio";
}

const ERA_CONFIG: Record<Era, {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  accent: string;
  badgeBg: string;
}> = {
  inicio: {
    label: "Desde el Inicio del Proyecto",
    sublabel: "Documentación activa del proyecto M.A.N.G.O.",
    icon: FolderOpen,
    accent: "text-[hsl(168,72%,55%)]",
    badgeBg: "bg-[hsl(168,72%,42%/0.12)] text-[hsl(168,72%,55%)] border-[hsl(168,72%,42%/0.25)]",
  },
  borrador: {
    label: "Borradores",
    sublabel: "Versiones preliminares y documentos en desarrollo.",
    icon: BookOpen,
    accent: "text-amber-300",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  },
  historico: {
    label: "Archivo Histórico — 10° Grado",
    sublabel: "Fuentes, investigaciones previas y materiales del período 2015–2024.",
    icon: Archive,
    accent: "text-white/50",
    badgeBg: "bg-white/[0.06] text-white/50 border-white/15",
  },
};

// ── Format badges ────────────────────────────────────────────────────────────
const EDITABLE_FORMATS = ["PDF", "DOCX", "XLSX", "PPTX", "MD", "TXT", "ZIP"];

const FORMAT_BADGE: Record<string, string> = {
  PDF:  "bg-red-500/15 text-red-300 border-red-500/30",
  DOCX: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  XLSX: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  PPTX: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  MD:   "bg-purple-500/15 text-purple-300 border-purple-500/30",
  TXT:  "bg-slate-500/15 text-slate-300 border-slate-500/30",
  ZIP:  "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
};

// ── Doc list builder ─────────────────────────────────────────────────────────
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

// ── DocCard ──────────────────────────────────────────────────────────────────
function DocCard({ doc }: { doc: Doc }) {
  return (
    <li className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 flex items-start gap-3">
      <span className="p-2 rounded-md bg-white/[0.04] text-white/50 shrink-0">
        <FileText className="h-4 w-4" aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-white/85 truncate" title={doc.title}>{doc.title}</h3>
        <p className="text-[11px] text-white/40 line-clamp-2 mt-0.5">{doc.desc}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {doc.files.map((f) => (
            <Button
              key={f.href}
              asChild
              size="sm"
              variant="outline"
              className={`h-6 px-2 text-[10px] gap-1 border ${FORMAT_BADGE[f.label] ?? "border-white/15 text-white/55"}`}
            >
              <a href={f.href} download aria-label={`Descargar ${doc.title} (${f.label})`}>
                <Download className="h-2.5 w-2.5" aria-hidden /> .{f.label.toLowerCase()}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </li>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function RestrictedDocsPanel() {
  const [activeEra, setActiveEra] = useState<Era>("inicio");
  const [search, setSearch] = useState("");
  const [allDocs, setAllDocs] = useState<Doc[]>(() => buildEditableDocs());

  useEffect(() => {
    const refresh = () => setAllDocs(buildEditableDocs());
    window.addEventListener("storage", refresh);
    window.addEventListener("panel-emma::content-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("panel-emma::content-changed", refresh);
    };
  }, []);

  const byEra = useMemo<Record<Era, Doc[]>>(() => {
    const groups: Record<Era, Doc[]> = { inicio: [], borrador: [], historico: [] };
    for (const doc of allDocs) groups[classifyEra(doc)].push(doc);
    return groups;
  }, [allDocs]);

  const filtered = useMemo(() => {
    const base = byEra[activeEra];
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.desc.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q),
    );
  }, [byEra, activeEra, search]);

  const totalAll = allDocs.length;
  const cfg = ERA_CONFIG[activeEra];
  const EraIcon = cfg.icon;

  return (
    <section
      id="archivos-editables"
      className="rounded-xl border border-white/[0.08] bg-[hsl(205,35%,9%)] overflow-hidden"
      aria-labelledby="archivos-editables-title"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Lock className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 id="archivos-editables-title" className="text-sm font-semibold text-white/85">
              Archivos del Proyecto
            </h2>
            <p className="text-[11px] text-white/40">
              {totalAll} archivos · acceso restringido a personal autorizado
            </p>
          </div>
        </div>
      </div>

      {/* Era tabs */}
      <div className="flex border-b border-white/[0.06] overflow-x-auto">
        {(Object.entries(ERA_CONFIG) as [Era, typeof ERA_CONFIG[Era]][]).map(([era, ecfg]) => {
          const TabIcon = ecfg.icon;
          const count = byEra[era].length;
          const active = activeEra === era;
          return (
            <button
              key={era}
              type="button"
              onClick={() => { setActiveEra(era); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? `border-current ${ecfg.accent} bg-white/[0.03]`
                  : "border-transparent text-white/40 hover:text-white/65"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {era === "inicio" ? "Inicio del Proyecto" : era === "borrador" ? "Borradores" : "Archivo Histórico"}
              <span className={`px-1.5 py-0.5 rounded text-[10px] border ${active ? ecfg.badgeBg : "bg-white/[0.04] text-white/30 border-white/10"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Era description + search */}
      <div className="px-5 pt-3 pb-2.5 space-y-3">
        <div className="flex items-center gap-2">
          <EraIcon className={`h-3.5 w-3.5 ${cfg.accent}`} />
          <p className="text-[11px] text-white/45">{cfg.sublabel}</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en esta sección…"
            aria-label="Buscar archivo"
            className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpiar"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/35 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="px-5 pb-5">
        {filtered.length === 0 ? (
          <p className="text-center py-10 text-sm text-white/30">
            {search ? "Sin resultados para esa búsqueda." : "No hay archivos en esta sección."}
          </p>
        ) : (
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {filtered.map((doc) => (
              <DocCard key={doc.title} doc={doc} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
