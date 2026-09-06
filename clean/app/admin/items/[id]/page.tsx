import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ItemForm } from "@/components/admin/ItemForm";
import { getItem } from "@/lib/inventory/store";

export const metadata: Metadata = { title: "Edit item", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const item = await getItem(id);
  if (!item) notFound();
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  return (
    <AdminShell csrf={csrf} title={`Edit: ${item.title}`} error={error}>
      <ItemForm csrf={csrf} item={item} />
    </AdminShell>
  );
}
