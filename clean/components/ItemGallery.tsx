"use client";

import { useState } from "react";

export function ItemGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];
  return (
    <div className="gallery">
      <div className="gallery-main">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={title} />
        ) : (
          <span className="inv-noimg">Photograph to follow</span>
        )}
      </div>
      {images.length > 1 ? (
        <div className="gallery-thumbs" role="tablist" aria-label="Photographs">
          {images.map((u, i) => (
            <button
              key={u}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              aria-label={`Photograph ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
