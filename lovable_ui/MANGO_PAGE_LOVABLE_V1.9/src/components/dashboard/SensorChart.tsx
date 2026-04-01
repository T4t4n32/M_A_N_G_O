import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer, Droplets, FlaskConical } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useSensorRange } from "@/hooks/useSensorRange";
import type { SensorType } from "@/types/dashboard";

const RANGE_OPTIONS = [
  { label: "15 min", minutes: 15 },
  { label: "1 h", minutes: 60 },
  { label: "6 h", minutes: 360 },
  { label: "24 h", minutes: 1440 },
];

const CHART_COLORS: Record<SensorType, string> = {
  ph: "hsl(var(--chart-1))",
  temperature: "hsl(var(--chart-2))",
  turbidity: "hsl(var(--chart-3))",
};

const SENSOR_META: Record<SensorType, { label: string; unit: string; icon: React.ElementType; borderColor: string }> = {
  ph: { label: "pH", unit: "pH", icon: FlaskConical, borderColor: "border-t-chart-1" },
  temperature: { label: "Temperatura", unit: "°C", icon: Thermometer, borderColor: "border-t-chart-2" },
  turbidity: { label: "Turbidez", unit: "NTU", icon: Droplets, borderColor: "border-t-chart-3" },
};

interface SensorChartProps {
  type: SensorType;
}

export function SensorChart({ type }: SensorChartProps) {
  const [minutes, setMinutes] = useState(60);
  const { series, count, isLoading, isError } = useSensorRange(type, minutes);
  const meta = SENSOR_META[type];
  const Icon = meta.icon;

  const chartData = series.map((p) => ({
    time: new Date(p.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    value: p.value,
  }));

  return (
    <Card className={`bg-mango-slate border-border/20 border-t-2 ${meta.borderColor} text-secondary-foreground transition-all duration-300 hover:shadow-lg`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted" />
          <h3 className="text-sm font-semibold">{meta.label}</h3>
          {!isLoading && !isError && count > 0 && (
            <span className="text-[10px] text-muted bg-mango-deep/60 px-1.5 py-0.5 rounded-full">
              {count} pts
            </span>
          )}
        </div>
        <div className="flex gap-0.5 bg-mango-deep/50 rounded-lg p-0.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.minutes}
              onClick={() => setMinutes(opt.minutes)}
              className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all ${
                minutes === opt.minutes
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted hover:text-secondary-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <CardContent className="px-5 pb-4 pt-0">
        {isLoading && <Skeleton className="h-[220px] w-full bg-mango-deep/50 rounded-lg" />}

        {isError && (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted">
            Error al cargar datos
          </div>
        )}

        {!isLoading && !isError && count === 0 && (
          <div className="h-[220px] flex flex-col items-center justify-center text-muted gap-3">
            <div className="p-4 rounded-2xl bg-mango-deep/40">
              <Icon className="h-10 w-10 opacity-20" />
            </div>
            <p className="text-sm">Sin datos en este periodo</p>
          </div>
        )}

        {!isLoading && !isError && count > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[type]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_COLORS[type]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.15} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted))" }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--mango-dark))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  fontSize: 12,
                  color: "hsl(var(--secondary-foreground))",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "hsl(var(--muted))", marginBottom: 4 }}
                formatter={(value: number) => [`${value.toFixed(2)} ${meta.unit}`, meta.label]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS[type]}
                strokeWidth={2}
                fill={`url(#grad-${type})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--mango-dark))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
