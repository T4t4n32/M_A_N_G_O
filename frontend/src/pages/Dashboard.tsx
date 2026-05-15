import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ConnectionBanner } from "@/components/dashboard/ConnectionBanner";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { SensorChart } from "@/components/dashboard/SensorChart";
import { ImuPanel } from "@/components/dashboard/ImuPanel";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { SustainedAlertPanel } from "@/components/dashboard/SustainedAlertPanel";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { GrafanaSection } from "@/components/dashboard/GrafanaSection";
import { RestrictedDocsPanel } from "@/components/dashboard/RestrictedDocsPanel";
import { useAuth } from "@/hooks/useAuth";
import { useHealth } from "@/hooks/useHealth";
import { useSensorData } from "@/hooks/useSensorData";
import { useSensorAlerts } from "@/hooks/useSensorAlerts";
import { useSustainedAlerts } from "@/hooks/useSustainedAlerts";
import type { SensorType } from "@/types/dashboard";
import { Activity, BarChart3, Cpu, ShieldCheck, Clock, PanelTop, Lock, Bell } from "lucide-react";
import { motion } from "framer-motion";
import BorderGlow from "@/components/effects/BorderGlow";
import DecryptedText from "@/components/effects/DecryptedText";
import GradientText from "@/components/effects/GradientText";
import BubbleMenu from "@/components/effects/BubbleMenu";
import { useNavigate } from "react-router-dom";
import icono from "@/assets/icono.png";
const SENSOR_TYPES: SensorType[] = ["ph", "temperature", "turbidity"];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const sectionFade = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-[hsl(168,72%,42%)]" />
      <h2 className="text-sm font-semibold tracking-wide uppercase">
        <DecryptedText
          text={children}
          speed={35}
          maxIterations={6}
          animateOn="view"
          className="text-white/70"
          encryptedClassName="text-accent/30"
        />
      </h2>
    </div>
  );
}

const dashboardBubbleItems = [
  { label: "Sensores", href: "#sensores", rotation: -5, hoverStyles: { bgColor: "hsl(168,72%,42%)", textColor: "#fff" } },
  { label: "Gráficas", href: "#graficas", rotation: 6, hoverStyles: { bgColor: "hsl(204,70%,53%)", textColor: "#fff" } },
  { label: "IMU", href: "#imu", rotation: -4, hoverStyles: { bgColor: "hsl(50,90%,58%)", textColor: "hsl(205,40%,12%)" } },
  { label: "Alertas", href: "#alertas", rotation: 5, hoverStyles: { bgColor: "hsl(0,65%,51%)", textColor: "#fff" } },
  { label: "Avisos", href: "#notificaciones", rotation: -3, hoverStyles: { bgColor: "hsl(38,90%,55%)", textColor: "#0b0b0b" } },
  { label: "Grafana", href: "#grafana", rotation: -6, hoverStyles: { bgColor: "hsl(180,55%,42%)", textColor: "#fff" } },
  { label: "Archivos", href: "#archivos-editables", rotation: 3, hoverStyles: { bgColor: "hsl(38,90%,55%)", textColor: "#0b0b0b" } },
  { label: "Inicio", href: "/", rotation: 4, hoverStyles: { bgColor: "hsl(195,70%,48%)", textColor: "#fff" } },
];

export default function Dashboard() {
  const { user, role } = useAuth();
  const { isOffline, isDegraded } = useHealth();
  const { sensors, refetch } = useSensorData();
  const systemAlert = useSensorAlerts(sensors);
  const sustainedAlert = useSustainedAlerts();
  const navigate = useNavigate();

  const handleDashboardNav = (href: string) => {
    if (href.startsWith("/")) {
      navigate(href);
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(205,35%,8%)] relative">
      {/* Background accents */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_20%_80%,hsl(168_72%_42%/0.06),transparent_55%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_80%_20%,hsl(204_70%_53%/0.05),transparent_50%)] pointer-events-none" />
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Mobile BubbleMenu for Dashboard */}
      <div className="md:hidden">
        <BubbleMenu
          logo={<img src={icono} alt="M.A.N.G.O" className="w-9 h-9 rounded-full" />}
          items={dashboardBubbleItems}
          onItemClick={handleDashboardNav}
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
        {/* Dashboard title with gradient */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <GradientText
            colors={['#00c9a7', '#38bdf8', '#c084fc', '#00c9a7']}
            animationSpeed={8}
            className="text-xs font-semibold tracking-widest uppercase"
          >
            Panel de Control — M.A.N.G.O
          </GradientText>
        </motion.div>

        {/* Sistema de Alertas */}
        <motion.section
          id="alertas"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          aria-label="Alertas del sistema"
        >
          <SectionTitle icon={ShieldCheck}>Estado del Sistema</SectionTitle>
          <AlertPanel alert={systemAlert} />
        </motion.section>

        {/* Alertas Sostenidas en el Tiempo */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          aria-label="Alertas sostenidas"
        >
          <SectionTitle icon={Clock}>Alertas Sostenidas</SectionTitle>
          <SustainedAlertPanel alert={sustainedAlert} />
        </motion.section>

        {/* Notificaciones, mantenimiento y SMS */}
        <motion.section
          id="notificaciones"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          aria-label="Notificaciones y mantenimiento"
        >
          <SectionTitle icon={Bell}>Notificaciones y Mantenimiento</SectionTitle>
          <NotificationsPanel />
        </motion.section>

        {/* Sensores en tiempo real - with BorderGlow */}
        <motion.section id="sensores" initial="hidden" animate="show" variants={sectionFade} aria-label="Sensores en tiempo real">
          <SectionTitle icon={Activity}>Sensores en Tiempo Real</SectionTitle>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {SENSOR_TYPES.map((type) => {
              const sAlert = systemAlert.sensorAlerts.find((a) => a.type === type);
              return (
                <motion.div key={type} variants={fadeUp}>
                  <BorderGlow
                    borderRadius={12}
                    glowRadius={20}
                    glowIntensity={0.6}
                    colors={
                      type === 'ph' ? ['#c084fc', '#38bdf8', '#00c9a7'] :
                      type === 'temperature' ? ['#f97316', '#eab308', '#00c9a7'] :
                      ['#38bdf8', '#00c9a7', '#c084fc']
                    }
                  >
                    <SensorCard
                      type={type}
                      state={sensors[type].state}
                      reading={sensors[type].reading}
                      alertLevel={sAlert?.level}
                      onRetry={() => refetch()}
                    />
                  </BorderGlow>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Historial */}
        <motion.section
          id="graficas"
          initial="hidden"
          animate="show"
          variants={sectionFade}
          transition={{ delay: 0.3 }}
          aria-label="Historial de sensores"
        >
          <SectionTitle icon={BarChart3}>Historial</SectionTitle>
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
        </motion.section>

        {/* IMU Panel */}
        <motion.section
          id="imu"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
          aria-label="Panel IMU"
        >
          <SectionTitle icon={Cpu}>IMU / Orientación</SectionTitle>
          <ImuPanel state="not_configured" />
        </motion.section>

        {/* Grafana Integration */}
        <motion.section
          id="grafana"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
          aria-label="Paneles Grafana"
        >
          <SectionTitle icon={PanelTop}>Grafana — Análisis Avanzado</SectionTitle>
          <GrafanaSection />
        </motion.section>

        {/* Archivos editables (restringido a usuarios autenticados) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
          aria-label="Archivos editables del proyecto"
        >
          <SectionTitle icon={Lock}>Archivos Editables — Acceso Restringido</SectionTitle>
          <RestrictedDocsPanel />
        </motion.section>
      </main>
    </div>
  );
}
