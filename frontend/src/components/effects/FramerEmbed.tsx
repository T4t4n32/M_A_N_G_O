import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface FramerEmbedProps {
  /** Full URL of the published Framer code component (e.g. https://framer.com/m/Name-Prod-xxxx.js@hash) */
  moduleUrl: string;
  /** Props forwarded to the Framer component's default export */
  componentProps?: Record<string, unknown>;
  className?: string;
  style?: CSSProperties;
  /** Rendered instead if the component fails to load (network error, framer.com down, etc.) */
  fallback?: ReactNode;
}

/**
 * Mounts a Framer.com published "code component" inside this app.
 *
 * These components are plain ESM modules, but they're built against Framer's
 * own runtime: a bare `import ... from "framer"` for addPropertyControls/
 * RenderTarget/etc (shimmed locally — see public/framer-shim.js and the
 * import map in index.html) plus bare `react`/`react-dom`/`framer-motion`
 * imports that only resolve via that same import map, to an isolated CDN
 * copy of React — not the app's bundled one. So the component is mounted
 * into its own React root inside the container div, fully decoupled from
 * the surrounding tree (no context/hooks are shared across the boundary,
 * which is safe and standard for embedding independent widgets).
 *
 * Never bundled by Vite: the module URL is fetched by the browser at
 * runtime, so a framer.com/CDN outage only affects this one embed — it
 * fails soft into `fallback` instead of breaking the page.
 */
export function FramerEmbed({ moduleUrl, componentProps = {}, className, style, fallback = null }: FramerEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const propsKey = JSON.stringify(componentProps);

  useEffect(() => {
    let cancelled = false;
    let root: { unmount: () => void } | null = null;

    async function mount() {
      try {
        const [mod, ReactMod, ReactDOMClient] = await Promise.all([
          import(/* @vite-ignore */ moduleUrl),
          import(/* @vite-ignore */ "react"),
          import(/* @vite-ignore */ "react-dom/client"),
        ]);
        if (cancelled || !containerRef.current) return;

        const Component = mod.default;
        if (!Component) throw new Error(`Framer module has no default export: ${moduleUrl}`);

        root = ReactDOMClient.createRoot(containerRef.current);
        root.render(ReactMod.createElement(Component, JSON.parse(propsKey)));
      } catch (err) {
        if (!cancelled) {
          console.warn(`[FramerEmbed] Failed to load "${moduleUrl}" — falling back.`, err);
          setFailed(true);
        }
      }
    }
    void mount();

    return () => {
      cancelled = true;
      root?.unmount();
    };
  }, [moduleUrl, propsKey]);

  if (failed) return <>{fallback}</>;

  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%", ...style }} />;
}
