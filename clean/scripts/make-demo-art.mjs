/**
 * Draws the catalogue's demo artwork.
 *
 * Every listing in the demo seed needs a picture, and nothing in the demo seed
 * is a real client piece — so the pictures are drawn here rather than
 * photographed or taken from anyone else. Output is deterministic: run it again
 * and the same SVGs come out, so the committed files under
 * public/demo/catalogue/ can be regenerated and diffed.
 *
 * Usage (from clean/):
 *   node scripts/make-demo-art.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "demo", "catalogue");
const S = 800; // square canvas
const C = S / 2;

// ---------------------------------------------------------------- colour ----

function hex(c) {
  return `#${c.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("")}`;
}
function rgb(h) {
  const n = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
}
function mix(a, b, t) {
  const x = rgb(a);
  const y = rgb(b);
  return hex(x.map((v, i) => v + (y[i] - v) * t));
}
/** Directional light from the upper left, used to shade a facet by its angle. */
function facetShade(pal, angleDeg, spread = 1) {
  const a = ((angleDeg - 215) * Math.PI) / 180;
  const t = (Math.cos(a) + 1) / 2; // 1 facing the light, 0 away from it
  const k = 0.5 + (t - 0.5) * spread;
  return k > 0.5 ? mix(pal.base, pal.light, (k - 0.5) * 2) : mix(pal.dark, pal.base, k * 2);
}

// ------------------------------------------------------------- geometry -----

const rad = (d) => (d * Math.PI) / 180;
const P = (a, r, aspect = 1) => [Math.cos(rad(a)) * r * aspect, Math.sin(rad(a)) * r];
const poly = (pts) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const face = (pts, fill, opacity = 1) =>
  `<polygon points="${poly(pts)}" fill="${fill}"${opacity < 1 ? ` opacity="${opacity}"` : ""}/>`;
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const scalePts = (pts, k) => pts.map(([x, y]) => [x * k, y * k]);

// --------------------------------------------------------------- shells -----

const PALETTES = {
  sapphire: { base: "#2f5fa8", light: "#9cc0ec", dark: "#16305c", bg: ["#eef3fc", "#c9daf1"], ink: "#16305c" },
  ruby: { base: "#a5283c", light: "#e8909e", dark: "#5e0f1c", bg: ["#fbeef1", "#efc9d1"], ink: "#5e0f1c" },
  emeraldStone: { base: "#1f7a52", light: "#83d3ac", dark: "#0d4530", bg: ["#eef9f3", "#c9e7d8"], ink: "#0d4530" },
  garnet: { base: "#7d2432", light: "#c8737f", dark: "#420d17", bg: ["#f9eef0", "#e4c8cd"], ink: "#420d17" },
  amethyst: { base: "#6b3fa0", light: "#bb9ae4", dark: "#3b1f66", bg: ["#f4effc", "#d8c9ee"], ink: "#3b1f66" },
  diamond: { base: "#7d98bd", light: "#f2f7fd", dark: "#3a5478", bg: ["#f9fbff", "#d8e4f4"], ink: "#27406a" },
  champagne: { base: "#b9986b", light: "#f6ecda", dark: "#6f5630", bg: ["#fdf8f0", "#ecdcc3"], ink: "#5c4527" },
  steel: { base: "#8d9bad", light: "#eef2f7", dark: "#465468", bg: ["#f2f5fa", "#d5dde8"], ink: "#33415a" },
  brass: { base: "#b8933f", light: "#f0dfa6", dark: "#6b5218", bg: ["#faf5e8", "#e6d8b4"], ink: "#5a4514" },
  glass: { base: "#b3cbe4", light: "#ffffff", dark: "#5e7c9c", bg: ["#f7fbff", "#d7e6f5"], ink: "#1e4a7a" },
  leatherBlack: { base: "#3a3430", light: "#6d635b", dark: "#1a1614", bg: ["#f4f1ee", "#ddd5cd"], ink: "#2b2622" },
  leatherBrown: { base: "#7a4b28", light: "#c08a58", dark: "#3f2410", bg: ["#faf2ea", "#e5cfb9"], ink: "#4a2c14" },
  leatherTan: { base: "#a8763f", light: "#dcb17a", dark: "#5c3c17", bg: ["#fdf6ec", "#ecd8bd"], ink: "#5c3c17" },
  rubber: { base: "#31424f", light: "#6f8494", dark: "#141d25", bg: ["#eef2f5", "#cdd7de"], ink: "#1d2a33" },
};

function shell(id, pal, subject, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="0.65" y2="1">
      <stop offset="0" stop-color="${pal.bg[0]}"/>
      <stop offset="1" stop-color="${pal.bg[1]}"/>
    </linearGradient>
    <radialGradient id="pool-${id}" cx="0.38" cy="0.32" r="0.72">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="shadow-${id}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${pal.ink}" stop-opacity="0.34"/>
      <stop offset="1" stop-color="${pal.ink}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="weave-${id}" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
      <line x1="0" y1="0" x2="0" y2="26" stroke="${pal.ink}" stroke-opacity="0.045" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg-${id})"/>
  <rect width="${S}" height="${S}" fill="url(#weave-${id})"/>
  <rect width="${S}" height="${S}" fill="url(#pool-${id})"/>
  <rect x="28" y="28" width="${S - 56}" height="${S - 56}" rx="18" fill="none" stroke="${pal.ink}" stroke-opacity="0.16"/>
  <ellipse cx="${C}" cy="${C + 205}" rx="230" ry="46" fill="url(#shadow-${id})"/>
  <g transform="translate(${C} ${C - 10})">
${subject}
  </g>
  <g transform="translate(${S - 62} ${S - 54})">
    <rect x="-86" y="-20" width="86" height="34" rx="17" fill="${pal.ink}" fill-opacity="0.1"/>
    <text x="-43" y="3" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="15" letter-spacing="2.4" fill="${pal.ink}" fill-opacity="0.72">DEMO</text>
  </g>
