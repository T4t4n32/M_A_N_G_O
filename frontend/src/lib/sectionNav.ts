import type { NavigateFunction } from "react-router-dom";

/**
 * Shared nav handler for Header/Footer links that mix full routes ("/galeria")
 * with in-page anchors ("#proyecto"). An anchor clicked while away from "/"
 * routes to "/" first; useScrollToHash finishes the scroll once Index mounts.
 */
export function navigateToSection(navigate: NavigateFunction, href: string) {
  if (href.startsWith("/")) {
    navigate(href);
    window.scrollTo({ top: 0 });
    return;
  }
  if (window.location.pathname === "/") {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  } else {
    navigate(`/${href}`);
  }
}
