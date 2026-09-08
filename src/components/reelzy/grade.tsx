import { filterLayers } from "./creative";

/**
 * Stacked colour passes for a look — rendered over the frame so a filter
 * transforms the whole image the way a LUT would.
 */
export function GradeLayers({ filterId }: { filterId?: string | null }) {
  const layers = filterLayers(filterId);
  if (layers.length === 0) return null;
  return (
    <>
      {layers.map((l, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: l.bg,
            mixBlendMode: l.blend as React.CSSProperties["mixBlendMode"],
            opacity: l.opacity ?? 1,
          }}
        />
      ))}
    </>
  );
}
