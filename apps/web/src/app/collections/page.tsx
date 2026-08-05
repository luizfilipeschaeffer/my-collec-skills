import { CollectionGalleryCard } from "@/components/collection-gallery-card";
import { CategoryFilterCard } from "@/components/category-filter-card";
import { FilterChip, buildFilterHref } from "@/components/filter-chip";
import { GallerySearch } from "@/components/gallery-search";
import { SiteHeader } from "@/components/site-header";
import {
  listCategoriesWithCounts,
  listPublicCollections,
} from "@/lib/public-gallery";
import { getTaxonomyIcon } from "@/lib/taxonomy-icons";
import type { CollectionType } from "@mcs/db";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Galeria de Coleções · My Collec Skills",
  description:
    "Explore coleções públicas de skills, agents e MCPs por categoria.",
};

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    subcategory?: string;
    sort?: string;
  }>;
};

const TYPES: Array<{ value: "all" | CollectionType; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "skill", label: "Skills" },
  { value: "agent", label: "Agents" },
  { value: "mcp", label: "MCPs" },
];

export default async function CollectionsGalleryPage({ searchParams }: Props) {
  const { q, type, category, subcategory, sort } = await searchParams;
  const selectedType =
    type === "skill" || type === "agent" || type === "mcp" ? type : "all";
  const selectedSort = sort === "popular" ? "popular" : "recent";

  const [collections, categories] = await Promise.all([
    listPublicCollections({
      q,
      type: selectedType,
      category,
      subcategory,
      sort: selectedSort,
    }),
    listCategoriesWithCounts(),
  ]);

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (selectedType !== "all") params.set("type", selectedType);
  if (category) params.set("category", category);
  if (subcategory) params.set("subcategory", subcategory);
  if (selectedSort === "popular") params.set("sort", "popular");

  const activeCategory = categories.find((item) => item.slug === category);
  const totalCollections = categories.reduce(
    (total, item) => total + item._count.collections,
    0,
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Catálogo</p>
          <h1 className="text-4xl font-bold tracking-tight">
            Galeria de Coleções
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Skills, agents e MCPs agrupados por categoria e subcategoria.
            Reutilize coleções públicas ao montar seu profile.
          </p>
        </div>

        <Suspense fallback={null}>
          <GallerySearch
            basePath="/collections"
            placeholder="Buscar coleções por nome ou autor…"
          />
        </Suspense>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Ordenar</h2>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={selectedSort === "recent"}
              icon={getTaxonomyIcon("recent")}
              href={buildFilterHref("/collections", params, { sort: null })}
            >
              Recentes
            </FilterChip>
            <FilterChip
              active={selectedSort === "popular"}
              icon={getTaxonomyIcon("popular")}
              href={buildFilterHref("/collections", params, { sort: "popular" })}
            >
              Popular
            </FilterChip>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Tipo</h2>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((item) => (
              <FilterChip
                key={item.value}
                active={selectedType === item.value}
                icon={getTaxonomyIcon(item.value)}
                href={buildFilterHref("/collections", params, {
                  type: item.value === "all" ? null : item.value,
                })}
              >
                {item.label}
              </FilterChip>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Explore por categoria</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Escolha uma área para encontrar coleções relacionadas. Cada
              categoria reúne skills, agents e MCPs do mesmo domínio.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CategoryFilterCard
              active={!category}
              slug="all"
              href={buildFilterHref("/collections", params, {
                category: null,
                subcategory: null,
              })}
              name="Todas as categorias"
              description="Veja todas as coleções públicas disponíveis."
              count={totalCollections}
            />
            {categories.map((item) => (
              <CategoryFilterCard
                key={item.id}
                active={category === item.slug}
                slug={item.slug}
                href={buildFilterHref("/collections", params, {
                  category: item.slug,
                  subcategory: null,
                })}
                name={item.name}
                description={
                  item.description ??
                  `Coleções de ${item.name.toLowerCase()}.`
                }
                count={item._count.collections}
              />
            ))}
          </div>
        </section>

        {activeCategory && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Subcategoria · {activeCategory.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={!subcategory}
                icon={getTaxonomyIcon("all")}
                href={buildFilterHref("/collections", params, {
                  subcategory: null,
                })}
              >
                Todas
              </FilterChip>
              {activeCategory.subcategories.map((item) => (
                <FilterChip
                  key={item.id}
                  active={subcategory === item.slug}
                  icon={getTaxonomyIcon(item.slug)}
                  href={buildFilterHref("/collections", params, {
                    subcategory: item.slug,
                  })}
                >
                  {item.name}
                </FilterChip>
              ))}
            </div>
          </section>
        )}

        {collections.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <h2 className="text-lg font-semibold">
              Nenhuma coleção encontrada
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajuste os filtros ou publique uma coleção no dashboard.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionGalleryCard
                key={collection.id}
                collection={collection}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
