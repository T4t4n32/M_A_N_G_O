import { useEffect, useMemo, useState, useCallback } from "react";
import {
  FileText, Lock, Search, X, Copy, Check,
  Download, Clock, AlertCircle, Loader2, ShieldCheck,
  FileSpreadsheet, Presentation, FileCode, FileArchive,
} from "lucide-react";
import { docs, type Doc } from "@/components/DocumentationSection";
import { listItems as listPanelItems } from "@/lib/panelEmmaContent";
import { DOC_FORMATS, useDocLink } from "@/hooks/useDocLink";

// ── Format config ─────────────────────────────────────────────────────────────
const FORMAT_CFG: Record<string, {
  color: string; bg: string; border: string; icon: React.ElementType;
}> = {
  PDF:  { color: "text-red-300",     bg: "bg-red-500/12",     border: "border-red-500/25",     icon: FileText },
  DOCX: { color: "text-blue-300",    bg: "bg-blue-500/12",    border: "border-blue-500/25",    icon: FileText },
  XLSX: { color: "text-emerald-300", bg: "bg-emerald-500/12", border: "border-emerald-500/25", icon: FileSpreadsheet },
  PPTX: { color: "text-orange-300",  bg: "bg-orange-500/12",  border: "border-orange-500/25",  icon: Presentation },
  MD:   { color: "text-purple-300",  bg: "bg-purple-500/12",  border: "border-purple-500/25",  icon: FileCode },
  TXT:  { color: "text-slate-300",   bg: "bg-slate-500/12",   border: "border-slate-500/25",   icon: FileText },
  ZIP:  { color: "text-yellow-300",  bg: "bg-yellow-500/12",  border: "border-yellow-500/25",  icon: FileArchive },
};

const EDITABLE_FORMATS = DOC_FORMATS;

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORY_COLOR: Record<string, string> = {
  "Investigación":  "bg-teal-500/15   text-teal-300   border-teal-500/25",
  "Electrónica":    "bg-sky-500/15    text-sky-300    border-sky-500/25",
  "Pitch":          "bg-violet-500/15 text-violet-300 border-violet-500/25",
  "Presentaciones": "bg-orange-500/15 text-orange-300 border-orange-500/25",
  "Técnico":        "bg-cyan-500/15   text-cyan-300   border-cyan-500/25",
  "Bitácoras":      "bg-amber-500/15  text-amber-300  border-amber-500/25",
  "Fuentes":        "bg-slate-500/15  text-slate-300  border-slate-500/25",
};

function catBadge(cat: string) {
  return CATEGORY_COLOR[cat] ?? "bg-white/[0.06] text-white/45 border-white/10";
}