</svg>
`;
}

// ------------------------------------------------------- cut-stone tops -----

/**
 * Top view of a brilliant cut: table octagon, star facets, kite facets and a
 * ring of upper-girdle facets, shaded from one light source.
 */
function brilliantTop({ R = 240, aspect = 1, pal, table = 0.44, star = 0.74 }) {
  const out = [];
  const g = (a) => P(a, R, aspect);
  const T = (a) => P(a, R * table, aspect);
  const M = (a) => P(a, R * star, aspect);

  out.push(`<ellipse cx="0" cy="0" rx="${(R * aspect).toFixed(1)}" ry="${R}" fill="${pal.dark}" opacity="0.5"/>`);

  for (let k = 0; k < 8; k++) {
    const a = k * 45;
    // kite / bezel facet: table vertex out to the girdle
    out.push(face([T(a + 22.5), M(a), g(a + 22.5), M(a + 45)], facetShade(pal, a + 22.5, 1.05)));
    // star facet between two table vertices
    out.push(face([T(a + 22.5), T(a + 67.5), M(a + 45)], facetShade(pal, a + 45, 0.72)));
    // upper girdle pair
    out.push(face([M(a), g(a - 22.5), g(a + 22.5)], facetShade(pal, a, 1.25)));
  }

  const tab = [];
  for (let k = 0; k < 8; k++) tab.push(T(k * 45 + 22.5));
  out.push(face(tab, mix(pal.base, pal.light, 0.86)));
  for (let k = 0; k < 8; k++) {
    // a faint suggestion of the pavilion showing through the table
    out.push(
      `<line x1="0" y1="0" x2="${tab[k][0].toFixed(1)}" y2="${tab[k][1].toFixed(1)}" stroke="${pal.dark}" stroke-opacity="0.13" stroke-width="2"/>`,
    );
  }
  out.push(`<polygon points="${poly(tab)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.35" stroke-width="2"/>`);
  out.push(
    `<ellipse cx="0" cy="0" rx="${(R * aspect).toFixed(1)}" ry="${R}" fill="none" stroke="${pal.dark}" stroke-opacity="0.55" stroke-width="3"/>`,
  );
  out.push(
    `<ellipse cx="${(-R * aspect * 0.3).toFixed(1)}" cy="${-R * 0.42}" rx="${(R * aspect * 0.2).toFixed(1)}" ry="${(R * 0.12).toFixed(1)}" fill="#ffffff" opacity="0.55" transform="rotate(-28)"/>`,
  );
  return out.join("\n");
}

/** Step cut (emerald, asscher): concentric outlines with cut corners. */
function stepTop({ w = 200, h = 270, corner = 56, pal, rings = 3 }) {
  const base = [
    [-w + corner, -h],
    [w - corner, -h],
    [w, -h + corner],
    [w, h - corner],
    [w - corner, h],
    [-w + corner, h],
    [-w, h - corner],
    [-w, -h + corner],
  ];
  const out = [face(base, pal.dark)];
  for (let r = 0; r <= rings; r++) {
    const k = 1 - (r * 0.62) / rings;
    const pts = scalePts(base, k);
    const shadeAngle = 200 + r * 14;
    out.push(face(pts, facetShade(pal, shadeAngle, 0.5 + r * 0.16)));
    out.push(`<polygon points="${poly(pts)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.4" stroke-width="2"/>`);
  }
  const tab = scalePts(base, 1 - 0.62);
  out.push(face(tab, mix(pal.base, pal.light, 0.84)));
  out.push(`<polygon points="${poly(tab)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="2"/>`);
  out.push(
    `<polygon points="${poly([
      [-w * 0.52, -h * 0.5],
      [-w * 0.1, -h * 0.66],
      [-w * 0.2, -h * 0.4],
      [-w * 0.58, -h * 0.28],
    ])}" fill="#ffffff" opacity="0.5"/>`,
  );
  return out.join("\n");
}

/** Princess cut: square outline with the cross of pavilion facets showing. */
function princessTop({ a = 215, pal }) {
  const sq = [
    [-a, -a],
    [a, -a],
    [a, a],
    [-a, a],
  ];
  const out = [face(sq, pal.dark)];
  const rings = [0.98, 0.74, 0.5];
  rings.forEach((k, i) => {
    out.push(face(scalePts(sq, k), facetShade(pal, 200 + i * 30, 0.6 + i * 0.2)));
  });
  const inner = scalePts(sq, 0.5);
  out.push(face(inner, mix(pal.base, pal.light, 0.84)));
  const corners = scalePts(sq, 0.98);
  for (let i = 0; i < 4; i++) {
    out.push(
      `<line x1="${corners[i][0]}" y1="${corners[i][1]}" x2="${inner[i][0]}" y2="${inner[i][1]}" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="2"/>`,
    );
    const m1 = mid(corners[i], corners[(i + 1) % 4]);
    const m2 = mid(inner[i], inner[(i + 1) % 4]);
    out.push(
      `<line x1="${m1[0]}" y1="${m1[1]}" x2="${m2[0]}" y2="${m2[1]}" stroke="${pal.dark}" stroke-opacity="0.32" stroke-width="1.6"/>`,
    );
  }
  out.push(`<polygon points="${poly(inner)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="2"/>`);
  out.push(`<polygon points="${poly(sq)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.55" stroke-width="3"/>`);
  out.push(
    `<polygon points="${poly([
      [-a * 0.6, -a * 0.6],
      [-a * 0.15, -a * 0.72],
      [-a * 0.3, -a * 0.42],
      [-a * 0.68, -a * 0.3],
    ])}" fill="#ffffff" opacity="0.5"/>`,
  );
  return out.join("\n");
}

