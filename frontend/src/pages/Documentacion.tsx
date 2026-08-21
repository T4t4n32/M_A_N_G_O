import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { docs, buildPublicDocs, mapBackendDoc, type Doc } from "@/components/DocumentationSection";
import { DOCS_CATEGORIES } from "@/components/docs/docsCategories";
import { DocsHero } from "@/components/docs/DocsHero";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsMain } from "@/components/docs/DocsMain";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSiteSeo } from "@/lib/siteSeo";
import { listPublicDocs } from "@/lib/api";

const isKnownCategory = (id: string | null): id is string =>
  DOCS_CATEGORIES.some((c) => c.id === id);

export default function Documentacion() {
  useSiteSeo();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [searchParams] = useSearchParams();
  const requestedCategory = searchParams.get("categoria");
  const [activeCategory, setActiveCategory] = useState(
    () => (isKnownCategory(requestedCategory) ? requestedCategory : DOCS_CATEGORIES[0].id),
  );
  const contentRef = useRef<HTMLDivElement>(null);

  // Fuente real de documentos públicos: arranca con el listado estático como
  // fallback inmediato y se reemplaza en cuanto responde el backend, para no
  // depender de un rebuild del frontend cada vez que se sube un PDF nuevo.
  const [allDocs, setAllDocs] = useState<Doc[]>(docs);
  useEffect(() => {
    let cancelled = false;
    listPublicDocs()
      .then(({ items }) => {
        if (cancelled) return;
        setAllDocs(buildPublicDocs(items.map(mapBackendDoc)));
      })
      .catch(() => {
        // Sin conexión al backend: seguimos mostrando el listado estático.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Arriving from a link like /documentacion?categoria=Electrónica (e.g. the
  // landing page's documentation carousel) both selects that category and
  // jumps straight to the content — skipping the hero's manual "explorar"
  // step, since the visitor already told us what they want to see.
  useEffect(() => {
    if (!isKnownCategory(requestedCategory)) return;
    setActiveCategory(requestedCategory);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [requestedCategory]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of allDocs) c[d.category] = (c[d.category] ?? 0) + 1;
    return c;
  }, [allDocs]);

  const activeDocs = useMemo(
    () => allDocs.filter((d) => d.category === activeCategory),
    [allDocs, activeCategory],
  );

  const activeCategoryMeta = DOCS_CATEGORIES.find((c) => c.id === activeCategory) ?? DOCS_CATEGORIES[0];

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <main className="min-h-screen bg-background text-foreground">
        <Header />
        <div id="contenido" tabIndex={-1} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-32 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>
          <div className="flex items-center gap-1.5" role="group" aria-label="Cambiar tema">
            <Sun className={`h-3.5 w-3.5 ${theme === "light" ? "text-primary" : "text-muted-foreground"}`} />
            <Switch
              checked={theme === "dark"}
              onCheckedChange={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label="Alternar modo oscuro"
            />
            <Moon className={`h-3.5 w-3.5 ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        </div>

        <DocsHero
          docCount={allDocs.length}
          onExplore={() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        />

        <div ref={contentRef}>
          {/* SidebarProvider's own wrapper is a row flex with no wrap — nesting
              our own flex-col/lg:flex-row div keeps that a single flex item,
              so mobile actually stacks (pills bar above, content below)
              instead of being squeezed into a row alongside it. */}
          <SidebarProvider defaultOpen className="min-h-0 block">
            <div className="flex flex-col lg:flex-row w-full">
              <DocsSidebar active={activeCategory} counts={counts} onSelect={setActiveCategory} />
              <DocsMain category={activeCategoryMeta} docs={activeDocs} />
            </div>
          </SidebarProvider>
        </div>

        <Footer />
      </main>
    </div>
  );
}
