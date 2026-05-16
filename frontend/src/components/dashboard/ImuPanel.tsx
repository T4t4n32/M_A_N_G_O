import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei";
import * as THREE from "three";
import { Badge } from "@/components/ui/badge";
import { Cpu, WifiOff, AlertCircle, Loader2, Navigation } from "lucide-react";
import type { ImuState, ImuFrame } from "@/types/dashboard";

// ── 3D sensor body ─────────────────────────────────────────────────────────
function SensorBody({ spinning }: { spinning: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const ringRef  = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (spinning) {
      groupRef.current.rotation.y += delta * 0.6;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.18;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.1;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshStandardMaterial
          color="#00c9a7"
          roughness={0.25}
          metalness={0.75}
          emissive="#003322"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial color="#38bdf8" wireframe opacity={0.12} transparent />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.025, 8, 80]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      {([
        { dir: [1, 0, 0] as [number,number,number], color: "#f87171" },
        { dir: [0, 1, 0] as [number,number,number], color: "#4ade80" },
        { dir: [0, 0, 1] as [number,number,number], color: "#60a5fa" },
      ]).map(({ dir, color }, i) => (
        <mesh key={i} position={[dir[0] * 1.45, dir[1] * 1.45, dir[2] * 1.45]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Bno080Scene({ frame }: { frame?: ImuFrame }) {
  const spinning = !frame;
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.8, 3.5]} fov={42} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.6}
      />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow />
      <directionalLight position={[-3, -2, -4]} intensity={0.4} color="#38bdf8" />
      <pointLight position={[0, 2, 0]} intensity={0.6} color="#00c9a7" distance={6} />
      <Grid
        position={[0, -1.6, 0]}
        args={[8, 8]}
        cellSize={0.5}
        cellThickness={0.4}
        cellColor="#1e3a4a"
        sectionSize={2}
        sectionThickness={0.8}
        sectionColor="#0e4d5c"
        fadeDistance={6}
        fadeStrength={1.5}
        infiniteGrid={false}
      />
      <SensorBody spinning={spinning} />
    </>
  );
}

function StateBadge({ state }: { state: ImuState }) {
  const map: Record<ImuState, { label: string; cls: string }> = {
    not_configured: { label: "Sin configurar", cls: "border-white/20 text-white/40 bg-white/5" },
    disconnected:   { label: "Desconectado",   cls: "border-red-500/40 text-red-400 bg-red-500/10" },
    loading:        { label: "Conectando…",    cls: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
    active:         { label: "En vivo",        cls: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" },
    error:          { label: "Error",          cls: "border-red-500/40 text-red-400 bg-red-500/10" },
  };
  const { label, cls } = map[state] ?? map.not_configured;
  return (
    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${cls}`}>
      {state === "active" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1" />
      )}
      {label}
    </Badge>
  );
}

interface ImuPanelProps {
  state: ImuState;
  frame?: ImuFrame;
}

export function ImuPanel({ state, frame }: ImuPanelProps) {
  const hasData = state === "active" && frame;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[hsl(205,35%,10%)] overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-[hsl(168,72%,42%)]" />
          <span className="text-sm font-semibold text-white/80">BNO080</span>
          <span className="text-xs text-white/30 hidden sm:inline">— IMU / Orientación 3D</span>
        </div>
        <StateBadge state={state} />
      </div>

      <div className="relative flex-1 min-h-[200px]">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          </div>
        }>
          <Canvas shadows style={{ background: "transparent" }}>
            <Bno080Scene frame={frame} />
          </Canvas>
        </Suspense>

        {state !== "active" && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
              {state === "not_configured" && <Navigation className="h-3.5 w-3.5 text-white/30" />}
              {state === "disconnected"   && <WifiOff    className="h-3.5 w-3.5 text-red-400/70" />}
              {state === "error"          && <AlertCircle className="h-3.5 w-3.5 text-red-400/70" />}
              {state === "loading"        && <Loader2    className="h-3.5 w-3.5 text-yellow-400/70 animate-spin" />}
              <span className="text-[11px] text-white/40">
                {state === "not_configured" && "Conecta el BNO080 para datos en vivo"}
                {state === "disconnected"   && "Dispositivo no detectado"}
                {state === "loading"        && "Inicializando sensor…"}
                {state === "error"          && "Error al leer el sensor"}
              </span>
            </div>
          </div>
        )}
      </div>

      {hasData ? (
        <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06]">
          {[
            { label: "Yaw",   value: frame.yaw },
            { label: "Pitch", value: frame.pitch },
            { label: "Roll",  value: frame.roll },
          ].map(({ label, value }) => (
            <div key={label} className="py-2 text-center">
              <p className="text-[10px] text-white/30 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-mono text-[hsl(168,72%,55%)] font-semibold">
                {value?.toFixed(1)}°
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-2 border-t border-white/[0.04]">
          <p className="text-[10px] text-white/25 text-center">
            Arrastra el modelo para explorar · datos en vivo cuando el sensor esté conectado
          </p>
        </div>
      )}
    </div>
  );
}
