import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Download, FileText, Lock, Search, X, Archive,
  FolderOpen, BookOpen, ChevronDown, Copy, Check,
  ExternalLink, Clock, AlertCircle, Loader2,
} from "lucide-react";
import { docs, type Doc } from "@/components/DocumentationSection";
import { Button } from "@/components/ui/button";
import { listItems as listPanelItems } from "@/lib/panelEmmaContent";
import { requestDocLink } from "@/lib/api";

// ── Era classification ───────────────────────────────────────────────────────
type Era = "inicio" | "borrador" | "historico";

function classifyEra(doc: Doc): Era {
  const t = doc.title.toLowerCase();
  if (t.includes("borradores") || t.includes("borrador")) return "borrador";
  if (doc.category === "Fuentes" || /20(15|16|17|18|19|20|21|22|23|24)/.test(doc.date))
    return "historico";
  return "inicio";
}

const ERA_CONFIG: Record<Era, {
  label: string; sublabel: string;
  icon: React.ElementType; accent: string; badgeBg: string;
}> = {
  inicio: {
    label: "Inicio del Proyecto",
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
    label: "Archivo Histórico",
    sublabel: "Fuentes e investigaciones del período 2015–2024.",
    icon: Archive,
    accent: "text-white/50",
    badgeBg: "bg-white/[0.06] text-white/50 border-white/15",
  },
};

const EDITABLE_FORMATS = ["PDF", "DOCX", "XLSX", "PPTX", "MD", "TXT", "ZIP"];

