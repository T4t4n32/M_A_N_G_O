import { FC, Suspense, useRef, useLayoutEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ── Inner model: loads GLB, centers it, scales it to unit size ───────────────
const Model: FC<{ url: string }> = ({ url }) => {
  const inner = useRef<THREE.Group>(null!);
  const { camera } = useThree();

  const { scene } = useGLTF(url);
  // Clone so multiple instances don't share the same scene graph
  const model = useMemo(() => scene.clone(true), [scene]);

  useLayoutEffect(() => {
    if (!inner.current) return;
    inner.current.updateWorldMatrix(true, true);

    const sphere = new THREE.Box3()
      .setFromObject(inner.current)
      .getBoundingSphere(new THREE.Sphere());

    // Center and scale to unit diameter
    const s = 1.0 / (sphere.radius * 2);
    inner.current.position.set(
      -sphere.center.x,
      -sphere.center.y,
      -sphere.center.z,
    );
    inner.current.scale.setScalar(s);

    // Pull camera back to fit the normalized model
    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera) {
      const r = sphere.radius * s;
      const d = (r * 1.85) / Math.sin((persp.fov * Math.PI) / 180 / 2);
      persp.position.set(0, 0.05, d);
      persp.near = d / 10;
      persp.far  = d * 10;
      persp.updateProjectionMatrix();
    }

    // No shadows — model floats over transparent background
    model.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).castShadow    = false;
        (obj as THREE.Mesh).receiveShadow = false;
      }
    });
  }, [model, camera]);

  return (
    <group ref={inner}>
      <primitive object={model} />
    </group>
  );
};

// ── Public component ─────────────────────────────────────────────────────────
interface Props {
  url: string;
  /** OrbitControls autoRotateSpeed — default 1.6 (subtle, readable while rotating) */
  speed?: number;
  style?: React.CSSProperties;
  className?: string;
}

const FloatingModel3D: FC<Props> = ({ url, speed = 1.6, style, className }) => (
  <Canvas
    frameloop="always"
    dpr={[1, 1.5]}
    camera={{ fov: 42, position: [0, 0.05, 3], near: 0.01, far: 100 }}
    gl={(canvas) => {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);   // fully transparent background
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      return renderer;
    }}
    style={{ background: 'transparent', touchAction: 'pan-y pinch-zoom', ...style }}
    className={className}
  >
    {/* Lighting tuned for visibility over dark photo backgrounds */}
    <ambientLight intensity={0.9} />
    <directionalLight position={[5, 8, 4]}  intensity={2.0} />
    <directionalLight position={[-3, 1, -5]} intensity={0.4} />
    {/* Teal accent point — ties the model to M.A.N.G.O. brand color */}
    <pointLight position={[0, 1.5, 2.5]} intensity={1.8} color="#00c9a7" distance={14} decay={2} />
    <Environment preset="studio" background={false} />

    {/*
      OrbitControls with autoRotate:
      - model spins automatically at `speed`
      - user can drag to rotate freely; auto-rotate resumes on release
      - zoom and pan disabled so the ambient effect stays clean
    */}
    <OrbitControls
      makeDefault
      enablePan={false}
      enableZoom={false}
      autoRotate
      autoRotateSpeed={speed}
    />

    <Suspense fallback={null}>
      <Model url={url} />
    </Suspense>
  </Canvas>
);

export default FloatingModel3D;
