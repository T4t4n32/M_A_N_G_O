import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ConnectionBanner } from "@/components/dashboard/ConnectionBanner";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { SensorChart } from "@/components/dashboard/SensorChart";
import { ImuPanel } from "@/components/dashboard/ImuPanel";
import { SystemStatusBar } from "@/components/dashboard/SystemStatusBar";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { GrafanaSection } from "@/components/dashboard/GrafanaSection";
import { MissionPanel } from "@/components/dashboard/MissionPanel";
import { DataContextBanner } from "@/components/dashboard/DataContextBanner";
import { docs } from "@/components/DocumentationSection";
import { TierGate } from "@/components/dashboard/TierGate";
import { useAuth } from "@/hooks/useAuth";
import { useHealth } from "@/hooks/useHealth";
import { useSensorData } from "@/hooks/useSensorData";
import { useSensorStream } from "@/hooks/useSensorStream";
import { useSensorAlerts } from "@/hooks/useSensorAlerts";
import { useSustainedAlerts } from "@/hooks/useSustainedAlerts";
import type { SensorType } from "@/types/dashboard";
import {
  Activity, BarChart3, Bell, PanelTop, Lock,
  ExternalLink, Target,
} from "lucide-react";
import { motion } from "framer-motion";
import BorderGlow from "@/components/effects/BorderGlow";
import DecryptedText from "@/components/effects/DecryptedText";
import GradientText from "@/components/effects/GradientText";
import BubbleMenu from "@/components/effects/BubbleMenu";
import { useNavigate } from "react-router-dom";
import icono from "@/assets/icono.png";

const SENSOR_TYPES: SensorType[] = ["ph", "temperature", "turbidity"];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const sectionIn = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function SectionTitle({
  icon: Icon,
  children,
  right,
}: {
  icon: React.ElementType;
  children: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[hsl(168,72%,42%)]" />
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          <DecryptedText
            text={children}
            speed={35}
            maxIterations={6}
            animateOn="view"
            className="text-white/65"
            encryptedClassName="text-accent/25"
          />
        </h2>
      </div>
      {right}
    </div>
  );
}