/** Pear: a rounded body drawn as radial facets under a pointed head. */
function pearTop({ R = 210, pal }) {
  const cy = R * 0.42;
  const apex = [0, cy - R * 2.15];
  const quad = (a, c, b, t) => [
    (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
    (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
  ];
  const at = (deg) => [Math.cos(rad(deg)) * R, cy + Math.sin(rad(deg)) * R];
  const right = at(14);
  const left = at(166);
  const ctrlR = [R * 0.92, cy - R * 0.95];
  const ctrlL = [-R * 0.92, cy - R * 0.95];

  const outline = [];
  for (let i = 0; i < 5; i++) outline.push(quad(apex, ctrlR, right, i / 5));
  for (let a = 14; a <= 166; a += 15.2) outline.push(at(a));
  for (let i = 0; i < 5; i++) outline.push(quad(left, ctrlL, apex, i / 5));

  const cx0 = outline.reduce((s, p) => s + p[0], 0) / outline.length;
  const cy0 = outline.reduce((s, p) => s + p[1], 0) / outline.length;
  const table = outline.map(([x, y]) => [cx0 + (x - cx0) * 0.44, cy0 + (y - cy0) * 0.44]);
  const out = [face(outline, pal.dark)];
  for (let i = 0; i < outline.length; i++) {
    const j = (i + 1) % outline.length;
    const a = (i * 360) / outline.length - 90;
    out.push(face([outline[i], outline[j], table[j], table[i]], facetShade(pal, a, 0.95)));
  }
  out.push(face(table, mix(pal.base, pal.light, 0.86)));
  out.push(`<polygon points="${poly(table)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.4" stroke-width="2"/>`);
  out.push(`<polygon points="${poly(outline)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.55" stroke-width="3"/>`);
  return out.join("\n");
}

// ----------------------------------------------------------- rough gems -----

function prism({ pal, halfW = 130, top = -250, bottom = 250, cap = 62, tilt = 0.32, striae = 5 }) {
  const w = halfW;
  const capPts = [
    [-w * 0.86, top + cap],
    [0, top],
    [w * 0.86, top + cap],
    [w * 0.78, top + cap * 1.9],
    [0, top + cap * 2.4],
    [-w * 0.78, top + cap * 1.9],
  ];
  const leftTop = capPts[5];
  const midTop = capPts[4];
  const rightTop = capPts[3];
  const skew = w * tilt;
  const leftBot = [leftTop[0] + skew * 0.4, bottom - 46];
  const midBot = [midTop[0] + skew * 0.2, bottom];
  const rightBot = [rightTop[0] + skew * 0.1, bottom - 60];

  const out = [];
  out.push(face([leftTop, midTop, midBot, leftBot], facetShade(pal, 200, 1)));
  out.push(face([midTop, rightTop, rightBot, midBot], facetShade(pal, 330, 1)));
  out.push(face(capPts, facetShade(pal, 250, 0.45)));
  // cap facets
  out.push(face([capPts[0], capPts[1], [0, top + cap * 1.4]], mix(pal.light, "#ffffff", 0.3)));
  out.push(face([capPts[1], capPts[2], [0, top + cap * 1.4]], mix(pal.base, pal.light, 0.55)));
  out.push(face([capPts[2], capPts[3], capPts[4], [0, top + cap * 1.4]], mix(pal.base, pal.dark, 0.25)));
  out.push(face([capPts[5], capPts[0], [0, top + cap * 1.4], capPts[4]], mix(pal.base, pal.light, 0.2)));
  // growth striations across the faces
  for (let i = 1; i <= striae; i++) {
    const t = i / (striae + 1);
    const l = [leftTop[0] + (leftBot[0] - leftTop[0]) * t, leftTop[1] + (leftBot[1] - leftTop[1]) * t];
    const m = [midTop[0] + (midBot[0] - midTop[0]) * t, midTop[1] + (midBot[1] - midTop[1]) * t];
    const r = [rightTop[0] + (rightBot[0] - rightTop[0]) * t, rightTop[1] + (rightBot[1] - rightTop[1]) * t];
    out.push(
      `<path d="M${l[0].toFixed(1)} ${l[1].toFixed(1)} L${m[0].toFixed(1)} ${m[1].toFixed(1)} L${r[0].toFixed(1)} ${r[1].toFixed(1)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.18" stroke-width="2"/>`,
    );
  }
  out.push(
    `<path d="M${leftTop[0]} ${leftTop[1]} L${midTop[0]} ${midTop[1]} L${midBot[0]} ${midBot[1]} L${leftBot[0]} ${leftBot[1]} Z M${midTop[0]} ${midTop[1]} L${rightTop[0]} ${rightTop[1]} L${rightBot[0]} ${rightBot[1]} L${midBot[0]} ${midBot[1]} Z" fill="none" stroke="${pal.dark}" stroke-opacity="0.5" stroke-width="3"/>`,
  );
  out.push(`<polygon points="${poly(capPts)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.5" stroke-width="3"/>`);
  return out.join("\n");
}

/** A water-worn pebble drawn as a lumpy faceted lump; used for parcels. */
function pebble({ pal, cx = 0, cy = 0, r = 120, seed = 1, facets = 9 }) {
  const pts = [];
  for (let i = 0; i < facets; i++) {
    const a = (i * 360) / facets + seed * 11;
    const wobble = 0.82 + 0.26 * Math.abs(Math.sin((i + seed) * 2.3));
    pts.push([cx + Math.cos(rad(a)) * r * wobble, cy + Math.sin(rad(a)) * r * wobble * 0.92]);
  }
  const inner = pts.map(([x, y]) => [cx + (x - cx) * 0.42, cy + (y - cy) * 0.42]);
  const out = [face(pts, pal.dark)];
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const a = (i * 360) / pts.length + seed * 11;
    out.push(face([pts[i], pts[j], inner[j], inner[i]], facetShade(pal, a, 0.9)));
  }
  out.push(face(inner, mix(pal.base, pal.light, 0.55)));
  out.push(`<polygon points="${poly(pts)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.5" stroke-width="2.6"/>`);
  return out.join("\n");
}

/** Points growing off a matrix bed — the shape an amethyst cluster makes. */
function cluster({ pal }) {
  const out = [];
  const bed = [
    [-260, 150],
    [-150, 96],
    [120, 88],
    [268, 152],
    [232, 232],
    [-226, 236],
  ];
  out.push(face(bed, mix(pal.dark, "#4a4a4a", 0.55)));
  out.push(`<polygon points="${poly(bed)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="3"/>`);
  const points = [
    { x: -150, h: 250, w: 74, lean: -12 },
    { x: -20, h: 330, w: 92, lean: 3 },
    { x: 120, h: 246, w: 70, lean: 14 },
    { x: 218, h: 168, w: 52, lean: 26 },
  ];
  for (const p of points) {
    const baseY = 120;
    const tip = [p.x + p.lean * 2.4, baseY - p.h];
    const shoulder = baseY - p.h + p.w * 0.9;
    const L = [p.x - p.w, baseY];
    const R = [p.x + p.w, baseY];
    const LS = [p.x - p.w * 0.94, shoulder];
    const RS = [p.x + p.w * 0.94, shoulder];
    const MS = [p.x + p.lean, shoulder + p.w * 0.36];
    out.push(face([L, LS, [tip[0] - 2, tip[1]], MS], facetShade(pal, 205, 1)));
    out.push(face([MS, [tip[0] + 2, tip[1]], RS, R], facetShade(pal, 335, 1)));
    out.push(face([L, LS, MS, [p.x + p.lean * 0.4, baseY]], mix(pal.base, pal.light, 0.3), 0.55));
    out.push(
      `<path d="M${L[0]} ${L[1]} L${LS[0]} ${LS[1]} L${tip[0]} ${tip[1]} L${RS[0]} ${RS[1]} L${R[0]} ${R[1]} Z" fill="none" stroke="${pal.dark}" stroke-opacity="0.5" stroke-width="2.6"/>`,
    );
    out.push(
      `<path d="M${MS[0]} ${MS[1]} L${tip[0]} ${tip[1]} M${MS[0]} ${MS[1]} L${LS[0]} ${LS[1]} M${MS[0]} ${MS[1]} L${RS[0]} ${RS[1]} M${MS[0]} ${MS[1]} L${MS[0]} ${baseY}" fill="none" stroke="${pal.dark}" stroke-opacity="0.32" stroke-width="2"/>`,
    );
  }
  return out.join("\n");
}

/** A parcel of mine-run rough: several pebbles nested on the tray. */
function parcel({ pal, n = 7 }) {
  const spots = [
    [-150, 40, 118, 1],
    [30, -60, 132, 2],
    [170, 70, 104, 3],
    [-40, 150, 96, 4],
    [-220, -110, 84, 5],
    [150, -140, 92, 6],
    [-10, 10, 74, 7],
  ].slice(0, n);
  return spots
    .sort((a, b) => a[1] - b[1])
    .map(([x, y, r, seed]) => pebble({ pal, cx: x, cy: y, r, seed, facets: 8 }))
    .join("\n");
}

// ---------------------------------------------------------- bench pieces ----

function cell({ pal, r = 190, height = 96, groove = true }) {
  const out = [];
  out.push(
    `<path d="M${-r} ${-height / 2} a${r} ${r * 0.34} 0 0 0 ${r * 2} 0 v${height} a${r} ${r * 0.34} 0 0 1 ${-r * 2} 0 Z" fill="${mix(pal.base, pal.dark, 0.35)}"/>`,
  );
  out.push(
    `<rect x="${-r}" y="${-height / 2}" width="${r * 2}" height="${height}" fill="${mix(pal.base, pal.dark, 0.2)}"/>`,
  );
  out.push(
    `<rect x="${-r}" y="${-height / 2}" width="${r * 0.5}" height="${height}" fill="${pal.light}" opacity="0.28"/>`,
  );
  out.push(`<ellipse cx="0" cy="${-height / 2}" rx="${r}" ry="${r * 0.34}" fill="${mix(pal.light, pal.base, 0.35)}"/>`);
  out.push(
    `<ellipse cx="0" cy="${-height / 2}" rx="${r * 0.74}" ry="${r * 0.25}" fill="none" stroke="${pal.dark}" stroke-opacity="0.3" stroke-width="3"/>`,
  );
  out.push(`<ellipse cx="0" cy="${-height / 2}" rx="${r * 0.46}" ry="${r * 0.155}" fill="${mix(pal.light, "#ffffff", 0.5)}"/>`);
  out.push(
    `<path d="M${-r * 0.16} ${-height / 2} h${r * 0.32} M0 ${-height / 2 - r * 0.075} v${r * 0.15}" stroke="${pal.dark}" stroke-opacity="0.5" stroke-width="7" stroke-linecap="round"/>`,
  );
  if (groove) {
    out.push(
      `<path d="M${-r} ${height * 0.16} a${r} ${r * 0.34} 0 0 0 ${r * 2} 0" fill="none" stroke="${pal.dark}" stroke-opacity="0.22" stroke-width="4"/>`,
    );
  }
  out.push(
    `<ellipse cx="0" cy="${-height / 2}" rx="${r}" ry="${r * 0.34}" fill="none" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="3"/>`,
  );
  out.push(
    `<path d="M${-r} ${-height / 2} v${height} a${r} ${r * 0.34} 0 0 0 ${r * 2} 0 v${-height}" fill="none" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="3"/>`,
  );
  return out.join("\n");
}

function watchGlass({ pal, r = 215, dome = 0.3, bevel = true }) {
  const out = [];
  out.push(`<circle cx="0" cy="0" r="${r}" fill="${mix(pal.base, "#ffffff", 0.55)}" opacity="0.85"/>`);
  out.push(`<circle cx="0" cy="0" r="${r}" fill="none" stroke="${pal.dark}" stroke-opacity="0.5" stroke-width="4"/>`);
  if (bevel) {
    out.push(`<circle cx="0" cy="0" r="${r * 0.9}" fill="none" stroke="${pal.dark}" stroke-opacity="0.3" stroke-width="3"/>`);
  }
  out.push(
    `<path d="M${-r} 0 a${r} ${r * dome} 0 0 1 ${r * 2} 0" fill="none" stroke="${pal.dark}" stroke-opacity="0.22" stroke-width="3"/>`,
  );
  out.push(
    `<path d="M${-r * 0.72} ${-r * 0.36} a${r * 0.8} ${r * 0.8} 0 0 1 ${r * 0.62} ${-r * 0.3}" fill="none" stroke="#ffffff" stroke-opacity="0.9" stroke-width="16" stroke-linecap="round"/>`,
  );
  out.push(
    `<path d="M${-r * 0.5} ${r * 0.52} a${r * 0.78} ${r * 0.78} 0 0 0 ${r * 0.72} ${r * 0.18}" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="9" stroke-linecap="round"/>`,
  );
  out.push(`<circle cx="0" cy="0" r="${r * 0.36}" fill="#ffffff" opacity="0.14"/>`);
  return out.join("\n");
}

function movementPlate({ pal, variant = 0 }) {
  const R = 225;
  const out = [];
  out.push(`<circle cx="0" cy="0" r="${R}" fill="${mix(pal.base, pal.dark, 0.25)}"/>`);
  out.push(`<circle cx="0" cy="0" r="${R}" fill="none" stroke="${pal.dark}" stroke-opacity="0.55" stroke-width="4"/>`);
  // perlage
  for (let ring = 1; ring <= 4; ring++) {
    const rr = ring * 46;
    const n = ring * 8;
    for (let i = 0; i < n; i++) {
      const a = (i * 360) / n + ring * 9;
      const [x, y] = P(a, rr);
      out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="21" fill="${pal.light}" opacity="0.1"/>`);
    }
  }
  if (variant === 1) {
    // quartz module: coil, battery seat, contacts
    out.push(`<rect x="-150" y="-150" width="300" height="300" rx="22" fill="${mix(pal.base, pal.light, 0.2)}" opacity="0.9"/>`);
    out.push(`<rect x="-150" y="-150" width="300" height="300" rx="22" fill="none" stroke="${pal.dark}" stroke-opacity="0.5" stroke-width="4"/>`);
    out.push(`<circle cx="-56" cy="-46" r="86" fill="${mix(pal.brassish ?? "#b8933f", pal.light, 0.35)}" opacity="0.55"/>`);
    for (let i = 0; i < 16; i++) {
      out.push(`<circle cx="-56" cy="-46" r="${20 + i * 4.2}" fill="none" stroke="#8a6a24" stroke-opacity="0.35" stroke-width="1.6"/>`);
    }
    out.push(`<circle cx="86" cy="76" r="72" fill="${pal.light}" opacity="0.6"/>`);
    out.push(`<circle cx="86" cy="76" r="72" fill="none" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="3"/>`);
    out.push(`<path d="M-140 118 h120 M-140 150 h90" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="6" stroke-linecap="round"/>`);
  } else {
    // bridges
    const bridge = (d, op) =>
      `<path d="${d}" fill="${mix(pal.base, pal.light, op)}" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="3"/>`;
    out.push(bridge("M-196 -52 q66 -96 172 -84 q80 10 92 84 q-64 46 -140 40 q-84 -8 -124 -40 Z", 0.36));
    out.push(bridge("M-170 76 q70 -40 152 -22 q66 16 78 74 q-84 46 -168 24 q-52 -14 -62 -76 Z", 0.26));
    // balance wheel
    out.push(`<circle cx="112" cy="-116" r="86" fill="none" stroke="${mix(pal.base, pal.light, 0.5)}" stroke-width="13"/>`);
    out.push(`<circle cx="112" cy="-116" r="86" fill="none" stroke="${pal.dark}" stroke-opacity="0.35" stroke-width="2"/>`);
    for (let i = 0; i < 12; i++) {
      const a = i * 30;
      const [x1, y1] = P(a, 74);
      const [x2, y2] = P(a, 92);
      out.push(
        `<line x1="${(112 + x1).toFixed(1)}" y1="${(-116 + y1).toFixed(1)}" x2="${(112 + x2).toFixed(1)}" y2="${(-116 + y2).toFixed(1)}" stroke="${pal.dark}" stroke-opacity="0.3" stroke-width="3"/>`,
      );
    }
    // hairspring: one continuous Archimedean spiral under the wheel
    const spiral = [];
    for (let i = 0; i <= 260; i++) {
      const a = i * 4;
      const rr = 7 + i * 0.235;
      const [x, y] = P(a, rr);
      spiral.push(`${(112 + x).toFixed(1)} ${(-116 + y).toFixed(1)}`);
    }
    out.push(
      `<path d="M${spiral.join(" L")}" fill="none" stroke="${pal.dark}" stroke-opacity="0.3" stroke-width="2.2"/>`,
    );
    out.push(`<circle cx="112" cy="-116" r="11" fill="${mix(pal.base, pal.dark, 0.3)}"/>`);
  }
  // jewels and screws
  const jewels = [
    [-104, -6],
    [-16, 66],
    [54, -34],
    [-142, 104],
    [118, 128],
  ];
  for (const [x, y] of jewels) {
    out.push(`<circle cx="${x}" cy="${y}" r="15" fill="#b03a4a"/>`);
    out.push(`<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="2.4"/>`);
    out.push(`<circle cx="${x - 4}" cy="${y - 5}" r="4" fill="#ffffff" opacity="0.55"/>`);
  }
  for (let i = 0; i < 5; i++) {
    const a = 34 + i * 72;
    const [x, y] = P(a, 190);
    out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="${mix(pal.light, pal.base, 0.35)}" stroke="${pal.dark}" stroke-opacity="0.5" stroke-width="2.4"/>`);
    out.push(
      `<line x1="${(x - 9).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + 9).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${pal.dark}" stroke-opacity="0.6" stroke-width="4" transform="rotate(${(a * 1.7).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`,
    );
  }
  return out.join("\n");
}

function handsSet({ pal }) {
  const out = [];
  const hand = (len, w, angle, tail, tip) =>
    `<g transform="rotate(${angle})"><path d="M${-w / 2} ${tail} L${-w / 2} ${-len} Q0 ${-len - tip} ${w / 2} ${-len} L${w / 2} ${tail} Z" fill="${mix(pal.base, pal.light, 0.4)}" stroke="${pal.dark}" stroke-opacity="0.5" stroke-width="3"/><circle cx="0" cy="0" r="${w * 0.9}" fill="${mix(pal.base, pal.dark, 0.1)}" stroke="${pal.dark}" stroke-opacity="0.5" stroke-width="3"/><circle cx="0" cy="0" r="${w * 0.34}" fill="${pal.bg[0]}"/></g>`;
  out.push(`<circle cx="0" cy="0" r="248" fill="none" stroke="${pal.ink}" stroke-opacity="0.14" stroke-width="2"/>`);
  out.push(`<g transform="translate(-118 30)">${hand(150, 36, -34, 40, 22)}</g>`);
  out.push(`<g transform="translate(30 -10)">${hand(232, 28, 8, 52, 18)}</g>`);
  out.push(
    `<g transform="translate(168 54) rotate(26)"><rect x="-4" y="-236" width="8" height="300" rx="4" fill="#b03a4a" stroke="${pal.dark}" stroke-opacity="0.35" stroke-width="2"/><circle cx="0" cy="0" r="18" fill="#b03a4a" stroke="${pal.dark}" stroke-opacity="0.4" stroke-width="2.6"/><circle cx="0" cy="0" r="6" fill="${pal.bg[0]}"/></g>`,
  );
  return out.join("\n");
}

function crowns({ pal }) {
  const one = (x, y, r, tube) => {
    const g = [];
    g.push(`<rect x="${x - 10}" y="${y - 4}" width="${tube}" height="26" rx="6" fill="${mix(pal.base, pal.dark, 0.2)}" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="2.6"/>`);
    g.push(`<circle cx="${x}" cy="${y + 9}" r="${r}" fill="${mix(pal.base, pal.light, 0.42)}" stroke="${pal.dark}" stroke-opacity="0.5" stroke-width="3"/>`);
    for (let i = 0; i < 20; i++) {
      const a = (i * 360) / 20;
      const [x1, y1] = P(a, r * 0.78);
      const [x2, y2] = P(a, r);
      g.push(
        `<line x1="${(x + x1).toFixed(1)}" y1="${(y + 9 + y1).toFixed(1)}" x2="${(x + x2).toFixed(1)}" y2="${(y + 9 + y2).toFixed(1)}" stroke="${pal.dark}" stroke-opacity="0.35" stroke-width="3"/>`,
      );
    }
    g.push(`<circle cx="${x}" cy="${y + 9}" r="${r * 0.5}" fill="${mix(pal.light, "#ffffff", 0.4)}" opacity="0.8"/>`);
    g.push(`<circle cx="${x - r * 0.24}" cy="${y + 9 - r * 0.26}" r="${r * 0.18}" fill="#ffffff" opacity="0.7"/>`);
    return g.join("\n");
  };
  return [one(-150, -96, 86, 74), one(52, 24, 104, 86), one(196, -122, 66, 60)].join("\n");
}

function stems({ pal }) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const y = -110 + i * 112;
    const len = 300 - i * 34;
    out.push(
      `<g transform="translate(${-len / 2} ${y}) rotate(${(i - 1) * 6})">
      <rect x="0" y="-9" width="${len * 0.62}" height="18" rx="5" fill="${mix(pal.base, pal.light, 0.4)}" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="2.6"/>
      <rect x="${len * 0.62}" y="-14" width="${len * 0.16}" height="28" rx="3" fill="${mix(pal.base, pal.dark, 0.1)}" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="2.6"/>
      <rect x="${len * 0.78}" y="-11" width="${len * 0.22}" height="22" fill="${mix(pal.base, pal.light, 0.15)}" stroke="${pal.dark}" stroke-opacity="0.45" stroke-width="2.6"/>
      <path d="M${len * 0.2} -9 h${len * 0.1} M${len * 0.34} -9 h${len * 0.08}" stroke="${pal.dark}" stroke-opacity="0.4" stroke-width="4"/>
    </g>`,
    );
  }
  return out.join("\n");
}

