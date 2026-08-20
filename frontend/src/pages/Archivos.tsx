import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Lock, Search, X, Copy, Check, Download,
  Clock, AlertCircle, Loader2, ShieldCheck, ArrowLeft,
  FileSpreadsheet, Presentation, FileCode, FileArchive,
  Leaf, Star, BookOpen, Cpu, Mic, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { docs, type Doc } from "@/components/DocumentationSection";
import { listPublicDocs } from "@/lib/api";
import { DOC_FORMATS, useDocLink } from "@/hooks/useDocLink";
import DecryptedText from "@/components/effects/DecryptedText";
import GradientText from "@/components/effects/GradientText";

// ── Constants ─────────────────────────────────────────────────────────────────
const EDITABLE_FORMATS = DOC_FORMATS;

const FEATURED_TITLES = new Set([
  "M.A.N.G.O — Documento Principal",
  "M.A.N.G.O — English Version",
  "M.A.N.G.O — Electrónica",
  "Pitch M.A.N.G.O",
  "RAW M.A.N.G.O",
  "M.A.N.G.O — Versión Español",
]);

// ── Format config ─────────────────────────────────────────────────────────────
const FMT: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; glow: string }> = {
  PDF:  { color: "text-red-300",     bg: "bg-red-500/10",     border: "border-red-500/25",     icon: FileText,        glow: "shadow-red-500/20" },
  DOCX: { color: "text-blue-300",    bg: "bg-blue-500/10",    border: "border-blue-500/25",    icon: FileText,        glow: "shadow-blue-500/20" },
  XLSX: { color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/25", icon: FileSpreadsheet, glow: "shadow-emerald-500/20" },
  PPTX: { color: "text-orange-300",  bg: "bg-orange-500/10",  border: "border-orange-500/25",  icon: Presentation,    glow: "shadow-orange-500/20" },
  MD:   { color: "text-purple-300",  bg: "bg-purple-500/10",  border: "border-purple-500/25",  icon: FileCode,        glow: "shadow-purple-500/20" },
  TXT:  { color: "text-slate-300",   bg: "bg-slate-500/10",   border: "border-slate-500/25",   icon: FileText,        glow: "shadow-slate-500/20" },
  ZIP:  { color: "text-yellow-300",  bg: "bg-yellow-500/10",  border: "border-yellow-500/25",  icon: FileArchive,     glow: "shadow-yellow-500/20" },
};

// ── Category config ───────────────────────────────────────────────────────────
const CAT_CFG: Record<string, { color: string; bg: string; border: string; dot: string; icon: React.ElementType }> = {
  "Investigación":  { color: "text-teal-300",   bg: "bg-teal-500/12",   border: "border-teal-500/25",   dot: "bg-teal-400",   icon: BookOpen },
  "Electrónica":    { color: "text-sky-300",     bg: "bg-sky-500/12",    border: "border-sky-500/25",    dot: "bg-sky-400",    icon: Cpu },
  "Pitch":          { color: "text-violet-300",  bg: "bg-violet-500/12", border: "border-violet-500/25", dot: "bg-violet-400", icon: Mic },
  "Presentaciones": { color: "text-orange-300",  bg: "bg-orange-500/12", border: "border-orange-500/25", dot: "bg-orange-400", icon: Presentation },
  "Técnico":        { color: "text-cyan-300",    bg: "bg-cyan-500/12",   border: "border-cyan-500/25",   dot: "bg-cyan-400",   icon: FileCode },
  "Bitácoras":      { color: "text-amber-300",   bg: "bg-amber-500/12",  border: "border-amber-500/25",  dot: "bg-amber-400",  icon: FileText },
  "Fuentes":        { color: "text-slate-300",   bg: "bg-slate-500/12",  border: "border-slate-500/25",  dot: "bg-slate-400",  icon: BookOpen },
};

function catCfg(cat: string) {
  return CAT_CFG[cat] ?? { color: "text-white/50", bg: "bg-white/[0.06]", border: "border-white/15", dot: "bg-white/30", icon: FileText };
}

// ── FormatBtn ─────────────────────────────────────────────────────────────────
function FormatBtn({ label, href, size = "sm" }: { label: string; href: string; size?: "sm" | "lg" }) {
  const { state: ls, copied, generate, copy, reset } = useDocLink(href);
  const cfg = FMT[label];
  const Icon = cfg?.icon ?? FileText;

  const base = size === "lg"
    ? "px-4 py-2 text-xs rounded-lg gap-2"
    : "px-2.5 py-1.5 text-[11px] rounded-md gap-1.5";

  if (ls.s === "ready") {
    return (
      <div className={`flex items-center rounded-lg overflow-hidden border ${cfg?.border ?? "border-white/15"} animate-in fade-in duration-150`}>
        <a
          href={ls.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center font-semibold ${base} ${cfg?.bg ?? ""} ${cfg?.color ?? "text-white/70"} hover:brightness-125 transition-all`}
        >
          <Download className={size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3"} />
          .{label.toLowerCase()}
        </a>
        <button type="button" onClick={copy} title="Copiar enlace"
          className="px-2.5 border-l border-white/[0.08] text-white/30 hover:text-white/70 hover:bg-white/[0.05] self-stretch flex items-center transition-colors">
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </button>
        <button type="button" onClick={reset}
          className="px-1.5 border-l border-white/[0.08] text-white/20 hover:text-white/50 self-stretch flex items-center transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={generate} disabled={ls.s === "loading"}
      className={`inline-flex items-center font-semibold border transition-all ${base}
        ${cfg?.bg ?? "bg-white/[0.06]"} ${cfg?.color ?? "text-white/50"} ${cfg?.border ?? "border-white/15"}
        ${ls.s === "loading" ? "opacity-60 cursor-wait" : "hover:brightness-125 cursor-pointer"}
        ${ls.s === "error" ? "!border-red-500/40 !text-red-400/80" : ""}
      `}>
      {ls.s === "loading" ? <Loader2 className={`${size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3"} animate-spin`} />
        : ls.s === "error" ? <AlertCircle className="h-3 w-3" />
        : <Icon className={size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3"} />}
      {ls.s === "error" ? "Error" : `.${label.toLowerCase()}`}
    </button>
  );
}

// ── FeaturedCard ──────────────────────────────────────────────────────────────
function FeaturedCard({ doc }: { doc: Doc }) {
  const primaryFmt = doc.files[0]?.label ?? "PDF";
  const cfg = FMT[primaryFmt];
  const Icon = cfg?.icon ?? FileText;
  const cc = catCfg(doc.category);
  const CatIcon = cc.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col rounded-2xl border bg-gradient-to-b from-white/[0.05] to-white/[0.02] overflow-hidden group hover:border-white/25 transition-all duration-300 ${cfg?.border ?? "border-white/10"}`}
    >
      {/* Top glow strip */}
      <div className={`h-1 w-full ${cfg?.bg.replace("/10", "/50") ?? "bg-white/20"}`} />

      {/* Star badge */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[9px] font-bold tracking-wider text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
        <Star className="h-2.5 w-2.5 fill-amber-400/60 text-amber-400/60" />
        DESTACADO
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Icon + title */}
        <div className="flex items-start gap-4 pr-16">
          <div className={`p-3 rounded-xl shrink-0 ${cfg?.bg ?? "bg-white/[0.06]"} ${cfg?.color ?? "text-white/50"} shadow-lg ${cfg?.glow ?? ""}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white leading-snug">{doc.title}</h3>
            <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cc.bg} ${cc.color} ${cc.border}`}>
              <CatIcon className="h-2.5 w-2.5" />
              {doc.category}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[12px] text-white/50 leading-relaxed line-clamp-4 flex-1">{doc.desc}</p>

        {/* Date + Formats */}
        <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
          {doc.date && (
            <p className="text-[10px] text-white/25 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> {doc.date}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {doc.files.map((f) => (
              <FormatBtn key={f.href} label={f.label} href={f.href} size="lg" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── RegularCard ───────────────────────────────────────────────────────────────
function RegularCard({ doc }: { doc: Doc }) {
  const primaryFmt = doc.files[0]?.label ?? "PDF";
  const cfg = FMT[primaryFmt];
  const Icon = cfg?.icon ?? FileText;
  const cc = catCfg(doc.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.16] transition-all duration-200 overflow-hidden group"
    >
      <div className={`h-0.5 ${cfg?.bg.replace("/10", "/45") ?? "bg-white/10"}`} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${cfg?.bg ?? "bg-white/[0.04]"} ${cfg?.color ?? "text-white/40"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-semibold text-white/90 leading-snug truncate" title={doc.title}>
              {doc.title}
            </h3>
            <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${cc.bg} ${cc.color} ${cc.border}`}>
              {doc.category}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 flex-1">{doc.desc}</p>

        <div className="pt-2.5 border-t border-white/[0.05] space-y-2">
          {doc.date && (
            <p className="text-[10px] text-white/22 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> {doc.date}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {doc.files.map((f) => (
              <FormatBtn key={f.href} label={f.label} href={f.href} size="sm" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Doc list builder ──────────────────────────────────────────────────────────
const staticDocs: Doc[] = docs
  .map((d) => ({ ...d, files: d.files.filter((f) => EDITABLE_FORMATS.includes(f.label)) }))
  .filter((d) => d.files.length > 0);

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Archivos() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [allDocs, setAllDocs]   = useState<Doc[]>(staticDocs);
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("Todos");

  useEffect(() => {
    listPublicDocs()
      .then(({ items }) => {
        const seen = new Set(staticDocs.map((d) => d.title));
        const apiDocs = items.map<Doc>((it) => ({
          title: it.title,
          desc: it.description ?? "",
          category: it.category ?? "Investigación",
          date: new Date(it.uploaded_at).toLocaleDateString(),
          icon: FileText,
          files: [{ label: "PDF", href: it.url }],
        }));
        setAllDocs([...apiDocs.filter((d) => !seen.has(d.title)), ...staticDocs]);
      })
      .catch(() => {});
  }, []);

  const featuredDocs = useMemo(() => allDocs.filter((d) => FEATURED_TITLES.has(d.title)), [allDocs]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of allDocs) counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [allDocs]);

  const filtered = useMemo(() => {
    let base = category === "Todos" ? allDocs : allDocs.filter((d) => d.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((d) => d.title.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q));
    }
    return base;
  }, [allDocs, category, search]);

  const isFiltering = !!search.trim() || category !== "Todos";
  const regularDocs = isFiltering ? filtered : filtered.filter((d) => !FEATURED_TITLES.has(d.title));

  return (
    <div className="min-h-screen bg-[hsl(205,35%,8%)] relative">
      {/* Ambient glows */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_10%_90%,hsl(168_72%_42%/0.08),transparent_55%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_90%_10%,hsl(204_70%_53%/0.06),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_50%,hsl(280_60%_40%/0.03),transparent_70%)] pointer-events-none" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <span className="text-white/15">/</span>
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-[hsl(168,72%,42%)]" />
              <span className="text-sm font-semibold text-white/80">Archivos</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.07] px-3 py-1.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/60" />
              Descarga segura · 15 min
            </div>
            {user && (
              <span className="text-[11px] text-white/35 hidden md:block">
                {user.name || user.email}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14 relative z-10">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-white/30 border border-white/[0.08] px-4 py-1.5 rounded-full bg-white/[0.03]">
            <Lock className="h-3 w-3 text-amber-400/70" />
            Acceso restringido · Personal autorizado
          </div>

          <GradientText
            colors={["#00c9a7", "#38bdf8", "#c084fc", "#00c9a7"]}
            animationSpeed={10}
            className="text-4xl sm:text-5xl font-black tracking-tight leading-none"
          >
            Biblioteca de Archivos
          </GradientText>

          <p className="text-white/40 text-sm max-w-md mx-auto">
            Documentos oficiales del Proyecto M.A.N.G.O — investigación, electrónica, pitch y más.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-0 pt-2 divide-x divide-white/[0.08]">
            {[
              { value: allDocs.length, label: "documentos" },
              { value: categories.length, label: "categorías" },
              { value: [...new Set(allDocs.flatMap((d) => d.files.map((f) => f.label)))].length, label: "formatos" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center px-6 first:pl-0 last:pr-0">
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Featured docs ───────────────────────────────────────────────────── */}
        {!isFiltering && featuredDocs.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400/40" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">
                <DecryptedText text="Documentos Principales" speed={30} maxIterations={5} animateOn="view" className="text-white/60" encryptedClassName="text-white/15" />
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent ml-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {featuredDocs.map((doc) => (
                <FeaturedCard key={doc.title} doc={doc} />
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Library ────────────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {/* Section header */}
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">
              {isFiltering ? "Resultados" : featuredDocs.length > 0 ? "Más archivos" : "Todos los archivos"}
            </h2>
            <span className="text-[10px] font-semibold text-white/25 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.08]">
              {(isFiltering ? filtered : regularDocs).length}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-teal-500/20 to-transparent ml-1" />
            {isFiltering && (
              <button
                type="button"
                onClick={() => { setSearch(""); setCategory("Todos"); }}
                className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="h-3 w-3" /> Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* ── Sidebar: categories ───────────────────────────────────────── */}
            <aside className="lg:w-52 shrink-0">
              {/* Mobile: horizontal pills */}
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[["Todos", allDocs.length], ...categories].map(([cat, count]) => {
                  const active = category === cat;
                  const cc = cat === "Todos" ? null : catCfg(cat as string);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat as string)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all shrink-0
                        ${active
                          ? cc ? `${cc.bg} ${cc.color} ${cc.border}` : "bg-white/12 text-white border-white/25"
                          : "bg-transparent text-white/40 border-white/[0.08] hover:text-white/65"
                        }`}
                    >
                      {cat}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-white/[0.06]"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Desktop: vertical sidebar */}
              <div className="hidden lg:flex flex-col gap-1 sticky top-20">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 px-3 mb-2">
                  Categorías
                </p>
                {[["Todos", allDocs.length], ...categories].map(([cat, count]) => {
                  const active = category === cat;
                  const cc = cat === "Todos" ? null : catCfg(cat as string);
                  const CatIcon = cc?.icon ?? FileText;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat as string)}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium text-left transition-all border
                        ${active
                          ? cc ? `${cc.bg} ${cc.color} ${cc.border}` : "bg-white/[0.08] text-white border-white/15"
                          : "bg-transparent text-white/45 border-transparent hover:bg-white/[0.04] hover:text-white/70"
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        {cc ? (
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cc.dot}`} />
                        ) : (
                          <FileText className="h-3 w-3 text-white/30 shrink-0" />
                        )}
                        {cat}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? "bg-white/20" : "bg-white/[0.06] text-white/30"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}

                {/* Search (desktop sidebar) */}
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar…"
                      className="w-full pl-8 pr-7 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
                    />
                    {search && (
                      <button type="button" onClick={() => setSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Main content ─────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Mobile search */}
              <div className="lg:hidden mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar archivo…"
                  className="w-full pl-9 pr-8 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Results count */}
              {isFiltering && (
                <p className="text-[11px] text-white/30 mb-4">
                  {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
                  {category !== "Todos" && <> en <span className="text-white/55">{category}</span></>}
                  {search && <> para <span className="text-white/55">"{search}"</span></>}
                </p>
              )}

              <AnimatePresence mode="wait">
                {(isFiltering ? filtered : regularDocs).length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 py-20 text-center"
                  >
                    <FileText className="h-10 w-10 text-white/10" />
                    <p className="text-sm text-white/30">
                      {search ? `Sin resultados para "${search}"` : "No hay archivos en esta categoría."}
                    </p>
                    <button type="button" onClick={() => { setSearch(""); setCategory("Todos"); }}
                      className="text-[11px] text-[hsl(168,72%,55%)] hover:underline">
                      Ver todos los archivos
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
                  >
                    {(isFiltering ? filtered : regularDocs).map((doc) => (
                      <RegularCard key={doc.title} doc={doc} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
