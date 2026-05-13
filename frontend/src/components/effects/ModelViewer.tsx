import { FC, Suspense, useRef, useLayoutEffect, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree, invalidate } from '@react-three/fiber';
import { OrbitControls, useGLTF, useProgress, Html, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const isMeshObject = (object: THREE.Object3D): object is THREE.Mesh =>
  'isMesh' in object && object.isMesh === true;

export interface ModelViewerProps {
  url: string;
  width?: number | string;
  height?: number | string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  enableHoverRotation?: boolean;
  environmentPreset?: 'city' | 'sunset' | 'night' | 'dawn' | 'studio' | 'apartment' | 'forest' | 'park' | 'none';
  /** Plain-text description used for screen readers and the no-WebGL fallback. */
  description?: string;
  /** Visible name for the model (used in fallback heading). */
  name?: string;
}

const HOVER_MAG = (6 * Math.PI) / 180;
const HOVER_EASE = 0.15;

const Loader: FC = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-white/60 text-sm font-mono">{Math.round(progress)}%</div>
    </Html>
  );
};

const ModelInner: FC<{
  url: string;
  autoRotate: boolean;
  autoRotateSpeed: number;
  enableHoverRotation: boolean;
  kbRot: React.MutableRefObject<{ x: number; y: number }>;
  kbZoom: React.MutableRefObject<number>;
}> = ({ url, autoRotate, autoRotateSpeed, enableHoverRotation, kbRot, kbZoom }) => {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const { camera, gl } = useThree();

  const tHov = useRef({ x: 0, y: 0 });
  const cHov = useRef({ x: 0, y: 0 });

  const content = useMemo(() => {
    try {
      return useGLTF(url).scene.clone();
    } catch {
      return null;
    }
  }, [url]);

  useLayoutEffect(() => {
    if (!content) return;
    const g = inner.current;
    g.updateWorldMatrix(true, true);

    const sphere = new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere());
    const s = 1 / (sphere.radius * 2);
    g.position.set(-sphere.center.x, -sphere.center.y, -sphere.center.z);
    g.scale.setScalar(s);

    g.traverse((o: THREE.Object3D) => {
      if (isMeshObject(o)) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera;
      const fitR = sphere.radius * s;
      const d = (fitR * 1.2) / Math.sin((persp.fov * Math.PI) / 180 / 2);
      persp.position.set(0, 0, d);
      persp.near = d / 10;
      persp.far = d * 10;
      persp.updateProjectionMatrix();
      // Remember base distance so keyboard zoom can multiply it.
      (persp as any).userData.baseDistance = d;
    }
  }, [content, camera]);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const mm = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      if (enableHoverRotation) tHov.current = { x: ny * HOVER_MAG, y: nx * HOVER_MAG };
      invalidate();
    };

    window.addEventListener('pointermove', mm);
    return () => window.removeEventListener('pointermove', mm);
  }, [enableHoverRotation]);

  useFrame((_, dt) => {
    if (!outer.current) return;
    let need = false;

    const phx = cHov.current.x;
    const phy = cHov.current.y;
    cHov.current.x += (tHov.current.x - cHov.current.x) * HOVER_EASE;
    cHov.current.y += (tHov.current.y - cHov.current.y) * HOVER_EASE;

    outer.current.rotation.x += cHov.current.x - phx;
    outer.current.rotation.y += cHov.current.y - phy;

    if (autoRotate) {
      outer.current.rotation.y += autoRotateSpeed * dt;
      need = true;
    }

    // Keyboard rotation
    if (kbRot.current.x !== 0 || kbRot.current.y !== 0) {
      outer.current.rotation.x += kbRot.current.x * dt;
      outer.current.rotation.y += kbRot.current.y * dt;
      need = true;
    }

    // Keyboard zoom (camera distance)
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera;
      const base = (persp as any).userData.baseDistance ?? persp.position.length();
      const desired = base / Math.max(0.4, Math.min(4, kbZoom.current));
      const cur = persp.position.length();
      if (Math.abs(cur - desired) > 1e-3) {
        persp.position.setLength(cur + (desired - cur) * 0.18);
        persp.updateProjectionMatrix();
        need = true;
      }
    }

    if (
      Math.abs(cHov.current.x - tHov.current.x) > 1e-4 ||
      Math.abs(cHov.current.y - tHov.current.y) > 1e-4
    ) need = true;

    if (need) invalidate();
  });

  if (!content) return null;

  return (
    <group ref={outer}>
      <group ref={inner}>
        <primitive object={content} />
      </group>
    </group>
  );
};