function gaskets({ pal }) {
  const out = [];
  const rings = [
    [-108, -70, 150, 22],
    [96, 26, 186, 26],
    [-38, 146, 108, 17],
  ];
  for (const [x, y, r, t] of rings) {
    out.push(
      `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${mix(pal.base, pal.dark, 0.3)}" stroke-width="${t}"/>`,
    );
    out.push(`<circle cx="${x}" cy="${y}" r="${r + t / 2}" fill="none" stroke="${pal.dark}" stroke-opacity="0.4" stroke-width="2"/>`);
    out.push(`<circle cx="${x}" cy="${y}" r="${r - t / 2}" fill="none" stroke="${pal.dark}" stroke-opacity="0.4" stroke-width="2"/>`);
    out.push(
      `<path d="M${x - r * 0.72} ${y - r * 0.6} a${r} ${r} 0 0 1 ${r * 0.8} ${-r * 0.3}" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="${t * 0.4}" stroke-linecap="round"/>`,
    );
  }
  return out.join("\n");
}

function strap({ pal, texture = "plain" }) {
  const out = [];
  const piece = (y0, y1, wTop, wBot, flip) => {
    const pts = [
      [-wTop, y0],
      [wTop, y0],
      [wBot, y1],
      [-wBot, y1],
    ];
    return { pts, flip };
  };
  const upper = piece(-300, -40, 92, 78, false);
  const lower = piece(40, 320, 78, 58, true);

  for (const part of [upper, lower]) {
    out.push(`<polygon points="${poly(part.pts)}" fill="${mix(pal.base, pal.dark, 0.1)}"/>`);
    out.push(
      `<polygon points="${poly(part.pts)}" fill="none" stroke="${pal.dark}" stroke-opacity="0.55" stroke-width="3.5"/>`,
    );
  }

  // texture
  const clipTop = `M${-92} ${-300} L92 -300 L78 -40 L-78 -40 Z`;
  const clipBot = `M${-78} 40 L78 40 L58 320 L-58 320 Z`;
  out.unshift(
    `<defs><clipPath id="strapclip"><path d="${clipTop}"/><path d="${clipBot}"/></clipPath></defs>`,
  );
  const tex = [];
  if (texture === "croc") {
    for (let r = 0; r < 16; r++) {
      for (let c = -3; c <= 3; c++) {
        const y = -320 + r * 42 + (c % 2 ? 10 : 0);
        const x = c * 46;
        tex.push(
          `<rect x="${x - 19}" y="${y}" width="38" height="34" rx="9" fill="${pal.light}" fill-opacity="0.1" stroke="${pal.dark}" stroke-opacity="0.35" stroke-width="2"/>`,
        );
      }
    }
  } else if (texture === "grain") {
    for (let i = 0; i < 260; i++) {
      const x = ((i * 137) % 220) - 110;
      const y = ((i * 89) % 660) - 330;
      tex.push(`<circle cx="${x}" cy="${y}" r="${1.6 + (i % 3) * 0.7}" fill="${pal.dark}" fill-opacity="0.2"/>`);
    }
  } else if (texture === "ribbed") {
    for (let i = 0; i < 34; i++) {
      const y = -320 + i * 20;
      tex.push(`<rect x="-120" y="${y}" width="240" height="9" fill="${pal.dark}" fill-opacity="0.22"/>`);
    }
  } else {
    for (let i = 0; i < 14; i++) {
      const y = -320 + i * 48;
      tex.push(`<path d="M-120 ${y} q120 14 240 0" fill="none" stroke="${pal.light}" stroke-opacity="0.16" stroke-width="10"/>`);
    }
  }
  out.push(`<g clip-path="url(#strapclip)">${tex.join("")}</g>`);

  // stitching
  const stitch = (x, y0, y1) => {
    const s = [];
    for (let y = y0; y < y1; y += 26) {
      s.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 14}" stroke="${mix(pal.light, "#ffffff", 0.5)}" stroke-opacity="0.85" stroke-width="5" stroke-linecap="round"/>`);
    }
    return s.join("");
  };
  out.push(stitch(-66, -290, -54));
  out.push(stitch(66, -290, -54));
  out.push(stitch(-54, 54, 306));
  out.push(stitch(54, 54, 306));

  // spring bar and buckle
  out.push(
    `<rect x="-104" y="-322" width="208" height="16" rx="8" fill="${mix(pal.steelish ?? "#8d9bad", "#ffffff", 0.3)}" stroke="#465468" stroke-opacity="0.5" stroke-width="2.6"/>`,
  );
  out.push(
    `<g transform="translate(0 -12)"><rect x="-96" y="-40" width="192" height="80" rx="16" fill="none" stroke="#8d9bad" stroke-width="15"/><rect x="-96" y="-40" width="192" height="80" rx="16" fill="none" stroke="#465468" stroke-opacity="0.45" stroke-width="3"/><line x1="0" y1="-32" x2="0" y2="32" stroke="#8d9bad" stroke-width="11"/><path d="M0 0 L74 -8" stroke="#8d9bad" stroke-width="9" stroke-linecap="round"/></g>`,
  );
  // punched holes
  for (let i = 0; i < 5; i++) {
    out.push(`<ellipse cx="0" cy="${150 + i * 38}" rx="10" ry="12" fill="${pal.dark}" fill-opacity="0.55"/>`);
  }
  return out.join("\n");
}

