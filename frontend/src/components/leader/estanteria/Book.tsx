import { motion } from "framer-motion";
import type { EstanteriaBook } from "./estanteriaData";

interface BookProps {
  book: EstanteriaBook;
  isOpen: boolean;
  isActive: boolean;
  dimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onActivate: () => void;
}

const darken = (hsl: string) => hsl.replace(/(\d+)%\)$/, (_, l) => `${Math.max(0, Number(l) - 22)}%)`);

/**
 * A single book on the shelf. Fase 0 (reposo): closed cover, slight
 * standing-book perspective. Fase 1 (hover/first tap): the cover swings
 * open on its spine (rotateY) revealing eyebrow+title underneath — no
 * overlay, book stays put. Fase 2 (click on an already-open book) is
 * handled by the parent Estanteria: it hands the eyebrow+title block a
 * shared `layoutId` so framer-motion morphs it straight into the expanded
 * card instead of popping a modal from nowhere.
 */
export function Book({ book, isOpen, isActive, dimmed, onEnter, onLeave, onActivate }: BookProps) {
  const spine = darken(book.color);

  return (
    <button
      type="button"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onActivate}
      aria-label={`Ver ${book.title}`}
      aria-expanded={isOpen}
      className="group relative h-64 sm:h-72 w-full text-left focus:outline-none rounded-r-md rounded-l-sm transition-[transform,box-shadow,opacity] duration-[400ms] ease-out shadow-[0px_48px_66px_-18px_rgba(0,0,0,0.1)] hover:-translate-y-[18px] hover:scale-[1.035] hover:shadow-[0px_42px_56px_0px_rgba(0,0,0,0.34),0px_42px_62px_0px_var(--glow)]"
      style={{
        perspective: "1400px",
        willChange: isOpen ? "transform" : undefined,
        opacity: dimmed ? 0.35 : 1,
        zIndex: isOpen ? 20 : 1,
        ["--glow" as string]: book.glowColor,
      }}
    >
      {/* Shelf shadow */}
      <div
        className="absolute -bottom-2 left-2 right-2 h-4 rounded-full bg-black/50 blur-md"
        aria-hidden="true"
      />

      {/* Standing perspective wrapper */}
      <div
        className="relative h-full w-full rounded-r-md rounded-l-sm overflow-visible transition-transform duration-500"
        style={{ transform: "rotateY(-6deg)", transformStyle: "preserve-3d" }}
      >
        {/* Inner page — sits underneath the cover, revealed as it swings open.
            Shares a layoutId with BookExpandedCard's outer panel so the whole
            card (not just its text) visibly grows from here on click. */}
        <motion.div
          layoutId={isActive ? undefined : `book-panel-${book.id}`}
          className="absolute inset-0 rounded-r-md rounded-l-sm flex flex-col justify-end p-4 pb-5"
          style={{
            background: `linear-gradient(160deg, hsl(210,30%,14%), hsl(210,35%,9%))`,
            border: `1px solid ${book.glowColor}`,
            boxShadow: isOpen ? `0 0 24px ${book.glowColor}` : "none",
          }}
        >
          {/* While this book's expanded card is open, the shared-layoutId copy
              lives there instead — two elements can't share one layoutId at
              once, so this one drops back to a plain (non-shared) motion node. */}
          <motion.div layoutId={isActive ? undefined : `book-eyebrow-${book.id}`} className="mb-1.5">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.15em]"
              style={{ color: book.color }}
            >
              {book.eyebrow}
            </span>
          </motion.div>
          <motion.h4
            layoutId={isActive ? undefined : `book-title-${book.id}`}
            className="text-white font-bold text-base leading-tight"
          >
            {book.title}
          </motion.h4>
          {book.badge && (
            <span className="mt-1.5 inline-block w-fit text-[10px] font-semibold text-white/40">{book.badge}</span>
          )}
        </motion.div>

        {/* Cover — swings open on its left edge (the spine) */}
        <motion.div
          className="absolute inset-0 rounded-r-md rounded-l-sm flex flex-col items-center justify-center gap-3 px-3 text-center"
          style={{
            background: `linear-gradient(135deg, ${book.color}, ${spine})`,
            transformOrigin: "left center",
            backfaceVisibility: "hidden",
            boxShadow: "2px 0 12px rgba(0,0,0,0.35)",
          }}
          animate={{ rotateY: isOpen ? -100 : 0 }}
          transition={{ duration: 0.6, ease: [0.45, 0, 0.2, 1] }}
        >
          {/* Spine edge — darker strip along the hinge, reads as the book's side */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 rounded-l-sm"
            style={{ background: spine }}
            aria-hidden="true"
          />
          <span className="text-white/90 font-bold text-sm leading-tight drop-shadow">{book.title}</span>
          <span className="text-white/60 text-[10px] uppercase tracking-widest">{book.eyebrow}</span>
        </motion.div>
      </div>
    </button>
  );
}
