import { useSiteValue } from "@/lib/siteContent";
import calibotsLogo from "@/assets/calibots-logo.png";
import madreFoto from "@/assets/madre-foto.png";
import padreFoto from "@/assets/padre-foto.png";
import { SectionTeaser } from "./SectionTeaser";

const AVATARS = [
  { src: calibotsLogo, alt: "CALIBOTS" },
  { src: madreFoto, alt: "Yamileth Chacón" },
  { src: padreFoto, alt: "Héctor Ignacio Sánchez" },
];

export function AboutTeaser() {
  const subheading = useSiteValue(
    "about.subheading",
    "Estudiantes e investigadores de Cali, Colombia, que construyeron este sistema desde cero",
  );

  return (
    <SectionTeaser
      id="sobre"
      eyebrow="El equipo"
      title="El equipo detrás de M.A.N.G.O"
      description={subheading}
      ctaLabel="Conoce al equipo"
      to="/sobre"
      accent="teal"
    >
      <div className="flex -space-x-3">
        {AVATARS.map((a) => (
          <img
            key={a.alt}
            src={a.src}
            alt={a.alt}
            className="w-11 h-11 rounded-full border-2 border-[hsl(210,36%,7.5%)] object-cover bg-white/90"
          />
        ))}
      </div>
    </SectionTeaser>
  );
}