// ── FormatButton ──────────────────────────────────────────────────────────────
function FormatButton({ label, href }: { label: string; href: string }) {
  const { state: ls, copied, generate, copy, reset } = useDocLink(href);
  const cfg = FORMAT_CFG[label];

  if (ls.s === "ready") {
    return (
      <div className={`flex items-center gap-0 rounded-lg overflow-hidden border ${cfg?.border ?? "border-white/15"} animate-in fade-in duration-150`}>
        <a
          href={ls.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold ${cfg?.bg ?? ""} ${cfg?.color ?? "text-white/70"} hover:brightness-125 transition-all`}
        >
          <Download className="h-3 w-3 shrink-0" />
          .{label.toLowerCase()}
        </a>
        <button
          type="button"
          onClick={copy}
          title="Copiar enlace"
          className="px-2.5 py-1.5 border-l border-white/[0.08] text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </button>
        <button
          type="button"
          onClick={reset}
          title="Cerrar"
          className="px-2 py-1.5 border-l border-white/[0.08] text-white/20 hover:text-white/50 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={ls.s === "loading"}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all
        ${cfg?.bg ?? "bg-white/[0.06]"} ${cfg?.color ?? "text-white/50"} ${cfg?.border ?? "border-white/15"}
        ${ls.s === "loading" ? "opacity-60 cursor-wait" : "hover:brightness-125 cursor-pointer"}
        ${ls.s === "error" ? "border-red-500/40 !text-red-400/80" : ""}
      `}
    >
      {ls.s === "loading" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : ls.s === "error" ? (
        <AlertCircle className="h-3 w-3" />
      ) : (
        <Download className="h-3 w-3" />
      )}
      {ls.s === "error" ? "Error" : `.${label.toLowerCase()}`}
    </button>
  );
}

// ── DocCard ───────────────────────────────────────────────────────────────────
function DocCard({ doc }: { doc: Doc }) {
  const primaryFmt = doc.files[0]?.label ?? "FILE";
  const cfg = FORMAT_CFG[primaryFmt];
  const Icon = cfg?.icon ?? FileText;

  return (
    <div className="group flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.14] transition-all duration-200 overflow-hidden">
      {/* Top strip: format color accent */}
      <div className={`h-0.5 w-full ${cfg?.bg.replace("/12", "/60") ?? "bg-white/10"}`} />

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Icon + title + category */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${cfg?.bg ?? "bg-white/[0.04]"} ${cfg?.color ?? "text-white/40"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-semibold text-white/90 leading-snug truncate" title={doc.title}>
              {doc.title}
            </h3>
            <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${catBadge(doc.category)}`}>
              {doc.category}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 flex-1">
          {doc.desc}
        </p>

        {/* Format buttons */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.05]">
          {doc.files.map((f) => (
            <FormatButton key={f.href} label={f.label} href={f.href} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Doc list builder ──────────────────────────────────────────────────────────
const staticDocs: Doc[] = docs
  .map((d) => ({ ...d, files: d.files.filter((f) => EDITABLE_FORMATS.includes(f.label)) }))
  .filter((d) => d.files.length > 0);

function buildDocs(): Doc[] {
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
  const seen = new Set(staticDocs.map((d) => d.title));
  return [...local.filter((d) => !seen.has(d.title)), ...staticDocs];
}

// ── Main component ────────────────────────────────────────────────────────────
export function RestrictedDocsPanel() {
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("Todos");
  const [allDocs, setAllDocs]   = useState<Doc[]>(() => buildDocs());

  useEffect(() => {
    const refresh = () => setAllDocs(buildDocs());
    window.addEventListener("storage", refresh);
    window.addEventListener("panel-emma::content-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("panel-emma::content-changed", refresh);
    };
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of allDocs) counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [allDocs]);

  const filtered = useMemo(() => {
    let base = category === "Todos" ? allDocs : allDocs.filter((d) => d.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter(
        (d) => d.title.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q),
      );
    }
    return base;
  }, [allDocs, category, search]);

  return (
    <section
      id="archivos-editables"
      className="rounded-xl border border-white/[0.08] bg-[hsl(205,35%,9%)] overflow-hidden"
      aria-labelledby="archivos-editables-title"
    >
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Lock className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <h2 id="archivos-editables-title" className="text-sm font-semibold text-white/90">
                Archivos del Proyecto
              </h2>
              <p className="text-[11px] text-white/35 mt-0.5">
                {allDocs.length} archivos · acceso restringido
              </p>
            </div>
          </div>

          {/* Security note */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/25 border border-white/[0.07] rounded-lg px-3 py-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-500/60 shrink-0" />
            <span>Enlace · <Clock className="h-2.5 w-2.5 inline" /> 15 min</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar archivo…"
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category filter pills ── */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-white/[0.05] scrollbar-none">
        {[["Todos", allDocs.length], ...categories].map(([cat, count]) => {
          const active = category === cat;
          const badge = catBadge(cat as string);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat as string)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all shrink-0 ${
                active
                  ? cat === "Todos"
                    ? "bg-white/[0.12] text-white border-white/25"
                    : badge
                  : "bg-transparent text-white/40 border-white/[0.08] hover:text-white/65 hover:border-white/15"
              }`}
            >
              {cat}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                active ? "bg-white/20" : "bg-white/[0.06]"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Document grid ── */}
      <div className="p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <FileText className="h-8 w-8 text-white/10" />
            <p className="text-sm text-white/30">
              {search ? `Sin resultados para "${search}"` : "No hay archivos en esta categoría."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((doc) => (
              <DocCard key={doc.title} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
