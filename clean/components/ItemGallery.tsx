"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, GemOutline } from "@/components/shop/Icons";

/**
 * Photograph stage for a piece. Arrow keys step through the set while any
 * control inside has focus, click magnifies the current frame, and the
 * pointer steers the zoom so a setting can be read at the edge of a stone.
 */
export function ItemGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const current = images[active] ?? images[0];
  const many = images.length > 1;

  const step = useCallback(
    (delta: number) => {
      if (images.length < 2) return;
      setZoom(false);
      setActive((i) => (i + delta + images.length) % images.length);
    },
    [images.length],
  );

  return (
    <div
      className="gallery"
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          step(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          step(1);
        }
      }}
    >
      <div className={`gallery-main${zoom ? " is-zoom" : ""}`}>
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt={title} style={zoom ? { transformOrigin: origin } : undefined} />
            <button
              type="button"
              className="gallery-zoom"
              aria-pressed={zoom}
              aria-label={zoom ? "Zoom out" : "Zoom in on the photograph"}
              onClick={() => setZoom((z) => !z)}
              onMouseMove={(e) => {
                if (!zoom) return;
                const r = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) * 100;
                const y = ((e.clientY - r.top) / r.height) * 100;
                setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
              }}
            />
          </>
        ) : (
          <span className="inv-noimg">
            <GemOutline />
            Photograph to follow
          </span>
        )}
        {many ? (
          <>
            <button type="button" className="gallery-step prev" onClick={() => step(-1)} aria-label="Previous photograph">
              <ChevronLeft />
            </button>
            <button type="button" className="gallery-step next" onClick={() => step(1)} aria-label="Next photograph">
              <ChevronRight />
            </button>
            <span className="gallery-counter" aria-hidden="true">
              {active + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {many ? (
        <>
          <div className="gallery-thumbs" role="tablist" aria-label="Photographs">
            {images.map((u, i) => (
              <button
                key={u}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => {
                  setZoom(false);
                  setActive(i);
                }}
                aria-label={`Photograph ${i + 1} of ${images.length}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" />
              </button>
            ))}
          </div>
          <p className="gallery-hint">Arrow keys step · click to magnify</p>
        </>
      ) : current ? (
        <p className="gallery-hint">Click to magnify</p>
      ) : null}
    </div>
  );
}
