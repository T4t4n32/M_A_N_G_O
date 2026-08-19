import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Download, FileWarning, X } from "lucide-react";
import { FramerEmbed } from "@/components/effects/FramerEmbed";

// Published Framer.com "PDF-viewer-code" component: a full pdf.js-powered
// viewer (toolbar, page nav, zoom, rotate, search, thumbnails, fullscreen).
// Only needs addPropertyControls/ControlType/RenderTarget from "framer" —
// all covered by public/framer-shim.js — and loads pdf.js itself from
// esm.sh/cdnjs at runtime, isolated from our bundle. Falls back to a plain
// "download instead" card if framer.com or the pdf.js CDN is unreachable.
const FRAMER_PDF_VIEWER_URL = "https://framer.com/m/PDF-viewer-code-xzGKGz.js@nOIyLPTVFclXMeMrwcuW";

interface PdfPreviewModalProps {
  title: string;
  url: string;
  onClose: () => void;
}

export function PdfPreviewModal({ title, url, onClose }: PdfPreviewModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Focus management: send focus into the dialog on open, restore on close;
  // lock body scroll while the viewer is up — same convention as the
  // gallery lightbox in GallerySection.tsx.
  useEffect(() => {
    lastTrigger.current = (document.activeElement as HTMLElement) ?? null;
    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }, 30);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      lastTrigger.current?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-title"
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        data-autofocus
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Cerrar visor"
        className="absolute top-4 right-4 z-10 text-white/70 hover:text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        <X className="h-7 w-7" />
      </button>

      <div
        className="w-full max-w-5xl h-[85vh] rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[hsl(210,38%,6%)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="pdf-preview-title" className="sr-only">{title}</h2>
        <FramerEmbed
          moduleUrl={FRAMER_PDF_VIEWER_URL}
          componentProps={{
            sourceType: "url",
            pdfUrl: url,
            initialView: "fit",
            showToolbar: true,
            showPageControls: true,
            showZoomControls: true,
            showRotate: true,
            showSearch: true,
            showThumbnails: true,
            showDownload: true,
            showFullscreen: true,
            downloadName: `${title}.pdf`,
            toolbarBg: "#0d1b24",
            toolbarText: "#e5f3f8",
            accent: "#00c9a7",
            viewerBg: "#0a1216",
            pageShadow: true,
            cornerRadius: 0,
          }}
          fallback={
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
              <FileWarning className="h-10 w-10 text-white/30" />
              <div>
                <p className="text-white/70 font-medium">No se pudo cargar el visor de PDF</p>
                <p className="text-white/40 text-sm mt-1">Puedes descargar el documento directamente.</p>
              </div>
              <a
                href={url}
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-semibold transition-colors"
              >
                <Download className="h-4 w-4" />
                Descargar {title}
              </a>
            </div>
          }
        />
      </div>
    </div>,
    document.body,
  );
}
