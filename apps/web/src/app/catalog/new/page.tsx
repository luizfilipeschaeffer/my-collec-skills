import { CatalogContributeForm } from "@/components/catalog-contribute-form";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@mcs/db";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Compartilhar no catálogo · My Collec Skills",
  description:
    "Publique uma skill, agent, MCP ou documentação para a comunidade.",
};

export default async function CatalogContributePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/catalog/new");

  const categories = await db.category.findMany({
    include: { subcategories: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Comunidade</p>
          <h1 className="text-4xl font-bold tracking-tight">
            Compartilhar no catálogo
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Publique uma skill, agent, MCP ou doc. Escolha uma categoria
            existente ou sugira uma nova — ela fica disponível para todo mundo.
          </p>
        </div>
        <CatalogContributeForm categories={categories} />
      </main>
    </div>
  );
}
