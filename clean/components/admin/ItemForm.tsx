"use client";

import { useState } from "react";
import {
  CATEGORIES,
  CONDITIONS,
  STATUSES,
  VISIBILITIES,
  type InventoryItem,
} from "@/lib/inventory/types";

/**
 * Item editor. The form itself posts natively to /api/admin/items; only image
 * uploads use fetch so the admin sees a preview before saving.
 */
export function ItemForm({ csrf, item }: { csrf: string; item?: InventoryItem }) {
  const [images, setImages] = useState<string[]>(item?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("csrf", csrf);
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = (await res.json()) as { ok: boolean; url?: string; message?: string };
        if (data.ok && data.url) setImages((prev) => [...prev, data.url!].slice(0, 12));
        else setUploadError(data.message ?? "Upload failed.");
      } catch {
        setUploadError("Upload failed.");
      }
    }
    setUploading(false);
  }

  function addUrl() {
    const u = urlInput.trim();
    if (/^https:\/\/\S+$/i.test(u)) {
      setImages((prev) => [...prev, u].slice(0, 12));
      setUrlInput("");
    }
  }

  return (
    <form className="form admin-form" action="/api/admin/items" method="post">
      <input type="hidden" name="csrf" value={csrf} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      {images.map((u) => (
        <input key={u} type="hidden" name="images" value={u} />
      ))}

      <div className="admin-grid">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" required maxLength={140} defaultValue={item?.title ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="sku">SKU / reference</label>
          <input id="sku" name="sku" maxLength={60} defaultValue={item?.sku ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={item?.category ?? "ring"}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="condition">Condition</label>
          <select id="condition" name="condition" defaultValue={item?.condition ?? "pre-owned"}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={item?.status ?? "available"}>
            {STATUSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="visibility">Visibility</label>
          <select id="visibility" name="visibility" defaultValue={item?.visibility ?? "private"}>
            {VISIBILITIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="metal">Metal</label>
          <input id="metal" name="metal" maxLength={80} defaultValue={item?.metal ?? ""} placeholder="e.g. 18k yellow gold, as stamped" />
        </div>
        <div className="field">
          <label htmlFor="stones">Stones</label>
          <input id="stones" name="stones" maxLength={200} defaultValue={item?.stones ?? ""} placeholder="e.g. 1.02 ct sapphire, measured" />
        </div>
        <div className="field">
          <label htmlFor="size">Size / dimensions</label>
          <input id="size" name="size" maxLength={60} defaultValue={item?.size ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="price">Price (blank = price on request)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id="price" name="price" inputMode="decimal" defaultValue={item?.price ?? ""} style={{ flex: 1 }} />
            <select name="currency" defaultValue={item?.currency ?? "CAD"} aria-label="Currency" style={{ width: 100 }}>
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" maxLength={4000} defaultValue={item?.description ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="disclosure">Disclosure (treatment, origin, report, authenticity, condition notes)</label>
        <textarea
          id="disclosure"
          name="disclosure"
          maxLength={2000}
          defaultValue={item?.disclosure ?? ""}
          style={{ minHeight: 100 }}
        />
      </div>

      <fieldset className="field admin-images">
        <legend>Images</legend>
        <div className="admin-thumbs">
          {images.map((u) => (
            <figure key={u}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" />
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setImages((p) => p.filter((x) => x !== u))}>
                Remove
              </button>
            </figure>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label className="btn btn-ghost btn-small" style={{ cursor: "pointer" }}>
            {uploading ? "Uploading…" : "Upload images"}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => onUpload(e.target.files)} />
          </label>
          <input
            type="url"
            placeholder="or paste an https image URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
            aria-label="Image URL"
          />
          <button type="button" className="btn btn-ghost btn-small" onClick={addUrl}>
            Add URL
          </button>
        </div>
        {uploadError ? <span className="error">{uploadError}</span> : null}
      </fieldset>

      {item?.source === "ebay" ? (
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Imported from eBay (item {item.ebayItemId}). Title, price, images and status are refreshed on
          each import; category, metal, stones, description, disclosure and visibility are kept.
        </p>
      ) : null}

      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn btn-primary" type="submit" disabled={uploading}>
          {item ? "Save changes" : "Add item"}
        </button>
      </div>
    </form>
  );
}