const FORMAT_STYLE: Record<string, { badge: string; dot: string }> = {
  PDF:  { badge: "bg-red-500/15 text-red-300 border-red-500/30",     dot: "bg-red-400" },
  DOCX: { badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",  dot: "bg-blue-400" },
  XLSX: { badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  PPTX: { badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",   dot: "bg-orange-400" },
  MD:   { badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",   dot: "bg-purple-400" },
  TXT:  { badge: "bg-slate-500/15 text-slate-300 border-slate-500/30",      dot: "bg-slate-400" },
  ZIP:  { badge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",   dot: "bg-yellow-400" },
};

// ── Link state per (doc.title + file.href) ───────────────────────────────────
type LinkState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; url: string; expires_at: string; filename: string }
  | { status: "error"; message: string };

// ── Temp-link card ───────────────────────────────────────────────────────────
function LinkCard({
  state, onDismiss,
}: { state: Extract<LinkState, { status: "ready" }>; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  const fullUrl = `${window.location.origin}${state.url}`;

  function copy() {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="mt-2 rounded-lg border border-white/[0.1] bg-[#0e1a14] p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80 font-semibold">
          <Clock className="h-3 w-3 shrink-0" />
          Enlace válido 15 minutos
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-white/25 hover:text-white/60 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 rounded bg-white/[0.04] border border-white/[0.07] px-2.5 py-1.5">
        <span className="flex-1 text-[11px] font-mono text-white/50 truncate">{fullUrl}</span>
        <button
          type="button"
          onClick={copy}
          title="Copiar enlace"
          className="shrink-0 text-white/30 hover:text-white/70 transition-colors"
        >
          {copied
            ? <Check className="h-3.5 w-3.5 text-emerald-400" />
            : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      <a
        href={state.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Descargar {state.filename}
        <ExternalLink className="h-3 w-3 opacity-60" />
      </a>
    </div>
  );
}

// ── DocRow ────────────────────────────────────────────────────────────────────
function DocRow({ doc }: { doc: Doc }) {
  const [linkStates, setLinkStates] = useState<Record<string, LinkState>>(
    () => Object.fromEntries(doc.files.map((f) => [f.href, { status: "idle" }])),
  );

  const generateLink = useCallback(async (href: string) => {
    setLinkStates((s) => ({ ...s, [href]: { status: "loading" } }));
    try {
      const data = await requestDocLink(href);
      setLinkStates((s) => ({ ...s, [href]: { status: "ready", ...data } }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar enlace";
      setLinkStates((s) => ({ ...s, [href]: { status: "error", message: msg } }));
    }
  }, []);

  const dismiss = useCallback((href: string) => {
    setLinkStates((s) => ({ ...s, [href]: { status: "idle" } }));
  }, []);

  return (
    <li className="rounded-lg border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.035] transition-colors p-3">
      <div className="flex items-start gap-3">
        <span className="p-1.5 rounded-md bg-white/[0.04] text-white/40 shrink-0 mt-0.5">
          <FileText className="h-3.5 w-3.5" />
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-medium text-white/85 leading-snug">{doc.title}</h3>
          <p className="text-[11px] text-white/35 mt-0.5 line-clamp-2">{doc.desc}</p>

          <div className="flex flex-wrap gap-2 mt-2.5">
            {doc.files.map((f) => {
              const fmt = FORMAT_STYLE[f.label];
              const ls = linkStates[f.href] ?? { status: "idle" };
              const isLoading = ls.status === "loading";

              return (
                <div key={f.href} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => ls.status === "ready" ? dismiss(f.href) : generateLink(f.href)}
                    disabled={isLoading}
                    className={`inline-flex items-center gap-1.5 h-6 px-2 rounded text-[10px] font-semibold border transition-all
                      ${fmt?.badge ?? "bg-white/[0.06] text-white/50 border-white/15"}
                      ${isLoading ? "opacity-60 cursor-wait" : "hover:brightness-125 cursor-pointer"}
                      ${ls.status === "ready" ? "ring-1 ring-emerald-500/40" : ""}
                    `}
                  >
                    {isLoading
                      ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      : ls.status === "ready"
                        ? <Check className="h-2.5 w-2.5" />
                        : <Download className="h-2.5 w-2.5" />
                    }
                    .{f.label.toLowerCase()}
                  </button>

                  {ls.status === "ready" && (
                    <LinkCard state={ls} onDismiss={() => dismiss(f.href)} />
                  )}
                  {ls.status === "error" && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-red-400/80">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {ls.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </li>
  );
}

// ── CategoryGroup ─────────────────────────────────────────────────────────────
function CategoryGroup({ category, docs: groupDocs }: { category: string; docs: Doc[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-white/[0.06] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/65">{category}</span>
          <span className="text-[10px] text-white/30 bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded">
            {groupDocs.length}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="px-3 pb-3 pt-2 space-y-2 border-t border-white/[0.04]">
          {groupDocs.map((doc) => (
            <DocRow key={doc.title} doc={doc} />
          ))}
        </ul>
      )}
    </div>
  );
}

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

  // Group filtered docs by category, preserving order
  const byCategory = useMemo<Array<{ category: string; docs: Doc[] }>>(() => {
    const map = new Map<string, Doc[]>();
    for (const doc of filtered) {
      const cat = doc.category || "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(doc);
    }
    return Array.from(map.entries()).map(([category, docs]) => ({ category, docs }));
  }, [filtered]);

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
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <h2 id="archivos-editables-title" className="text-sm font-semibold text-white/85">
              Archivos del Proyecto
            </h2>
            <p className="text-[11px] text-white/40">
              {allDocs.length} archivos · los enlaces expiran a los 15 minutos
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
              {ecfg.label}
              <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                active ? ecfg.badgeBg : "bg-white/[0.04] text-white/30 border-white/10"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Era description + search */}
      <div className="px-5 pt-3 pb-3 space-y-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <EraIcon className={`h-3.5 w-3.5 ${cfg.accent}`} />
          <p className="text-[11px] text-white/45">{cfg.sublabel}</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en esta sección…"
            className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/35 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Grouped document list */}
      <div className="px-4 py-4 space-y-3">
        {byCategory.length === 0 ? (
          <p className="text-center py-10 text-sm text-white/30">
            {search ? "Sin resultados para esa búsqueda." : "No hay archivos en esta sección."}
          </p>
        ) : (
          byCategory.map(({ category, docs: groupDocs }) => (
            <CategoryGroup key={category} category={category} docs={groupDocs} />
          ))
        )}
      </div>
    </section>
  );
}
