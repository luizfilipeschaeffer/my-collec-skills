import { DashboardClient } from "@/components/dashboard-client";
import { SiteHeader } from "@/components/site-header";
import {
  COMMUNITY_CATALOG_SOURCE,
  catalogEntryInclude,
  toCatalogItem,
} from "@/lib/catalog-contribute";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@mcs/db";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profiles, collections, categories, myCatalogRows] = await Promise.all([
    db.profile.findMany({
      where: { ownerId: user.id },
      include: {
        collections: { include: { collection: true } },
        _count: {
          select: {
            collections: true,
            skills: true,
            agents: true,
            mcps: true,
            docs: true,
            extensions: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.collection.findMany({
      where: { ownerId: user.id },
      include: {
        category: true,
        subcategory: true,
        items: true,
        _count: { select: { profiles: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.category.findMany({
      include: { subcategories: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    db.catalogEntry.findMany({
      where: {
        submittedById: user.id,
        source: COMMUNITY_CATALOG_SOURCE,
      },
      include: catalogEntryInclude,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Suspense fallback={null}>
        <DashboardClient
          username={user.username}
          initialProfiles={profiles}
          initialCollections={collections}
          categories={categories}
          initialCatalogItems={myCatalogRows.map(toCatalogItem)}
        />
      </Suspense>
    </div>
  );
}
