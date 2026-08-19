import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { docs } from "@/components/DocumentationSection";
import { FramerEmbed } from "@/components/effects/FramerEmbed";
import { RippleCta } from "@/components/effects/RippleCta";
import { SectionTeaser } from "./SectionTeaser";

// Published Framer.com "AKservices" code component, repurposed here as a
// documentation-category showcase grid. Rendered via FramerEmbed (isolated
// React island — see that file for why); falls back to the plain
// SectionTeaser (the previous teaser design) if framer.com/CDN is unreachable.
//
// The companion Framer "Ripple" button (a WebGL water-shader CTA) was tried
// the same way, but its module imports `Shader`/`RichText`/`defineShader`/etc
// from "framer" — a much deeper runtime surface than public/framer-shim.js
// implements (that shim only covers addPropertyControls/ControlType/
// RenderTarget, enough for AKservices above). It fails the same import
// every time (not a transient CDN hiccup), so rather than ship a permanent
// console error and a doomed network round-trip, the CTA below is
// `RippleCta` — a small native water-glow + click-ripple button instead.
const FRAMER_AK_SERVICES_URL = "https://framer.com/m/AKservices-oJwgp8.js@OgfGj2oSGClhGS20N5z1";

/** Real mangrove photography (Pexels — free license, no attribution required)
 *  used as backdrop imagery for the category cards and the CTA button. */
const MANGROVE_PHOTOS = {
  rootsInRiver: "https://images.pexels.com/photos/12708316/pexels-photo-12708316.jpeg?auto=compress&cs=tinysrgb&w=1600",
  aerialRiver: "https://images.pexels.com/photos/29137616/pexels-photo-29137616.jpeg?auto=compress&cs=tinysrgb&w=800",
  sunset: "https://images.pexels.com/photos/36405819/pexels-photo-36405819.jpeg?auto=compress&cs=tinysrgb&w=800",
  forest: "https://images.pexels.com/photos/13035525/pexels-photo-13035525.jpeg?auto=compress&cs=tinysrgb&w=800",
};
const CARD_PHOTOS = [MANGROVE_PHOTOS.rootsInRiver, MANGROVE_PHOTOS.aerialRiver, MANGROVE_PHOTOS.sunset, MANGROVE_PHOTOS.forest];

// Reusing lucide-react's actual path data (same icon set used across the
// rest of the site) as inline SVG badges, since the Framer component's
// "icon" control only accepts an <img> URL, not a React component.
const ICON_PATHS = {
  fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  clipboardList: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  presentation: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
} as const;

