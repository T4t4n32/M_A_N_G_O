import { FC, Suspense, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
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
}> = ({ url, autoRotate, autoRotateSpeed, enableHoverRotation }) => {
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

const ModelViewer: FC<ModelViewerProps> = ({
  url,
  width = '100%',
  height = '100%',
  autoRotate = true,
  autoRotateSpeed = 0.35,
  enableHoverRotation = true,
  environmentPreset = 'forest',
}) => {
  const contactRef = useRef<any>(null);

  return (
    <div style={{ width, height, position: 'relative' }}>
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
          />
        </Suspense>

        <OrbitControls enablePan={false} enableRotate={false} enableZoom={false} />
      </Canvas>
    </div>
  );
};

export default ModelViewer;
