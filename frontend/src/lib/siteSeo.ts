/**
 * Reactive SEO meta-tag injector. Keeps `<head>` in sync with the
 * `seo.*` fields managed by the Panel Emma Textos editor.
 *
 * Tags created by this hook carry the `data-managed-seo` attribute so
 * they can be updated idempotently and will not collide with the
 * default tags shipped in `index.html`.
 */

import { useEffect } from "react";
import { useSiteValue } from "./siteContent";
import { parseValue, useResolvedSrc, MediaDescriptor } from "./siteMedia";

const ATTR = "data-managed-seo";

function ensureTag(name: string, tagName: "meta" | "link"): HTMLElement {
  let el = document.head.querySelector<HTMLElement>(`[${ATTR}="${name}"]`);
  if (!el) {
    el = document.createElement(tagName);
    el.setAttribute(ATTR, name);
    document.head.appendChild(el);
  }
  return el;
}

function setManagedMeta(key: string, attrs: Record<string, string>) {
  const el = ensureTag(key, key === "canonical" ? "link" : "meta");
  for (const [k, v] of Object.entries(attrs)) {
    if (v) el.setAttribute(k, v);
    else el.removeAttribute(k);
  }
}

function asImageDescriptor(raw: string): MediaDescriptor | null {
  const v = parseValue(raw);
  if (!v || Array.isArray(v)) return null;
  return v;
}

export function useSiteSeo() {
  const title = useSiteValue("seo.title", "M.A.N.G.O — Monitoreo Ambiental de Manglares");
  const desc = useSiteValue(
    "seo.description",
    "Sistema autónomo de monitoreo ambiental en tiempo real para la protección de ecosistemas de manglar. Sensores de pH, temperatura y turbidez.",
  );
  const canonical = useSiteValue("seo.canonical", "https://mango-project.org");
  const robots = useSiteValue("seo.robots", "index, follow");
  const ogTitle = useSiteValue("seo.og.title", title);
  const ogDesc = useSiteValue("seo.og.description", desc);
  const ogImageRaw = useSiteValue("seo.og.image", "");
  const twCard = useSiteValue("seo.twitter.card", "summary_large_image");
  const twImageRaw = useSiteValue("seo.twitter.image", "");

  const ogImageDesc = asImageDescriptor(ogImageRaw);
  const twImageDesc = asImageDescriptor(twImageRaw);
  const ogImageUrl = useResolvedSrc(ogImageDesc) || "";
  const twImageUrl = useResolvedSrc(twImageDesc) || ogImageUrl;

  useEffect(() => {
    document.title = title;
    setManagedMeta("description", { name: "description", content: desc });
    setManagedMeta("robots", { name: "robots", content: robots });
    setManagedMeta("canonical", { rel: "canonical", href: canonical });
    setManagedMeta("og:title", { property: "og:title", content: ogTitle });
    setManagedMeta("og:description", { property: "og:description", content: ogDesc });
    setManagedMeta("og:url", { property: "og:url", content: canonical });
    setManagedMeta("og:type", { property: "og:type", content: "website" });
    if (ogImageUrl) setManagedMeta("og:image", { property: "og:image", content: ogImageUrl });
    setManagedMeta("twitter:card", { name: "twitter:card", content: twCard });
    setManagedMeta("twitter:title", { name: "twitter:title", content: ogTitle });
    setManagedMeta("twitter:description", { name: "twitter:description", content: ogDesc });
    if (twImageUrl) setManagedMeta("twitter:image", { name: "twitter:image", content: twImageUrl });
  }, [title, desc, canonical, robots, ogTitle, ogDesc, ogImageUrl, twCard, twImageUrl]);
}