// ------------------------------------------------------------- catalogue ----

const ART = {
  // --- Rough Gems ---------------------------------------------------------
  "rough-sapphire-parcel": {
    pal: PALETTES.sapphire,
    label: "Illustration of a blue sapphire crystal in the rough",
    draw: (p) => prism({ pal: p, halfW: 132, top: -260, bottom: 250, cap: 60, striae: 6 }),
  },
  "rough-ruby-crystal": {
    pal: PALETTES.ruby,
    label: "Illustration of a tabular ruby crystal in the rough",
    draw: (p) => prism({ pal: p, halfW: 176, top: -180, bottom: 176, cap: 84, tilt: 0.5, striae: 3 }),
  },
  "rough-emerald-prism": {
    pal: PALETTES.emeraldStone,
    label: "Illustration of a hexagonal emerald prism in the rough",
    draw: (p) => prism({ pal: p, halfW: 108, top: -282, bottom: 268, cap: 48, tilt: 0.2, striae: 8 }),
  },
  "rough-garnet-parcel": {
    pal: PALETTES.garnet,
    label: "Illustration of a parcel of rough garnet pebbles",
    draw: (p) => parcel({ pal: p, n: 7 }),
  },
  "rough-amethyst-cluster": {
    pal: PALETTES.amethyst,
    label: "Illustration of an amethyst crystal cluster on matrix",
    draw: (p) => cluster({ pal: p }),
  },

  // --- Loose Diamonds -----------------------------------------------------
  "diamond-round-brilliant": {
    pal: PALETTES.diamond,
    label: "Illustration of a round brilliant cut diamond seen from above",
    draw: (p) => brilliantTop({ R: 238, pal: p }),
  },
  "diamond-round-large": {
    pal: PALETTES.diamond,
    label: "Illustration of a large round brilliant cut diamond seen from above",
    draw: (p) => brilliantTop({ R: 268, pal: p, table: 0.4, star: 0.76 }),
  },
  "diamond-emerald-cut": {
    pal: PALETTES.diamond,
    label: "Illustration of an emerald cut diamond seen from above",
    draw: (p) => stepTop({ w: 186, h: 258, corner: 58, pal: p, rings: 3 }),
  },
  "diamond-oval": {
    pal: PALETTES.diamond,
    label: "Illustration of an oval brilliant cut diamond seen from above",
    draw: (p) => brilliantTop({ R: 262, aspect: 0.68, pal: p }),
  },
  "diamond-princess": {
    pal: PALETTES.diamond,
    label: "Illustration of a princess cut diamond seen from above",
    draw: (p) => princessTop({ a: 212, pal: p }),
  },
  "diamond-pear-champagne": {
    pal: PALETTES.champagne,
    label: "Illustration of a pear cut champagne diamond seen from above",
    draw: (p) => pearTop({ R: 208, pal: p }),
  },

  // --- Watch Parts --------------------------------------------------------
  "watch-hands-set": {
    pal: PALETTES.steel,
    label: "Illustration of a set of watch hands",
    draw: (p) => handsSet({ pal: p }),
  },
  "watch-crowns": {
    pal: PALETTES.steel,
    label: "Illustration of three stainless watch crowns",
    draw: (p) => crowns({ pal: p }),
  },
  "watch-stems": {
    pal: PALETTES.steel,
    label: "Illustration of three winding stems",
    draw: (p) => stems({ pal: p }),
  },
  "watch-gaskets": {
    pal: PALETTES.steel,
    label: "Illustration of case back gaskets",
    draw: (p) => gaskets({ pal: p }),
  },

  // --- Movements ----------------------------------------------------------
  "movement-automatic": {
    pal: PALETTES.brass,
    label: "Illustration of a mechanical watch movement",
    draw: (p) => movementPlate({ pal: p, variant: 0 }),
  },
  "movement-quartz": {
    pal: PALETTES.steel,
    label: "Illustration of a quartz watch movement module",
    draw: (p) => movementPlate({ pal: p, variant: 1 }),
  },
  "movement-hand-wind": {
    pal: PALETTES.steel,
    label: "Illustration of a hand wound watch movement",
    draw: (p) => movementPlate({ pal: p, variant: 0 }),
  },

  // --- Crystals -----------------------------------------------------------
  "crystal-mineral-flat": {
    pal: PALETTES.glass,
    label: "Illustration of a flat mineral watch crystal",
    draw: (p) => watchGlass({ pal: p, r: 215, dome: 0.12 }),
  },
  "crystal-sapphire-domed": {
    pal: PALETTES.glass,
    label: "Illustration of a domed sapphire watch crystal",
    draw: (p) => watchGlass({ pal: p, r: 222, dome: 0.4 }),
  },
  "crystal-acrylic-high": {
    pal: PALETTES.glass,
    label: "Illustration of a high domed acrylic watch crystal",
    draw: (p) => watchGlass({ pal: p, r: 208, dome: 0.62, bevel: false }),
  },
  "crystal-mineral-large": {
    pal: PALETTES.glass,
    label: "Illustration of a large flat mineral watch crystal",
    draw: (p) => watchGlass({ pal: p, r: 246, dome: 0.16 }),
  },

  // --- Batteries ----------------------------------------------------------
  "battery-cell-small": {
    pal: PALETTES.steel,
    label: "Illustration of a small silver oxide watch cell",
    draw: (p) => cell({ pal: p, r: 160, height: 74 }),
  },
  "battery-cell-mid": {
    pal: PALETTES.steel,
    label: "Illustration of a silver oxide watch cell",
    draw: (p) => cell({ pal: p, r: 190, height: 88 }),
  },
  "battery-cell-tall": {
    pal: PALETTES.steel,
    label: "Illustration of a tall silver oxide watch cell",
    draw: (p) => cell({ pal: p, r: 168, height: 136 }),
  },
  "battery-cell-wide": {
    pal: PALETTES.steel,
    label: "Illustration of a wide silver oxide watch cell",
    draw: (p) => cell({ pal: p, r: 214, height: 66 }),
  },

  // --- Straps -------------------------------------------------------------
  "strap-black-grain": {
    pal: PALETTES.leatherBlack,
    label: "Illustration of a black grained leather watch strap",
    draw: (p) => strap({ pal: p, texture: "grain" }),
  },
  "strap-brown-grain": {
    pal: PALETTES.leatherBrown,
    label: "Illustration of a brown grained leather watch strap",
    draw: (p) => strap({ pal: p, texture: "grain" }),
  },
  "strap-croc-black": {
    pal: PALETTES.leatherBlack,
    label: "Illustration of a black crocodile grain leather watch strap",
    draw: (p) => strap({ pal: p, texture: "croc" }),
  },
  "strap-tan-plain": {
    pal: PALETTES.leatherTan,
    label: "Illustration of a tan leather watch strap",
    draw: (p) => strap({ pal: p, texture: "plain" }),
  },
  "strap-rubber-navy": {
    pal: PALETTES.rubber,
    label: "Illustration of a ribbed rubber watch strap",
    draw: (p) => strap({ pal: p, texture: "ribbed" }),
  },
};

mkdirSync(OUT, { recursive: true });
let n = 0;
for (const [id, spec] of Object.entries(ART)) {
  const svg = shell(id, spec.pal, spec.draw(spec.pal), `${spec.label}. Demo artwork.`);
  writeFileSync(join(OUT, `${id}.svg`), svg, "utf8");
  n++;
}
console.log(`Wrote ${n} demo plates to ${OUT}`);
