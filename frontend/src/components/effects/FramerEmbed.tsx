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

// `import()` on a literal string ("react", "react-dom/client") is still
// statically resolved and bundled by Vite even with /* @vite-ignore */ —
// that comment only silences the warning, it doesn't stop Rollup from
// seeing a literal specifier and inlining the app's own React. That caused
// a real bug: the Framer component's *internal* hooks run against the
// esm.sh React copy (resolved via the browser's import map, since that
// module is genuinely fetched at runtime and never touches Vite's bundler),
// while our own render call used the app's bundled React — two different
// React instances in the same tree, so the CDN copy's hook dispatcher was
// never set and `useState` threw `Cannot read properties of null`.
// Building the import() call inside `new Function` makes it opaque to
// Rollup's static analysis, so it's a genuine runtime dynamic import
// resolved by the browser via the import map — the same React module
// instance the Framer bundle itself imports.
const dynamicImport = new Function("specifier", "return import(specifier)");

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
          dynamicImport(moduleUrl),
          dynamicImport("react"),
          dynamicImport("react-dom/client"),
        ]);
        if (cancelled || !containerRef.current) return;

        const Component = mod.default;
        if (!Component) throw new Error(`Framer module has no default export: ${moduleUrl}`);

        // Built from the isolated React instance itself: an error boundary from
        // *our* bundled React can't catch errors thrown inside this component,
        // since it's driven by a different React copy entirely. Without this,
        // a render error here is only reported to the console (React logs it
        // via its own internal error reporting) and never reaches our try/catch
        // below — the container is left mounted but blank, with no fallback.
        class EmbedErrorBoundary extends ReactMod.Component {
          state = { hasError: false };
          static getDerivedStateFromError() {
            return { hasError: true };
          }
          componentDidCatch(error: unknown) {
            console.warn(`[FramerEmbed] "${moduleUrl}" threw while rendering — falling back.`, error);
            if (!cancelled) setFailed(true);
          }
          render() {
            return this.state.hasError ? null : this.props.children;
          }
        }

        root = ReactDOMClient.createRoot(containerRef.current);
        root.render(
          ReactMod.createElement(
            EmbedErrorBoundary,
            null,
            ReactMod.createElement(Component, JSON.parse(propsKey)),
          ),
        );
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
