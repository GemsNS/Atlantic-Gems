"use client";

import dynamic from "next/dynamic";

/**
 * Home page sections that the site mode switches on or off. Through
 * next/dynamic their code is a separate chunk that the browser fetches only
 * when a section is rendered, instead of riding in the home page's first-load
 * JavaScript whether it is shown or not (plan item U11). They are still
 * rendered on the server, so the HTML is the same.
 */
export const GemExplorer = dynamic(() => import("@/components/GemExplorer").then((m) => m.GemExplorer));

export const JewelleryPaths = dynamic(() =>
  import("@/components/interactive/JewelleryPaths").then((m) => m.JewelleryPaths),
);

export const AtelierBoard = dynamic(() => import("@/components/AtelierBoard").then((m) => m.AtelierBoard));
