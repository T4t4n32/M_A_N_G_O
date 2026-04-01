import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Video } from "lucide-react";
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
        videoRef.current.removeAttribute('src');
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
    <div className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-black/40 group">
      <video
        ref={videoRef}
        preload="none"
        controls={isPlaying}
        playsInline
        className="w-full h-auto object-contain max-h-[400px]"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      {!isPlaying && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 hover:bg-black/40 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center shadow-lg shadow-accent/20">
            <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
          </div>
          <span className="text-white/70 text-xs font-medium max-w-[80%] text-center truncate">{alt}</span>
        </button>
      )}
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

  const subcategories = useMemo(() => {
    const subs = new Set<string>();
    media.forEach((m) => { if (m.subcategory) subs.add(m.subcategory); });
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
      .map((item) => ({
        src: item.src,
        alt: item.alt || title,
      }));
  }, [filteredMedia, title]);

  const videoItems = useMemo(() => {
    return filteredMedia.filter((m) => m.type === "video");
  }, [filteredMedia]);

  useEffect(() => {
    if (!isOpen) return;
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

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[hsl(210_35%_8%)] shadow-2xl"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="p-4 md:p-8 pb-0">
                <div className="flex items-start gap-3 md:gap-5">
                  {headerIcon && (
                    <div
                      className="w-12 h-12 md:w-24 md:h-24 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-white/[0.08] bg-white"
                    >
                      <img src={headerIcon} alt={title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div
                      className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 uppercase tracking-wider"
                      style={{ backgroundColor: `${accentColor} / 0.15)`.replace('hsl', 'hsla').replace(' / ', ',').replace(')', ')'), color: accentColor }}
                    >
                      {subtitle}
                    </div>
                    <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{title}</h2>
                    <p className="text-white/60 text-xs md:text-base max-w-2xl line-clamp-3 md:line-clamp-none">{description}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 md:p-8">
                {/* Circular Gallery */}
                {galleryItems.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">
                        Galería ({galleryItems.length} fotos)
                      </span>
                    </div>

                    {/* Subcategory filters */}
                    {hasFilters && (
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        <button
                          onClick={() => setActiveFilter(null)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                            activeFilter === null
                              ? "bg-accent/20 border-accent/40 text-accent"
                              : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80"
                          }`}
                        >
                          Todas ({media.filter(m => m.type === "image").length})
                        </button>
                        {subcategories.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => setActiveFilter(sub)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                              activeFilter === sub
                                ? "bg-accent/20 border-accent/40 text-accent"
                                : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80"
                            }`}
                          >
                            {sub} ({media.filter((m) => m.subcategory === sub && m.type === "image").length})
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="h-[350px] md:h-[450px] rounded-xl overflow-hidden border border-white/[0.06]" style={{ background: "hsl(210 35% 6%)" }}>
                      <DomeGallery
                        images={galleryItems}
                        fit={0.65}
                        minRadius={280}
                        maxVerticalRotationDeg={6}
                        segments={galleryItems.length > 30 ? 22 : 28}
                        dragDampening={2.2}
                        grayscale
                        overlayBlurColor="hsl(210, 35%, 6%)"
                        imageBorderRadius="12px"
                        openedImageBorderRadius="16px"
                        openedImageWidth="min(90vw, 800px)"
                        openedImageHeight="min(85vh, 700px)"
                      />
                    </div>

                    <p className="text-white/30 text-xs mt-2 text-center">
                      Arrastra para explorar · Clic para ampliar
                    </p>
                  </div>
                )}

                {/* Videos */}
                {videoItems.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Video className="h-3.5 w-3.5 text-white/40" />
                      <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">
                        Videos ({videoItems.length})
                      </span>
                    </div>
                    <div className="grid gap-4" style={{ gridTemplateColumns: videoItems.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' }}>
                      {videoItems.map((vid, i) => (
                        <LazyVideo key={i} src={vid.src} alt={vid.alt} isOpen={isOpen} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Narrative */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
                    <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">Historia</h3>
                    <p className="text-white/80 text-sm leading-relaxed text-justify">{narrative}</p>
                  </div>

                  {extraContent}

                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
                    <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 text-center">Valor</h3>
                    <p className="text-white/60 text-sm leading-relaxed text-justify">
                      {narrative !== description ? description : ""}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
