import { useEffect, useState } from "react";

export interface CategoryMediaItem {
  type: "image" | "video";
  src: string;
  alt: string;
  subcategory?: string;
}

interface PublicMediaRecord {
  url: string;
  kind: "image" | "video" | "document";
  title: string;
  category: string | null;
  subcategory?: string | null;
}

/**
 * Fetch every image/video tagged with a given Panel Emma category (e.g. a
 * season or milestone id) from /api/v1/public/media. Backs both the FLL/Líder
 * ImmersivePanel galleries and the card-level preview thumbnails, so edits,
 * deletes and re-uploads made in Panel Emma take effect on the site without
 * touching source code.
 */
export function useCategoryMedia(
  category: string,
  enabled = true,
  perPage = 100,
): { media: CategoryMediaItem[]; loading: boolean } {
  const [media, setMedia] = useState<CategoryMediaItem[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || !category) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/public/media?category=${encodeURIComponent(category)}&per_page=${perPage}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { items: PublicMediaRecord[] }) => {
        if (cancelled) return;
        const mapped: CategoryMediaItem[] = data.items
          .filter((it) => it.kind === "image" || it.kind === "video")
          .map((it) => ({
            type: it.kind as "image" | "video",
            src: it.url,
            alt: it.title || "",
            subcategory: it.subcategory ?? undefined,
          }));
        setMedia(mapped);
      })
      .catch(() => {
        // network error — section just shows no media rather than breaking
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [category, enabled, perPage]);

  return { media, loading };
}
