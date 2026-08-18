import { useMemo, useRef, useState } from "react";
import { docs } from "@/components/DocumentationSection";
import { DOCS_CATEGORIES } from "@/components/docs/docsCategories";
import { DocsNavbar } from "@/components/docs/DocsNavbar";
import { DocsHero } from "@/components/docs/DocsHero";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsMain } from "@/components/docs/DocsMain";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSiteSeo } from "@/lib/siteSeo";

export default function Documentacion() {
  useSiteSeo();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeCategory, setActiveCategory] = useState(DOCS_CATEGORIES[0].id);
  const contentRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of docs) c[d.category] = (c[d.category] ?? 0) + 1;
    return c;
  }, []);

  const activeDocs = useMemo(
    () => docs.filter((d) => d.category === activeCategory),
    [activeCategory],
  );

  const activeCategoryMeta = DOCS_CATEGORIES.find((c) => c.id === activeCategory) ?? DOCS_CATEGORIES[0];

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground">
        <DocsNavbar theme={theme} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />

        <DocsHero
          docCount={docs.length}
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
      </div>
    </div>
  );
}
