import { CatalogContributeForm } from "@/components/catalog-contribute-form";
import { SiteHeader } from "@/components/site-header";
import {
  COMMUNITY_CATALOG_SOURCE,
  catalogEntryInclude,
  toCatalogItem,
} from "@/lib/catalog-contribute";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@mcs/db";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Editar item do catálogo · My Collec Skills",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CatalogEditPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard?tab=my-items");

  const { id } = await params;
  const [entry, categories] = await Promise.all([
    db.catalogEntry.findFirst({
      where: {
        id,
        submittedById: user.id,
        source: COMMUNITY_CATALOG_SOURCE,
      },
      include: catalogEntryInclude,
    }),
    db.category.findMany({
      include: { subcategories: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!entry) notFound();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Comunidade</p>
          <h1 className="text-4xl font-bold tracking-tight">Editar item</h1>
          <p className="max-w-2xl text-muted-foreground">
            Atualize os dados públicos deste item. O identificador permanece o
            mesmo para não quebrar profiles e coleções.
          </p>
        </div>
        <CatalogContributeForm
          categories={categories}
          initialItem={toCatalogItem(entry)}
        />
      </main>
    </div>
  );
}
