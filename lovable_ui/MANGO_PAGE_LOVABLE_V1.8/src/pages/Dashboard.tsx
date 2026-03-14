import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ConnectionBanner } from "@/components/dashboard/ConnectionBanner";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { SensorChart } from "@/components/dashboard/SensorChart";
import { ImuPanel } from "@/components/dashboard/ImuPanel";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { SustainedAlertPanel } from "@/components/dashboard/SustainedAlertPanel";
import { GrafanaSection } from "@/components/dashboard/GrafanaSection";
import { useAuth } from "@/hooks/useAuth";
import { useHealth } from "@/hooks/useHealth";
import { useSensorData } from "@/hooks/useSensorData";
import { useSensorAlerts } from "@/hooks/useSensorAlerts";
import { useSustainedAlerts } from "@/hooks/useSustainedAlerts";
import type { SensorType } from "@/types/dashboard";
import { Activity, BarChart3, Cpu, ShieldCheck, Clock, PanelTop } from "lucide-react";
import { motion } from "framer-motion";

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

export default function Dashboard() {
  const { user } = useAuth();
  const { isOffline, isDegraded } = useHealth();
  const { sensors, refetch } = useSensorData();
  const systemAlert = useSensorAlerts(sensors);
  const sustainedAlert = useSustainedAlerts();

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

      <DashboardHeader userName={user?.name || user?.email} onRefresh={refetch} />
      <ConnectionBanner isOffline={isOffline} isDegraded={isDegraded} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 relative z-10" role="main">
        {/* Sistema de Alertas */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          aria-label="Alertas del sistema"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-[hsl(168,72%,42%)]" />
            <h2 className="text-sm font-semibold text-white/70 tracking-wide uppercase">
              Estado del Sistema
            </h2>
          </div>
          <AlertPanel alert={systemAlert} />
        </motion.section>

        {/* Alertas Sostenidas en el Tiempo */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          aria-label="Alertas sostenidas"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-[hsl(168,72%,42%)]" />
            <h2 className="text-sm font-semibold text-white/70 tracking-wide uppercase">
              Alertas Sostenidas
            </h2>
          </div>
          <SustainedAlertPanel alert={sustainedAlert} />
        </motion.section>

        {/* Sensores en tiempo real */}
        <motion.section initial="hidden" animate="show" variants={sectionFade} aria-label="Sensores en tiempo real">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-[hsl(168,72%,42%)]" />
            <h2 className="text-sm font-semibold text-white/70 tracking-wide uppercase">
              Sensores en Tiempo Real
            </h2>
          </div>
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
                  <SensorCard
                    type={type}
                    state={sensors[type].state}
                    reading={sensors[type].reading}
                    alertLevel={sAlert?.level}
                    onRetry={() => refetch()}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Historial */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={sectionFade}
          transition={{ delay: 0.3 }}
          aria-label="Historial de sensores"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-[hsl(168,72%,42%)]" />
            <h2 className="text-sm font-semibold text-white/70 tracking-wide uppercase">
              Historial
            </h2>
          </div>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
          aria-label="Panel IMU"
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-4 w-4 text-[hsl(168,72%,42%)]" />
            <h2 className="text-sm font-semibold text-white/70 tracking-wide uppercase">
              IMU / Orientación
            </h2>
          </div>
          <ImuPanel state="not_configured" />
        </motion.section>

        {/* Grafana Integration */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
          aria-label="Paneles Grafana"
        >
          <div className="flex items-center gap-2 mb-4">
            <PanelTop className="h-4 w-4 text-[hsl(168,72%,42%)]" />
            <h2 className="text-sm font-semibold text-white/70 tracking-wide uppercase">
              Grafana — Análisis Avanzado
            </h2>
          </div>
          <GrafanaSection />
        </motion.section>
      </main>
    </div>
  );
}
