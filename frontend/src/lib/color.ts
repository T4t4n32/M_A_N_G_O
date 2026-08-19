/**
 * Injects an alpha channel into a CSS Color 4 space-separated `hsl(...)`
 * string, e.g. `hslAlpha("hsl(270 60% 60%)", 0.2)` -> "hsl(270 60% 60% / 0.2)".
 * Appending a hex alpha suffix (the "#rrggbb" trick) does nothing on `hsl()`
 * function syntax — it's not valid CSS, so it silently drops the whole
 * declaration.
 */
export function hslAlpha(hsl: string, alpha: number): string {
  return hsl.replace(/\)$/, ` / ${alpha})`);
}
