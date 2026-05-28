import { useRef, type ReactNode, type ElementType } from "react";
import { Pencil } from "lucide-react";
import { useLiveEdit, resolveSiteField } from "@/contexts/LiveEditContext";

interface EditableFieldProps {
  siteKey: string;
  /** The element type to render as (default: span) */
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

/**
 * Wraps any rendered site-content value.
 * In view mode: transparent pass-through.
 * In edit mode: adds orange ring + click handler that opens the edit popover.
 *
 * Usage:
 *   <EditableField siteKey="hero.titleLine" as="h1" className="text-4xl">
 *     {titleLine}
 *   </EditableField>
 */
export function EditableField({ siteKey, as: Tag = "span", className = "", children }: EditableFieldProps) {
  const { isEditMode, openEdit } = useLiveEdit();
  const ref = useRef<HTMLElement>(null);

  if (!isEditMode) {
    return <Tag className={className}>{children}</Tag>;
  }

  const { label, type } = resolveSiteField(siteKey);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openEdit({
      siteKey,
      label,
      type,
      anchorRect: ref.current?.getBoundingClientRect() ?? null,
    });
  };

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={`${className} group relative cursor-pointer outline-none ring-2 ring-orange-400/70 ring-offset-2 ring-offset-transparent rounded hover:ring-orange-400 transition-shadow`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Editar: ${label}`}
      onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)}
    >
      {children}
      <span
        className="absolute -top-6 left-0 z-[9999] flex items-center gap-1 rounded-t-sm bg-orange-500 px-1.5 py-0.5 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity"
        aria-hidden
      >
        <Pencil className="h-2.5 w-2.5" />
        {label}
      </span>
    </Tag>
  );
}
