import { getImgProps, type ImageProps } from "next/dist/shared/lib/get-img-props";
import type { ImageConfigComplete } from "next/dist/shared/lib/image-config";
import defaultLoader from "next/dist/shared/lib/image-loader";

/**
 * next/image's `getImageProps`, without importing "next/image".
 *
 * That module also exports the client <Image> component, and importing it in a
 * server component was enough for Next to ship the component's code (about
 * 6 KB compressed, one more request) on every page, although no page renders
 * it any more (plan item U11). This is the same function with the same
 * config: it returns the attributes next/image would have put on the <img>
 * (srcset through /_next/image, or the plain file in the static export).
 * Written against next 15.5; re-check it when next is upgraded.
 */
export function imageProps(props: ImageProps) {
  const { props: img } = getImgProps(props, {
    defaultLoader,
    // Replaced at build time by Next's define plugin, as in next/image itself.
    imgConf: process.env.__NEXT_IMAGE_OPTS as unknown as ImageConfigComplete,
  });
  // As next/image does: drop undefined attributes so the markup stays clean.
  for (const [key, value] of Object.entries(img)) {
    if (value === undefined) delete (img as Record<string, unknown>)[key];
  }
  return img;
}
