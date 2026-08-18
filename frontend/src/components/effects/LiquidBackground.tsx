import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';
import './LiquidBackground.css';

interface LiquidBackgroundProps {
  speed?: number;
  scale?: number;
  distortion?: number;
  swirl?: number;
  rotation?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  color3?: string;
}

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255
  ];
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

// Domain-warped fractal noise ("liquid" look) — same family of technique as the
// Framer AnimatedLiquidBackground shader (warp a fractal-noise field through
// itself), implemented natively so the effect has no runtime dependency on
// framer.com / framerusercontent.com.
const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uDistortion;
uniform float uSwirl;
uniform float uRotation;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 coords = (uv * 2.0 - 1.0) * vec2(uResolution.z, 1.0);
  coords = rotate2D(coords, uRotation);
  coords *= uScale;

  float t = uTime * uSpeed;

  vec2 q = vec2(
    fbm(coords + t * 0.15),
    fbm(coords + vec2(5.2, 1.3) + t * 0.12)
  );
  vec2 r = vec2(
    fbm(coords + uSwirl * q + vec2(1.7, 9.2) + t * 0.1),
    fbm(coords + uSwirl * q + vec2(8.3, 2.8) - t * 0.13)
  );
  float pattern = fbm(coords + uDistortion * r);

  vec3 col = mix(uColor1, uColor2, smoothstep(0.2, 0.65, pattern));
  col = mix(col, uColor3, smoothstep(0.45, 0.9, length(r) * 0.6));
  col *= uBrightness;

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function LiquidBackground({
  speed = 0.15,
  scale = 1.4,
  distortion = 3.0,
  swirl = 2.5,
  rotation = 0,
  brightness = 1.0,
  color1 = '#00e5bf',
  color2 = '#0891b2',
  color3 = '#2563eb'
}: LiquidBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const renderer = new Renderer({ alpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);
    renderer.setSize(container.offsetWidth, container.offsetHeight);

    const geometry = new Triangle(gl);
    const rotationRad = (rotation * Math.PI) / 180;
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height] },
        uSpeed: { value: speed },
        uScale: { value: scale },
        uDistortion: { value: distortion },
        uSwirl: { value: swirl },
        uRotation: { value: rotationRad },
        uBrightness: { value: brightness },
        uColor1: { value: hexToVec3(color1) },
        uColor2: { value: hexToVec3(color2) },
        uColor3: { value: hexToVec3(color3) }
      }
    });

    function resize() {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height];
    }
    window.addEventListener('resize', resize);

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    let animationFrameId: number;

    function update(time: number) {
      animationFrameId = requestAnimationFrame(update);
      program.uniforms.uTime.value = time * 0.001;
      renderer.render({ scene: mesh });
    }
    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [speed, scale, distortion, swirl, rotation, brightness, color1, color2, color3]);

  return <div ref={containerRef} className="liquid-background-container" />;
}
