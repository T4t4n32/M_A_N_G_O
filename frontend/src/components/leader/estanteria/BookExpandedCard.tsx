import { motion } from "framer-motion";
import { X, BookOpen } from "lucide-react";
import { useCategoryMedia } from "@/lib/useCategoryMedia";
import { hslAlpha } from "@/lib/color";
import type { EstanteriaBook } from "./estanteriaData";

interface BookExpandedCardProps {
  book: EstanteriaBook;
  onClose: () => void;
}

/**
 * Fase 2 — the "shared element" the book's eyebrow+title morphs into
 * (matching layoutId, see Book.tsx). Two columns: text left, visual right.
 * `visualType: "photo"` fetches real, live media for the book's category
 * from Panel Emma (same pipeline PilaresSection/SeasonsGrid used) — the
 * spec's own placeholder filenames aren't real assets, so this pulls the
 * actual uploaded photo instead of a made-up path.
 */
export function BookExpandedCard({ book, onClose }: BookExpandedCardProps) {
  const { media } = useCategoryMedia(book.category ?? "", book.visualType === "photo");
  const photo = media.find((m) => m.type === "image");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <motion.div
        layoutId={`book-panel-${book.id}`}
        onClick={(e) => e.stopPropagation()}
        className="relative grid md:grid-cols-2 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-[32px] border bg-[hsl(210,32%,10%)] shadow-2xl"
        style={{ borderColor: book.glowColor }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full flex items-center justify-center bg-black/30 text-white/70 hover:text-white hover:bg-black/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Left — text */}
        <div className="p-8 md:p-10 flex flex-col gap-4">
          <motion.div layoutId={`book-eyebrow-${book.id}`}>
            <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: book.color }}>
              {book.eyebrow}
            </span>
          </motion.div>
          <motion.h3 layoutId={`book-title-${book.id}`} className="text-3xl md:text-4xl font-bold text-white leading-tight">
            {book.title}
          </motion.h3>
          <p className="text-white/70 text-sm md:text-base leading-relaxed">{book.description}</p>

          {book.tags && book.tags.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1.5">Logros</p>
              <p className="text-sm font-medium" style={{ color: book.color }}>
                {book.tags.join(" · ")}
              </p>
            </div>
          )}

          {book.badge && (
            <p className="text-xs text-white/40 font-mono">{book.badge}</p>
          )}

          {book.ctaLabel && (
            <span
              className="mt-2 inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-widest"
              style={{ color: book.color }}
            >
              <BookOpen className="h-3.5 w-3.5" />
              {book.ctaLabel}
            </span>
          )}
        </div>

        {/* Right — visual */}
        <div
          className="relative min-h-[240px] md:min-h-full"
          style={{ background: `linear-gradient(160deg, ${hslAlpha(book.color, 0.13)}, transparent)` }}
        >
          {book.visualType === "photo" && photo ? (
            <img src={photo.src} alt={photo.alt} className="absolute inset-0 w-full h-full object-cover" />
          ) : book.visualType === "logo" && book.visualSrc ? (
            <div className="absolute inset-0 flex items-center justify-center p-10">
              <img src={book.visualSrc} alt={book.title} className="max-w-[60%] max-h-[60%] object-contain" />
            </div>
          ) : book.visualType === "icon" && book.Icon ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-8 rounded-full" style={{ background: hslAlpha(book.color, 0.13) }}>
                <book.Icon className="h-16 w-16" style={{ color: book.color }} />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-10 w-10" style={{ color: book.color, opacity: 0.3 }} />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
