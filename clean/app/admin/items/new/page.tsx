import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { ItemForm } from "@/components/admin/ItemForm";

export const metadata: Metadata = { title: "Add item", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  return (
    <AdminShell csrf={csrf} title="Add item" error={error}>
      <ItemForm csrf={csrf} />
    </AdminShell>
  );
}
