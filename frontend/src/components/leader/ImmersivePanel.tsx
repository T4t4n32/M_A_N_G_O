import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Video, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "./leaderData";
import DomeGallery from "@/components/effects/DomeGallery";

interface ImmersivePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  description: string;
  narrative: string;
  accentColor?: string;
  media: MediaItem[];
  extraContent?: React.ReactNode;
  headerIcon?: string;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

function MobileLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: { src: string; alt: string }[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      onClick={onClose}
    >
      <div className="flex justify-between items-center px-4 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="text-white/50 text-sm">
          {idx + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white/70"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div
        className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[idx].src}
          alt={images[idx].alt}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-6 pb-6 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={prev} className="p-3 rounded-full bg-white/10 text-white active:bg-white/20">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={next} className="p-3 rounded-full bg-white/10 text-white active:bg-white/20">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}

function MobileImageGrid({ images }: { images: { src: string; alt: string }[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const cols = images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";

  return (
    <>
      <div className={`grid ${cols} gap-2`}>
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIdx(i)}
            className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-black/30
                       group touch-manipulation select-none"
            style={{ aspectRatio: images.length === 1 ? "16/9" : "1" }}
            aria-label={img.alt || `Foto ${i + 1}`}
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-200 group-active:scale-[0.97]"
            />
            <div className="absolute inset-0 bg-black/0 active:bg-black/25 transition-colors
                            flex items-center justify-center pointer-events-none">
              <ZoomIn className="h-5 w-5 text-white/0 group-hover:text-white/70 transition-colors" />
            </div>
            {/* Photo counter badge */}
            {i === 0 && images.length > 1 && (
              <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white/80 text-[10px]
                               px-1.5 py-0.5 rounded-full font-mono backdrop-blur-sm pointer-events-none">
                {images.length}
              </span>
            )}
          </button>
        ))}
      </div>
      {lightboxIdx !== null && (
        <MobileLightbox
          images={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

function LazyVideo({ src, alt, isOpen }: { src: string; alt: string; isOpen: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setHasLoaded(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    }
  }, [isOpen]);

  const handlePlay = () => {
    if (videoRef.current) {
      if (!hasLoaded) {
        videoRef.current.src = src;
        videoRef.current.load();
        setHasLoaded(true);
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-black/40">
      <div className="aspect-video relative">
        <video
          ref={videoRef}
          preload="none"
          controls={isPlaying}
          playsInline
          className="absolute inset-0 w-full h-full object-contain bg-black"
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
        {!isPlaying && (
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 hover:bg-black/50 active:bg-black/40 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center shadow-lg shadow-accent/30">
              <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
            </div>
            <span className="text-white/70 text-xs font-medium max-w-[80%] text-center line-clamp-2 px-2">
              {alt}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function ImmersivePanel({
  isOpen,
  onClose,
  title,
  subtitle,
  description,
  narrative,
  accentColor = "hsl(168 72% 42%)",
  media,
  extraContent,
  headerIcon,
}: ImmersivePanelProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const subcategories = useMemo(() => {
    const subs = new Set<string>();
    media.forEach((m) => {
      if (m.subcategory) subs.add(m.subcategory);
    });
    return Array.from(subs);
  }, [media]);

  const hasFilters = subcategories.length > 1;

  const filteredMedia = useMemo(() => {
    if (!activeFilter) return media;
    return media.filter((m) => m.subcategory === activeFilter);
  }, [media, activeFilter]);

  const galleryItems = useMemo(() => {
    return filteredMedia
      .filter((m) => m.type === "image")
      .map((item) => ({ src: item.src, alt: item.alt || title }));
  }, [filteredMedia, title]);

  const videoItems = useMemo(() => {
    return filteredMedia.filter((m) => m.type === "video");
  }, [filteredMedia]);

  useEffect(() => {
    if (!isOpen) {
      // Force-close any DomeGallery fullscreen that may have been left open —
      // if not cleaned up the backdrop (z-index 99998) blocks all page clicks.
      document.querySelectorAll('.dg-fullscreen-backdrop').forEach(el => el.remove());
      const dg = document.querySelector('.dg-fullscreen-enlarge') as HTMLElement | null;
      if (dg) {
        dg.style.pointerEvents = 'none';
        dg.remove();
      }
      document.body.classList.remove('dg-scroll-lock');
      return;
    }
    setActiveFilter(null);
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setActiveFilter(null);
  }, [media]);

  const domeSegments = Math.min(galleryItems.length > 20 ? 18 : 24, 24);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-8"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80 md:bg-black/85 md:backdrop-blur-xl" />

          <motion.div
            initial={isMobile ? { y: "100%" } : { scale: 0.94, opacity: 0, y: 16 }}
            animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
            exit={isMobile ? { y: "100%" } : { scale: 0.94, opacity: 0, y: 16 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="panel-sheet relative w-full md:max-w-5xl overflow-y-auto
                       rounded-t-2xl md:rounded-2xl border-t md:border border-white/[0.10]
                       bg-[hsl(210_35%_8%)] shadow-2xl"
            style={{ height: "min(94svh, 94vh)", maxHeight: "94vh" }}
          >
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-3 right-3 md:top-4 md:right-4 z-10 p-2 rounded-full
                         bg-white/[0.08] hover:bg-white/[0.15] text-white/60 hover:text-white
                         transition-colors touch-manipulation"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            {/* Header */}
            <div className="px-4 pt-2 pb-4 md:p-8 md:pb-0">
              <div className="flex items-start gap-3 md:gap-5">
                {headerIcon && (
                  <div className="w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-white/[0.10] bg-white">
                    <img
                      src={headerIcon}
                      alt={title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 pr-10">
                  <div
                    className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-2 uppercase tracking-wider"
                    style={{ background: accentColor.replace(")", " / 0.15)"), color: accentColor }}
                  >
                    {subtitle}
                  </div>
                  <h2 className="text-lg md:text-3xl font-bold text-white mb-1 leading-tight">
                    {title}
                  </h2>
                  <p className="text-white/55 text-xs md:text-sm max-w-2xl line-clamp-2 md:line-clamp-none leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-6 md:p-8 space-y-5">
              {/* Gallery */}
              {galleryItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/40 text-[11px] font-semibold uppercase tracking-wider">
                      Galería · {galleryItems.length} fotos
                    </span>
                  </div>

                  {/* Subcategory filters */}
                  {hasFilters && (
                    <div className="flex gap-2 flex-wrap mb-3 -mx-0.5">
                      <button
                        type="button"
                        onClick={() => setActiveFilter(null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border touch-manipulation select-none ${
                          activeFilter === null
                            ? "bg-accent/20 border-accent/40 text-accent"
                            : "bg-white/[0.04] border-white/[0.08] text-white/50 active:bg-white/[0.08]"
                        }`}
                      >
                        Todas ({media.filter((m) => m.type === "image").length})
                      </button>
                      {subcategories.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setActiveFilter(sub)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border touch-manipulation select-none ${
                            activeFilter === sub
                              ? "bg-accent/20 border-accent/40 text-accent"
                              : "bg-white/[0.04] border-white/[0.08] text-white/50 active:bg-white/[0.08]"
                          }`}
                        >
                          {sub} ({media.filter((m) => m.subcategory === sub && m.type === "image").length})
                        </button>
                      ))}
                    </div>
                  )}

                  {isMobile ? (
                    <MobileImageGrid images={galleryItems} />
                  ) : (
                    <>
                      <div
                        className="h-[420px] rounded-xl overflow-hidden border border-white/[0.06]"
                        style={{ background: "hsl(210 35% 6%)" }}
                      >
                        <DomeGallery
                          images={galleryItems}
                          fit={0.65}
                          minRadius={280}
                          maxVerticalRotationDeg={6}
                          segments={domeSegments}
                          dragDampening={2.2}
                          grayscale
                          overlayBlurColor="hsl(210, 35%, 6%)"
                          imageBorderRadius="12px"
                          openedImageBorderRadius="16px"
                          openedImageWidth="min(90vw, 800px)"
                          openedImageHeight="min(85vh, 700px)"
                        />
                      </div>
                      <p className="text-white/25 text-xs mt-2 text-center">
                        Arrastra para explorar · Clic para ampliar
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Videos */}
              {videoItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-white/40 text-[11px] font-semibold uppercase tracking-wider">
                      Videos · {videoItems.length}
                    </span>
                  </div>
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns:
                        videoItems.length === 1 || isMobile
                          ? "1fr"
                          : "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
                    }}
                  >
                    {videoItems.map((vid, i) => (
                      <LazyVideo key={i} src={vid.src} alt={vid.alt} isOpen={isOpen} />
                    ))}
                  </div>
                </div>
              )}

              {/* Narrative */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                  <h3 className="text-white/35 text-[11px] font-semibold uppercase tracking-wider mb-2 text-center">
                    Historia
                  </h3>
                  <p className="text-white/75 text-sm leading-relaxed">{narrative}</p>
                </div>

                {extraContent}

                {narrative !== description && description && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                    <h3 className="text-white/35 text-[11px] font-semibold uppercase tracking-wider mb-2 text-center">
                      Valor
                    </h3>
                    <p className="text-white/55 text-sm leading-relaxed">{description}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
