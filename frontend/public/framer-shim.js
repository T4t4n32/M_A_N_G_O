// Runtime shim for the bare "framer" import that Framer-published code
// components (e.g. https://framer.com/m/*.js) expect to resolve. Outside an
// actual Framer-hosted site this module doesn't exist anywhere installable —
// the `framer` npm package (see frontend/package.json) ships only
// TypeScript type declarations, no runtime code. This file provides the
// small runtime surface those components actually call at render time, so
// they can run unmodified when dynamically imported into this app.
//
// Referenced by the import map in index.html: "framer" -> "/framer-shim.js".
// Served as-is (not processed by Vite) since it must be loadable by the
// browser's native ES module resolver together with framer.com/
// framerusercontent.com modules, which are also loaded via bare/CDN URLs
// outside Vite's bundle graph.

// addPropertyControls registers a component's Framer-canvas property panel.
// There is no canvas here, so it's a no-op — but it must exist and must not
// throw, since Framer components call it unconditionally at module load.
export function addPropertyControls() {}

// ControlType values are just symbolic tags read by Framer's own canvas UI;
// our addPropertyControls no-op never inspects them, so any distinct string
// per key is sufficient. Covers the standard Framer property control types.
export const ControlType = {
  Boolean: "boolean",
  Number: "number",
  String: "string",
  Enum: "enum",
  Color: "color",
  Image: "image",
  File: "file",
  ComponentInstance: "componentInstance",
  EventHandler: "eventHandler",
  Array: "array",
  Object: "object",
  FusedNumber: "fusedNumber",
  Padding: "padding",
  BoxShadow: "boxShadow",
  Border: "border",
  Transition: "transition",
  Date: "date",
  Link: "link",
  Font: "font",
  RichText: "richText",
  Cursor: "cursor",
  Vector2: "vector2",
  BorderRadius: "borderRadius",
};

// RenderTarget lets a component ask "am I inside the Framer editor canvas?".
// We're always a normal published/embedded render, never the canvas editor,
// so current() must return anything other than RenderTarget.canvas.
export const RenderTarget = {
  canvas: "canvas",
  export: "export",
  preview: "preview",
  thumbnail: "thumbnail",
  current: () => "export",
};

// useIsStaticRenderer distinguishes Framer's static-export prerendering pass
// from a live client render. We only ever render live, so this is always
// false — which is what keeps the component's animations running.
export function useIsStaticRenderer() {
  return false;
}
