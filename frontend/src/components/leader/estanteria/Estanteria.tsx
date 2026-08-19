import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DecryptedText from "@/components/effects/DecryptedText";
import { DrawerCard } from "../DrawerCard";
import { personasCards, milestoneIdsByCard } from "../personasData";
import { Book } from "./Book";
import { BookExpandedCard } from "./BookExpandedCard";
import { estanteriaFloors } from "./estanteriaData";

function useHasHover() {
  const [hasHover, setHasHover] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setHasHover(mq.matches);
    const handler = (e: MediaQueryListEvent) => setHasHover(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return hasHover;
}

/**
 * Estantería 3D — dynamic, scalable shelf (N books per floor, N floors).
 * Desktop: hover opens a book's cover (Fase 1), clicking the already-open
 * book expands it into a detail card (Fase 2). Touch: first tap opens,
 * second tap on the same (already open) book expands it — there's no real
 * hover to trigger Fase 1 automatically.
 */
export function Estanteria() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const hasHover = useHasHover();

  const allBooks = estanteriaFloors.flatMap((f) => f.books);
  const activeBook = allBooks.find((b) => b.id === activeId) ?? null;

  useEffect(() => {
    if (!activeId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveId(null);
        setOpenId(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeId]);

  const close = () => {
    setActiveId(null);
    setOpenId(null);
  };

  const handleEnter = (id: string) => {
    if (activeId || !hasHover) return;
    setOpenId(id);
  };

  const handleLeave = (id: string) => {
    if (activeId || !hasHover) return;
    setOpenId((prev) => (prev === id ? null : prev));
  };

  const handleActivate = (id: string) => {
    if (activeId) return;
    if (hasHover) {
      // Desktop: the book is already open from hover — this click expands it.
      setOpenId(id);
      setActiveId(id);
      return;
    }
    // Touch: first tap opens, second tap on the same open book expands it.
    if (openId === id) {
      setActiveId(id);
    } else {
      setOpenId(id);
    }
  };

  return (
    <div className="space-y-10 rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {personasCards.map((c) => (
          <DrawerCard key={c.id} card={c} milestoneIds={milestoneIdsByCard[c.id]} />
        ))}
      </div>

      {estanteriaFloors.map((floor) => (
        <div key={floor.floor}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full bg-amber-400" />
            <h3 className="text-amber-400/70 text-xs font-semibold uppercase tracking-[0.2em]">
              <DecryptedText
                text={floor.label}
                speed={30}
                maxIterations={5}
                animateOn="view"
                className="text-amber-400/70"
                encryptedClassName="text-amber-400/20"
              />
            </h3>
          </div>
          {floor.sublabel && (
            <p className="text-white/25 text-[11px] mb-6 pl-3 uppercase tracking-widest">{floor.sublabel}</p>
          )}

          <div
            className={`grid gap-6 sm:gap-8 ${floor.books.length >= 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 max-w-md"}`}
          >
            {floor.books.map((book) => (
              <Book
                key={book.id}
                book={book}
                isOpen={openId === book.id}
                isActive={activeId === book.id}
                dimmed={!!activeId && activeId !== book.id}
                onEnter={() => handleEnter(book.id)}
                onLeave={() => handleLeave(book.id)}
                onActivate={() => handleActivate(book.id)}
              />
            ))}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {activeBook && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeBook && <BookExpandedCard key={`card-${activeBook.id}`} book={activeBook} onClose={close} />}
      </AnimatePresence>
    </div>
  );
}
