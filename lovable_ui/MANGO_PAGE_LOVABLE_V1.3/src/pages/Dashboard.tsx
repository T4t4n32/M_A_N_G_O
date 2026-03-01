import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ConnectionBanner } from "@/components/dashboard/ConnectionBanner";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { SensorChart } from "@/components/dashboard/SensorChart";
import { ImuPanel } from "@/components/dashboard/ImuPanel";
import { useAuth } from "@/hooks/useAuth";
import { useHealth } from "@/hooks/useHealth";
import { useSensorData } from "@/hooks/useSensorData";
import type { SensorType } from "@/types/dashboard";
import { Activity, BarChart3, Cpu } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-mango-deep">
      <DashboardHeader userName={user?.name || user?.email} onRefresh={refetch} />
      <ConnectionBanner isOffline={isOffline} isDegraded={isDegraded} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8" role="main">
        {/* Sensores en tiempo real */}
        <motion.section initial="hidden" animate="show" variants={sectionFade} aria-label="Sensores en tiempo real">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-secondary-foreground tracking-wide uppercase">
              Sensores en Tiempo Real
            </h2>
          </div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {SENSOR_TYPES.map((type) => (
              <motion.div key={type} variants={fadeUp}>
                <SensorCard
                  type={type}
                  state={sensors[type].state}
                  reading={sensors[type].reading}
                  onRetry={() => refetch()}
                />
              </motion.div>
            ))}
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
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-secondary-foreground tracking-wide uppercase">
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
            <Cpu className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-secondary-foreground tracking-wide uppercase">
              IMU / Orientación
            </h2>
          </div>
          <ImuPanel state="not_configured" />
        </motion.section>
      </main>
    </div>
  );
}