function ArchivosSummaryCard({ navigate }: { navigate: (path: string) => void }) {
  const totalDocs  = docs.length;
  const categories = [...new Set(docs.map((d) => d.category))];
  const formats    = [...new Set(docs.flatMap((d) => d.files.map((f) => f.label)))].slice(0, 4);

  const FORMAT_COLOR: Record<string, string> = {
    PDF:  "text-red-300 bg-red-500/10 border-red-500/25",
    DOCX: "text-blue-300 bg-blue-500/10 border-blue-500/25",
    XLSX: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
    PPTX: "text-orange-300 bg-orange-500/10 border-orange-500/25",
    MD:   "text-purple-300 bg-purple-500/10 border-purple-500/25",
  };

  return (
    <div
      onClick={() => navigate("/archivos")}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate("/archivos")}
      className="group relative rounded-xl border border-white/[0.08] bg-[hsl(205,35%,9%)] hover:border-amber-500/25 hover:bg-[hsl(205,35%,10%)] transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* top accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-500/60 via-orange-400/40 to-transparent" />

      <div className="flex items-center justify-between gap-4 px-5 py-4">
        {/* left: icon + text */}
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
            <Lock className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/90">Biblioteca de Archivos</p>
            <p className="text-[11px] text-white/35 mt-0.5">
              {totalDocs} archivos · {categories.length} categorías · acceso restringido
            </p>
            <div className="flex gap-1.5 mt-2">
              {formats.map((fmt) => (
                <span
                  key={fmt}
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${FORMAT_COLOR[fmt] ?? "text-white/40 bg-white/[0.05] border-white/10"}`}
                >
                  .{fmt.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* right: CTA */}
        <div className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold group-hover:bg-amber-500/18 transition-colors">
          Explorar
          <ExternalLink className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

const bubbleItems = [
  { label: "Sensores",  href: "#sensores",           rotation: -5, hoverStyles: { bgColor: "hsl(168,72%,42%)",  textColor: "#fff" } },
  { label: "Historial", href: "#historial",          rotation:  6, hoverStyles: { bgColor: "hsl(204,70%,53%)",  textColor: "#fff" } },
  { label: "Avisos",    href: "#notificaciones",     rotation: -4, hoverStyles: { bgColor: "hsl(38,90%,55%)",   textColor: "#0b0b0b" } },
  { label: "Grafana",   href: "#grafana",            rotation:  5, hoverStyles: { bgColor: "hsl(180,55%,42%)",  textColor: "#fff" } },
  { label: "Misiones",  href: "#misiones",           rotation:  3, hoverStyles: { bgColor: "hsl(168,72%,42%)",  textColor: "#fff" } },
  { label: "Archivos",  href: "/archivos",            rotation: -3, hoverStyles: { bgColor: "hsl(38,90%,55%)",   textColor: "#0b0b0b" } },
  { label: "Inicio",    href: "/",                   rotation:  4, hoverStyles: { bgColor: "hsl(195,70%,48%)",  textColor: "#fff" } },
];

export default function Dashboard() {
  const { user, role, tier } = useAuth();
  const { isOffline, isDegraded } = useHealth();
  const { sensors, context, refetch } = useSensorData();
  useSensorStream();
  const systemAlert = useSensorAlerts(sensors);
  const sustainedAlert = useSustainedAlerts();
  const navigate = useNavigate();

  const isAdmin = role === "admin";

  const handleNav = (href: string) => {
    if (href.startsWith("/")) navigate(href);
    else document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[hsl(205,35%,8%)] relative">
      {/* Ambient background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_15%_85%,hsl(168_72%_42%/0.07),transparent_55%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_85%_15%,hsl(204_70%_53%/0.05),transparent_50%)] pointer-events-none" />
      <div
        className="fixed inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Mobile nav */}
      <div className="md:hidden">
        <BubbleMenu
          logo={<img src={icono} alt="M.A.N.G.O" className="w-9 h-9 rounded-full" />}
          items={bubbleItems}
          onItemClick={handleNav}
          useFixedPosition
          menuBg="hsl(205, 35%, 14%)"
          menuContentColor="hsl(168, 72%, 60%)"
          menuAriaLabel="Menú del dashboard"
          className="top-3 right-3"
          style={{ zIndex: 100 }}
        />
      </div>

      <DashboardHeader userName={user?.name || user?.email} onRefresh={refetch} userRole={role} />
      <ConnectionBanner isOffline={isOffline} isDegraded={isDegraded} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 relative z-10" role="main">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <GradientText
            colors={["#00c9a7", "#38bdf8", "#c084fc", "#00c9a7"]}
            animationSpeed={8}
            className="text-xs font-semibold tracking-widest uppercase"
          >
            Panel de Control — M.A.N.G.O
          </GradientText>
        </motion.div>

        {/* ── SENSORS + BNO080 — 4-column row ────────────────────────────── */}
        <motion.section
          id="sensores"
          initial="hidden"
          animate="show"
          variants={sectionIn}
          aria-label="Estado de sensores"
        >
          <SectionTitle icon={Activity}>Estado de Sensores</SectionTitle>

          <DataContextBanner />

          <TierGate minTier="dataline_high" currentTier={tier} label="Estado de sensores">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {/* pH, Temperature, Turbidity */}
            {SENSOR_TYPES.map((type) => {
              const sAlert = systemAlert.sensorAlerts.find((a) => a.type === type);
              return (
                <motion.div key={type} variants={fadeUp}>
                  <BorderGlow
                    borderRadius={12}
                    glowRadius={20}
                    glowIntensity={0.55}
                    colors={
                      type === "ph"
                        ? ["#c084fc", "#38bdf8", "#00c9a7"]
                        : type === "temperature"
                          ? ["#f97316", "#eab308", "#00c9a7"]
                          : ["#38bdf8", "#00c9a7", "#c084fc"]
                    }
                  >
                    <SensorCard
                      type={type}
                      state={sensors[type].state}
                      reading={sensors[type].reading}
                      alertLevel={sAlert?.level}
                      onRetry={refetch}
                    />
                  </BorderGlow>
                </motion.div>
              );
            })}

            {/* BNO080 3D panel — 4th column */}
            <motion.div variants={fadeUp} className="sm:col-span-2 lg:col-span-1">
              <BorderGlow
                borderRadius={12}
                glowRadius={22}
                glowIntensity={0.45}
                colors={["#00c9a7", "#38bdf8", "#c084fc"]}
              >
                <div className="h-full min-h-[260px]">
                  <ImuPanel state="not_configured" />
                </div>
              </BorderGlow>
            </motion.div>
          </motion.div>
          </TierGate>
        </motion.section>

        {/* ── SYSTEM STATUS BAR ───────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          aria-label="Estado del sistema y alertas"
        >
          <SystemStatusBar systemAlert={systemAlert} sustainedAlert={sustainedAlert} />
        </motion.section>

        {/* ── SENSOR HISTORY ──────────────────────────────────────────────── */}
        <motion.section
          id="historial"
          initial="hidden"
          animate="show"
          variants={sectionIn}
          aria-label="Historial de sensores"
        >
          <SectionTitle
            icon={BarChart3}
            right={
              <a
                href="/grafana/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-white/35 hover:text-[hsl(168,72%,55%)] transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Análisis completo en Grafana
              </a>
            }
          >
            Historial de Sensores
          </SectionTitle>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {SENSOR_TYPES.map((type) => (
              <motion.div key={type} variants={fadeUp}>
                <SensorChart type={type} />
              </motion.div>
            ))}
          </motion.div>
          <p className="text-[11px] text-white/25 mt-2 text-right">
            Las líneas punteadas indican umbrales de advertencia (amarillo) y crítico (rojo). Para análisis avanzado usa Grafana.
          </p>
        </motion.section>

        {/* ── NOTIFICATIONS & MAINTENANCE ─────────────────────────────────── */}
        <motion.section
          id="notificaciones"
          initial="hidden"
          animate="show"
          variants={sectionIn}
          aria-label="Notificaciones y mantenimiento"
        >
          <SectionTitle icon={Bell}>Notificaciones y Mantenimiento</SectionTitle>
          <NotificationsPanel />
        </motion.section>

        {/* ── GRAFANA — ADVANCED ANALYTICS ────────────────────────────────── */}
        <motion.section
          id="grafana"
          initial="hidden"
          animate="show"
          variants={sectionIn}
          aria-label="Paneles Grafana"
        >
          <SectionTitle icon={PanelTop}>Grafana — Análisis Avanzado</SectionTitle>
          <TierGate minTier="institutional" currentTier={tier} label="Grafana — Análisis Avanzado">
            <GrafanaSection />
          </TierGate>
        </motion.section>

        {/* ── ARCHIVOS — entry card linking to /archivos ───────────────────── */}
        <motion.section
          id="archivos-editables"
          initial="hidden"
          animate="show"
          variants={sectionIn}
          aria-label="Archivos del proyecto"
        >
          <SectionTitle icon={Lock}>Archivos — Acceso Restringido</SectionTitle>
          <ArchivosSummaryCard navigate={navigate} />
        </motion.section>

        {/* ── MISSION CONTROL ─────────────────────────────────────────────── */}
        <motion.section
          id="misiones"
          initial="hidden"
          animate="show"
          variants={sectionIn}
          aria-label="Control de Misiones"
        >
          <SectionTitle icon={Target}>Control de Misiones</SectionTitle>
          <MissionPanel isAdmin={isAdmin} />
        </motion.section>

      </main>
    </div>
  );
}
