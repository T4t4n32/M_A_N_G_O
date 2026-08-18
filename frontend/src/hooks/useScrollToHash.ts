import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the element matching the URL hash once it mounts. Needed because
 * Index's sections are lazy-loaded, so the target may not exist yet on the
 * first render pass when arriving via navigateToSection's "/#anchor" redirect.
 */
export function useScrollToHash() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    let attempts = 0;
    let timer: number | undefined;

    const tryScroll = () => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else if (attempts < 20) {
        attempts += 1;
        timer = window.setTimeout(tryScroll, 100);
      }
    };
    tryScroll();

    return () => window.clearTimeout(timer);
  }, [hash]);
}
