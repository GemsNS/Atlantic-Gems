import { notFound } from "next/navigation";
import { collectionIsPublic, type Settings } from "@/lib/inventory/types";
import { getSettings } from "@/lib/inventory/store";
import { pageKeyForPath, type PageKey } from "@/lib/site-pages";

export async function requirePage(key: PageKey): Promise<Settings> {
  const settings = await getSettings();
  if (!settings.pages[key]) notFound();
  if (key === "collection" && !collectionIsPublic(settings)) notFound();
  return settings;
}

export async function requirePath(pathname: string): Promise<Settings> {
  const key = pageKeyForPath(pathname);
  if (!key) return getSettings();
  return requirePage(key);
}
