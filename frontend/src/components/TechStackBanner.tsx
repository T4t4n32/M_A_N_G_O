import { Cpu, Radio, Wifi, Database, BarChart3, Globe, Shield, Zap } from "lucide-react";
import LogoLoop from "@/components/effects/LogoLoop";

const techLogos = [
  { node: <a href="https://www.espressif.com/en/products/socs/esp32" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Cpu className="h-5 w-5" /><span className="text-xs font-semibold">ESP32</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Microcontrolador IoT</span></a>, title: "ESP32" },
  { node: <a href="https://lora-alliance.org" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Radio className="h-5 w-5" /><span className="text-xs font-semibold">LoRa</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Comunicación de largo alcance</span></a>, title: "LoRa" },
  { node: <a href="https://www.wi-fi.org" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Wifi className="h-5 w-5" /><span className="text-xs font-semibold">WiFi</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Conectividad inalámbrica</span></a>, title: "WiFi" },
  { node: <a href="https://www.postgresql.org" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Database className="h-5 w-5" /><span className="text-xs font-semibold">PostgreSQL</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Base de datos relacional</span></a>, title: "PostgreSQL" },
  { node: <a href="https://grafana.com" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><BarChart3 className="h-5 w-5" /><span className="text-xs font-semibold">Grafana</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Visualización de datos</span></a>, title: "Grafana" },
  { node: <a href="https://react.dev" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Globe className="h-5 w-5" /><span className="text-xs font-semibold">React</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">Interfaz de usuario</span></a>, title: "React" },
  { node: <a href="https://developer.nvidia.com/embedded/jetson-tk1" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Shield className="h-5 w-5" /><span className="text-xs font-semibold">Jetson TK1</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">GPU para edge computing</span></a>, title: "Jetson TK1" },
  { node: <a href="https://platformio.org" target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-2 rounded-full px-3 py-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer hover:bg-white/5"><Zap className="h-5 w-5" /><span className="text-xs font-semibold">PlatformIO</span><span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-[70] shadow-lg border border-border/80 backdrop-blur-md group-hover:-translate-y-0.5">IDE para embebidos</span></a>, title: "PlatformIO" },
];

/**
 * Floating "technologies used" strip — landing page only. Deliberately not
 * part of Footer.tsx (which is shared across every route): it's its own
 * card, a DOM sibling of the footer panel with a real gap between them, so
 * the footer growing/shrinking on other pages never touches it, and it
 * simply doesn't render outside the landing page at all.
 *
 * Full-bleed (edge to edge of the viewport, not capped at max-w-7xl like
 * the footer panel) — same height as before, just the full page width, so
 * the marquee has real room to flow.
 */
export function TechStackBanner() {
  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen z-10">
      <div
        className="border-y border-white/10 bg-white/[0.04] py-5 px-6 md:px-10 overflow-hidden"
        style={{
          boxShadow:
            "-60px 0 100px -40px rgba(0,201,167,0.4), 60px 0 100px -40px rgba(192,132,252,0.35)",
        }}
      >
        <p className="text-[10px] uppercase tracking-widest text-white/25 text-center mb-3 font-semibold">
          Tecnologías utilizadas en el proyecto
        </p>
        <LogoLoop
          logos={techLogos}
          speed={60}
          direction="left"
          logoHeight={28}
          gap={56}
          fadeOut
          fadeOutColor="hsl(210, 38%, 6%)"
        />
      </div>
    </div>
  );
}
