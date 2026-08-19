import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { DOCS_CATEGORIES } from "./docsCategories";

interface DocsSidebarProps {
  active: string;
  counts: Record<string, number>;
  onSelect: (category: string) => void;
}

/**
 * Hierarchical category nav for the docs page. Not wrapped in the shadcn
 * SidebarProvider/Sidebar shell — those assume a full-viewport, fixed-position
 * sidebar, which doesn't fit here (there's a navbar + hero above this
 * section). Reuses the same styled menu primitives, just scoped to this
 * section's own flex layout so it can sit next to the content column
 * instead of overlaying the whole page. The site's global nav floats
 * (fixed, not full-width), so nothing reserves space at the real top —
 * both sticky offsets below just dock flush against the viewport edge.
 */
export function DocsSidebar({ active, counts, onSelect }: DocsSidebarProps) {
  return (
    <>
      {/* Desktop — persistent left column */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-sidebar-border bg-sidebar">
        <div className="sticky top-4 py-8 pr-4 pl-2">
          <SidebarGroup>
            <SidebarGroupLabel>Categorías</SidebarGroupLabel>
            <SidebarMenu>
              {DOCS_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <SidebarMenuItem key={cat.id}>
                    <SidebarMenuButton
                      isActive={active === cat.id}
                      onClick={() => onSelect(cat.id)}
                      className="justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {cat.label}
                      </span>
                      <span className="text-xs text-sidebar-foreground/40">{counts[cat.id] ?? 0}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </div>
      </aside>

      {/* Mobile / tablet — collapses to a horizontal scroll of pills, single column below */}
      <div className="lg:hidden sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/95 backdrop-blur-md border-b border-border overflow-x-auto">
        <div className="flex gap-2 w-max">
          {DOCS_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = active === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
                <span className="opacity-50">{counts[cat.id] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