function detectWebGL(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

const NoWebGLFallback: FC<{ name?: string; description?: string; url: string }> = ({ name, description, url }) => (
  <div
    role="img"
    aria-label={`Modelo 3D ${name ?? ''}: ${description ?? 'Tu navegador no soporta WebGL.'}`}
    className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-white/[0.02] border border-white/10 rounded-md"
  >
    <div className="text-white/70 text-sm font-medium">{name ?? 'Modelo 3D'}</div>
    <p className="text-xs text-white/60 max-w-md">
      {description ?? 'Vista 3D no disponible: tu navegador no admite WebGL o está deshabilitado.'}
    </p>
    <a
      href={url}
      download
      className="text-xs text-accent underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
    >
      Descargar modelo
    </a>
  </div>
);

const ModelViewer: FC<ModelViewerProps> = ({
  url,
  width = '100%',
  height = '100%',
  autoRotate = true,
  autoRotateSpeed = 0.35,
  enableHoverRotation = true,
  environmentPreset = 'forest',
  description,
  name,
}) => {
  const contactRef = useRef<any>(null);
  const [webgl] = useState<boolean>(() => detectWebGL());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const kbRot = useRef({ x: 0, y: 0 });
  const kbZoom = useRef(1);

  useEffect(() => {
    if (!webgl) return;
    const el = wrapperRef.current;
    if (!el) return;
    const ROT_SPEED = 1.6; // rad/s while key held
    const onKey = (e: KeyboardEvent) => {
      let handled = true;
      switch (e.key) {
        case 'ArrowLeft':  kbRot.current.y = -ROT_SPEED; break;
        case 'ArrowRight': kbRot.current.y = ROT_SPEED; break;
        case 'ArrowUp':    kbRot.current.x = -ROT_SPEED; break;
        case 'ArrowDown':  kbRot.current.x = ROT_SPEED; break;
        case '+': case '=': kbZoom.current = Math.min(4, kbZoom.current + 0.2); break;
        case '-': case '_': kbZoom.current = Math.max(0.4, kbZoom.current - 0.2); break;
        case '0': kbZoom.current = 1; kbRot.current = { x: 0, y: 0 }; break;
        default: handled = false;
      }
      if (handled) { e.preventDefault(); invalidate(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) kbRot.current.y = 0;
      if (['ArrowUp', 'ArrowDown'].includes(e.key)) kbRot.current.x = 0;
    };
    el.addEventListener('keydown', onKey);
    el.addEventListener('keyup', onKeyUp);
    return () => {
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('keyup', onKeyUp);
    };
  }, [webgl]);

  if (!webgl) {
    return (
      <div style={{ width, height }}>
        <NoWebGLFallback name={name} description={description} url={url} />
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-label={`Visor 3D ${name ?? ''}. Use flechas para rotar, más y menos para acercar, 0 para reiniciar.`}
      style={{ width, height, position: 'relative', outline: 'none' }}
      className="focus-visible:ring-2 focus-visible:ring-accent rounded-md"
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={(canvas) => {
          const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
          });
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          return renderer;
        }}
        camera={{ fov: 50, position: [0, 0, 3], near: 0.01, far: 100 }}
        style={{ touchAction: 'pan-y pinch-zoom' }}
      >
        {environmentPreset !== 'none' && <Environment preset={environmentPreset as any} background={false} />}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, 2, 5]} intensity={0.6} />
        <ContactShadows ref={contactRef as any} position={[0, -0.5, 0]} opacity={0.35} scale={10} blur={2} />

        <Suspense fallback={<Loader />}>
          <ModelInner
            url={url}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            enableHoverRotation={enableHoverRotation}
            kbRot={kbRot}
            kbZoom={kbZoom}
          />
        </Suspense>

        <OrbitControls enablePan={false} enableRotate={false} enableZoom={false} />
      </Canvas>
      <p className="sr-only">
        {description ?? `Modelo 3D interactivo${name ? `: ${name}` : ''}.`}
      </p>
    </div>
  );
};

export default ModelViewer;
