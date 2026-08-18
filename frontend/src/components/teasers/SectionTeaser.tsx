import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import DecryptedText from "@/components/effects/DecryptedText";
import BorderGlow from "@/components/effects/BorderGlow";
import { Button } from "@/components/ui/button";

const ACCENTS = {
  teal: { colors: ["#00c9a7", "#38bdf8", "#c084fc"], text: "text-accent" },
  blue: { colors: ["#38bdf8", "#00c9a7", "#c084fc"], text: "text-[hsl(204,70%,60%)]" },
  gold: { colors: ["#fbbf24", "#f97316", "#00c9a7"], text: "text-amber-400" },
} as const;

interface SectionTeaserProps {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  to: string;
  accent?: keyof typeof ACCENTS;
  children?: ReactNode;
}

/** Compact "jab" card for a section that now lives on its own route — shown
 *  on the landing page in place of the full section, with a CTA into it. */
export function SectionTeaser({
  id, eyebrow, title, description, ctaLabel, to, accent = "teal", children,
}: SectionTeaserProps) {
  const navigate = useNavigate();
  const { colors, text } = ACCENTS[accent];

  return (
    <section id={id} className="py-16 md:py-20 bg-[hsl(210,36%,7.5%)] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <BorderGlow borderRadius={20} glowRadius={26} glowIntensity={0.5} colors={[...colors]}>
          <div className="rounded-[20px] p-8 md:p-10 bg-white/[0.03] backdrop-blur-sm">
            <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${text}`}>
              {eyebrow}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2">
              <DecryptedText
                text={title}
                speed={40}
                maxIterations={8}
                animateOn="view"
                className="text-white"
                encryptedClassName={`${text}/40`}
              />
            </h2>
            <p className="mt-3 text-white/55 max-w-2xl">{description}</p>

            {children && <div className="mt-6">{children}</div>}

            <Button
              onClick={() => navigate(to)}
              className="mt-7 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6 font-semibold gap-2"
            >
              {ctaLabel} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </BorderGlow>
      </div>
    </section>
  );
}