function iconBadge(paths: string, accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">` +
    `<rect x="1" y="1" width="50" height="50" rx="14" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-opacity="0.35"/>` +
    `<g transform="translate(14 14)" fill="none" stroke="${accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</g>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const TEAL = "#00c9a7";
const BLUE = "#38bdf8";
const GOLD = "#fbbf24";

// Curated preview of the documentation library (the full set, including
// "Fuentes", stays browsable at /documentacion). Counts and formats are
// derived from the real `docs` catalog below — never hardcoded.
const CATEGORY_META = [
  { category: "Investigación", icon: ICON_PATHS.fileText, accent: TEAL, desc: "Base de investigación, revisión bibliográfica y viabilidad económica del proyecto." },
  { category: "Técnico", icon: ICON_PATHS.cpu, accent: BLUE, desc: "Arquitectura del sistema, seguridad, dashboard y despliegue del monitoreo." },
  { category: "Electrónica", icon: ICON_PATHS.cpu, accent: BLUE, desc: "Esquemas de circuito, sensores y comunicación LoRa del hardware M.A.N.G.O." },
  { category: "Bitácoras", icon: ICON_PATHS.clipboardList, accent: GOLD, desc: "Registro periódico de la etapa productiva SENA, bitácora a bitácora." },
  { category: "Presentaciones", icon: ICON_PATHS.presentation, accent: TEAL, desc: "Boards y formatos institucionales usados para presentar el proyecto." },
  { category: "Pitch", icon: ICON_PATHS.mic, accent: GOLD, desc: "Material de pitch para jurados, convocatorias y foros de innovación." },
] as const;

export function DocumentationTeaser() {
  const navigate = useNavigate();

  const { totalDocs, services } = useMemo(() => {
    const list = CATEGORY_META.map((meta, i) => {
      const inCategory = docs.filter((d) => d.category === meta.category);
      const formats = [...new Set(inCategory.flatMap((d) => d.files.map((f) => f.label)))];
      return {
        icon: iconBadge(meta.icon, meta.accent),
        iconPosition: "left" as const,
        title: meta.category,
        titleFont: '"Merriweather", Georgia, serif',
        titleWeight: "700",
        titleSize: 20,
        titleColor: "#ffffff",
        description: `${meta.desc} ${inCategory.length} documento${inCategory.length === 1 ? "" : "s"}.`,
        descFont: "system-ui, sans-serif",
        descWeight: "400",
        descSize: 13,
        descColor: "rgba(255,255,255,0.5)",
        tags: formats,
        images: [CARD_PHOTOS[i % CARD_PHOTOS.length]],
      };
    });
    return { totalDocs: docs.length, services: list };
  }, []);

  const goToDocs = () => navigate("/documentacion");

  return (
    <section id="documentacion" className="py-20 md:py-28 bg-[hsl(210,38%,6%)] relative overflow-hidden">
      {/* Ambient background glow — matches the full /documentacion page */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-[15%] w-[500px] h-[400px] bg-[hsl(168,72%,42%)] opacity-[0.06] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-[10%] w-[400px] h-[300px] bg-[hsl(195,70%,48%)] opacity-[0.06] blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <FramerEmbed
          moduleUrl={FRAMER_AK_SERVICES_URL}
          componentProps={{
            sectionBg: "transparent",
            paddingH: 0,
            paddingV: 0,
            columns: 3,
            columnGap: 20,
            rowGap: 20,
            showBadge: true,
            badgeLabel: "DOCUMENTACIÓN",
            badgeBg: "rgba(0,201,167,0.10)",
            badgeTextColor: "#5eead4",
            badgeAccentColor: TEAL,
            badgeFont: "system-ui, sans-serif",
            badgeFontSize: 11,
            heading: "Documentación del Proyecto",
            headingFont: '"Merriweather", Georgia, serif',
            headingWeight: "800",
            headingSize: 38,
            headingColor: "#ffffff",
            showSubheading: true,
            subheading: `${totalDocs} documentos públicos — investigación, bitácoras, presentaciones y fuentes técnicas, organizados por categoría.`,
            subheadingFont: "system-ui, sans-serif",
            subheadingWeight: "400",
            subheadingSize: 14,
            subheadingColor: "rgba(255,255,255,0.5)",
            cardBg: "rgba(255,255,255,0.045)",
            cardRadius: 16,
            tagBg: "rgba(56,189,248,0.10)",
            tagColor: "#7dd3fc",
            tagDotColor: TEAL,
            services,
          }}
          fallback={
            <SectionTeaser
              id="documentacion-fallback"
              eyebrow="Investigación y desarrollo"
              title="Documentación del Proyecto"
              description={`${totalDocs} documentos — investigación, bitácoras, presentaciones y fuentes del proyecto, organizados por categoría.`}
              ctaLabel="Ver documentación completa"
              to="/documentacion"
              accent="blue"
            >
              <div className="flex flex-wrap gap-2">
                {CATEGORY_META.map(({ category }) => (
                  <span
                    key={category}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.05] border border-white/10 text-white/60"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </SectionTeaser>
          }
        />

        <div className="mt-10 flex justify-center">
          <RippleCta
            label="Ver documentación completa"
            onActivate={goToDocs}
            backgroundImage={MANGROVE_PHOTOS.rootsInRiver}
          />
        </div>
      </div>
    </section>
  );
}
