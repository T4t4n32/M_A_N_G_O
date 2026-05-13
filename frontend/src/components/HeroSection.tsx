import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import RotatingText from "@/components/effects/RotatingText";
import GradientText from "@/components/effects/GradientText";
import DecryptedText from "@/components/effects/DecryptedText";
import LineWaves from "@/components/effects/LineWaves";
import { useSiteValue } from "@/lib/siteContent";

const particles = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1.5,
  duration: Math.random() * 10 + 6,
  delay: Math.random() * 5,
}));

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const eyebrow = useSiteValue("hero.eyebrow", "Conservación de Manglares · Tecnología Autónoma");
  const titleLine = useSiteValue("hero.titleLine", "Monitoreo Autónomo de");
  const description = useSiteValue(
    "hero.description",
    "Sistema institucional de monitoreo ambiental en tiempo real para la protección de manglares y ecosistemas marítimos. Tecnología al servicio de la conservación.",
  );
  const cta1 = useSiteValue("hero.cta1", "Conoce el Proyecto");
  const cta2 = useSiteValue("hero.cta2", "Contacto Institucional");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* LineWaves WebGL Background */}
      <div className="absolute inset-0 z-0">
        <LineWaves
          speed={0.2}
          innerLineCount={22}
          outerLineCount={28}
          warpIntensity={1.3}
          rotation={-30}
          edgeFadeWidth={0}
          colorCycleSpeed={0.6}
          brightness={0.22}
          color1="#00e5bf"
          color2="#0891b2"
          color3="#2563eb"
          enableMouseInteraction
          mouseInfluence={2}
        />
      </div>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-[rgba(10,16,22,0.72)]" />

      {/* Accent glow orbs */}
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_20%_80%,hsl(168_72%_42%/0.1),transparent_50%)]" />
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_80%_20%,hsl(204_70%_53%/0.08),transparent_45%)]" />

      {/* Subtle wave accent */}
      <div className="absolute inset-0 z-[3] overflow-hidden opacity-10 pointer-events-none">
        <svg className="absolute bottom-0 w-full h-48" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,170.7C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="hsl(168 72% 42% / 0.25)"
          />
        </svg>
      </div>

      {/* Floating particles */}
      {mounted && particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full z-[3]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0
              ? 'hsl(168 72% 42% / 0.5)'
              : p.id % 3 === 1
              ? 'hsl(204 70% 53% / 0.4)'
              : 'hsl(50 90% 58% / 0.3)',
            boxShadow: `0 0 ${p.size * 3}px ${p.size}px ${
              p.id % 3 === 0 ? 'hsl(168 72% 42% / 0.2)' : 'hsl(204 70% 53% / 0.15)'
            }`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <GradientText
            colors={['#00c9a7', '#38bdf8', '#c084fc', '#00c9a7']}
            animationSpeed={6}
            showBorder
            className="text-xs font-semibold tracking-wider uppercase mb-6"
          >
            {eyebrow}
          </GradientText>
        </motion.div>

        <motion.h1
          className="text-[2rem] xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mt-6 break-words"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          style={{ textShadow: '0 2px 20px hsl(210 35% 6% / 0.8), 0 0 40px hsl(210 35% 6% / 0.5)' }}
        >
          <span className="text-white block">{titleLine}</span>
          <span className="flex items-center justify-center gap-2 sm:gap-3 text-[1.15rem] sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mt-3 mb-2 min-h-[3em] sm:min-h-[1.8em] px-2">
            <RotatingText
              texts={["Niveles y Gestión Oceánica", "Ecosistemas de Manglar", "Conservación Ambiental", "Datos en Tiempo Real"]}
              rotationInterval={3000}
              staggerDuration={0.02}
              className="justify-center text-center"
              elementLevelClassName="text-[#00ffcc] drop-shadow-[0_0_12px_rgba(0,255,204,0.4)]"
            />
          </span>
        </motion.h1>

        <motion.p
          className="mt-8 text-lg sm:text-xl max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <DecryptedText
            text={description}
            speed={25}
            maxIterations={14}
            animateOn="view"
            className="text-white/90"
            encryptedClassName="text-white/40"
          />
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Button
            size="lg"
            className="relative overflow-hidden bg-gradient-to-r from-[hsl(168,72%,42%)] to-[hsl(204,70%,53%)] text-white rounded-full px-10 text-base font-bold shadow-[0_0_30px_hsl(168_72%_42%/0.35)] hover:shadow-[0_0_50px_hsl(168_72%_42%/0.5)] transition-all duration-500 hover:scale-105 border-0"
            onClick={() => document.querySelector("#proyecto")?.scrollIntoView({ behavior: "smooth" })}
          >
            {cta1}
          </Button>
          <Button
            size="lg"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 rounded-full px-10 text-base font-semibold transition-all duration-300 backdrop-blur-md hover:scale-105"
            onClick={() => document.querySelector("#contacto")?.scrollIntoView({ behavior: "smooth" })}
          >
            {cta2}
          </Button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={() => document.querySelector("#proyecto")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/40 hover:text-white/70 transition-colors"
        aria-label="Scroll down"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="h-8 w-8" />
      </motion.button>
    </section>
  );
}
