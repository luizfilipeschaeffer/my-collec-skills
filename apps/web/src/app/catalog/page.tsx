import { CatalogItemCard } from "@/components/catalog-item-card";
import { FilterChip, buildFilterHref } from "@/components/filter-chip";
import { GallerySearch } from "@/components/gallery-search";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  catalogTypeLabel,
  type CatalogItemType,
} from "@/lib/catalog";
import { searchCatalog } from "@/lib/catalog-server";
import { getTaxonomyIcon } from "@/lib/taxonomy-icons";
import { db } from "@mcs/db";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Catálogo · My Collec Skills",
  description:
    "Explore skills, agents, MCPs e docs para montar e compartilhar profiles.",
};

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    page?: string;
    category?: string;
    subcategory?: string;
    sort?: string;
  }>;
};

const PAGE_SIZE = 48;

const TYPES: Array<{ value: "all" | CatalogItemType; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "skill", label: "Skills" },
  { value: "agent", label: "Agents" },
  { value: "mcp", label: "MCPs" },
  { value: "doc", label: "Docs" },
];

export default async function CatalogPage({ searchParams }: Props) {
  const { q, type, page, category, subcategory, sort } = await searchParams;
  const selectedSort = sort === "popular" ? "popular" : "recent";
  const selectedType =
    type === "skill" || type === "agent" || type === "mcp" || type === "doc"
      ? type
      : "all";

  const [{ items: allItems, source }, categories] = await Promise.all([
    searchCatalog({ q, type: null, category, subcategory, sort: selectedSort }),
    db.category.findMany({
      include: { subcategories: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);
  const activeCategory = categories.find((item) => item.slug === category);

  const typeCounts = {
    all: allItems.length,
    skill: allItems.filter((item) => item.type === "skill").length,
    agent: allItems.filter((item) => item.type === "agent").length,
    mcp: allItems.filter((item) => item.type === "mcp").length,
    doc: allItems.filter((item) => item.type === "doc").length,
  };

  const items =
    selectedType === "all"
      ? allItems
      : allItems.filter((item) => item.type === selectedType);
  const requestedPage = Number.parseInt(page ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages,
  );
  const visibleItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (selectedType !== "all") params.set("type", selectedType);
  if (category) params.set("category", category);
  if (subcategory) params.set("subcategory", subcategory);
  if (selectedSort === "popular") params.set("sort", "popular");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Explore</p>
            <h1 className="text-4xl font-bold tracking-tight">Catálogo público</h1>
          <p className="max-w-2xl text-muted-foreground">
            Skills do{" "}
            <a
              href="https://skills.sh/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              skills.sh
            </a>
            , agents, MCPs e docs para montar seu profile. Adicione ao seu
            pacote, compartilhe novos itens e use em público ou privado. Fonte:{" "}
            {source}.
          </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="lg">
              <Link href="/catalog/new">Compartilhar item</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/build">Montar meu profile</Link>
            </Button>
          </div>
        </div>

        <Suspense fallback={null}>
          <GallerySearch
            basePath="/catalog"
            placeholder="Buscar skills, agents, MCPs, docs…"
          />
        </Suspense>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Ordenar</h2>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={selectedSort === "recent"}
              icon={getTaxonomyIcon("recent")}
              href={buildFilterHref("/catalog", params, {
                sort: null,
                page: null,
              })}
            >
              Recentes
            </FilterChip>
            <FilterChip
              active={selectedSort === "popular"}
              icon={getTaxonomyIcon("popular")}
              href={buildFilterHref("/catalog", params, {
                sort: "popular",
                page: null,
              })}
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
                href={buildFilterHref("/catalog", params, {
                  type: item.value === "all" ? null : item.value,
                  page: null,
                })}
              >
                {item.label}
                {` (${typeCounts[item.value]})`}
              </FilterChip>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Categoria
          </h2>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={!category}
              icon={getTaxonomyIcon("all")}
              href={buildFilterHref("/catalog", params, {
                category: null,
                subcategory: null,
                page: null,
              })}
            >
              Todas
            </FilterChip>
            {categories.map((item) => (
              <FilterChip
                key={item.id}
                active={category === item.slug}
                icon={getTaxonomyIcon(item.slug)}
                href={buildFilterHref("/catalog", params, {
                  category: item.slug,
                  subcategory: null,
                  page: null,
                })}
              >
                {item.name}
              </FilterChip>
            ))}
          </div>
        </section>

        {activeCategory ? (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Subcategoria · {activeCategory.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={!subcategory}
                icon={getTaxonomyIcon("all")}
                href={buildFilterHref("/catalog", params, {
                  subcategory: null,
                  page: null,
                })}
              >
                Todas
              </FilterChip>
              {activeCategory.subcategories.map((item) => (
                <FilterChip
                  key={item.id}
                  active={subcategory === item.slug}
                  icon={getTaxonomyIcon(item.slug)}
                  href={buildFilterHref("/catalog", params, {
                    subcategory: item.slug,
                    page: null,
                  })}
                >
                  {item.name}
                </FilterChip>
              ))}
            </div>
          </section>
        ) : null}

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <h2 className="text-lg font-semibold">Nenhum item encontrado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente outro termo ou limpe o filtro de tipo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {items.length}{" "}
              {selectedType === "all"
                ? "itens"
                : `${catalogTypeLabel(selectedType).toLowerCase()}${items.length === 1 ? "" : "s"}`}
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => (
                <CatalogItemCard
                  key={`${item.type}:${item.source}:${item.externalId}`}
                  item={item}
                />
              ))}
            </div>
            {totalPages > 1 ? (
              <nav
                className="flex items-center justify-between gap-4 border-t pt-6"
                aria-label="Paginação do catálogo"
              >
                {currentPage === 1 ? (
                  <Button variant="outline" disabled>
                    Anterior
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link
                      href={buildFilterHref("/catalog", params, {
                        page:
                          currentPage > 2 ? String(currentPage - 1) : null,
                      })}
                    >
                      Anterior
                    </Link>
                  </Button>
                )}
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                {currentPage === totalPages ? (
                  <Button variant="outline" disabled>
                    Próxima
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link
                      href={buildFilterHref("/catalog", params, {
                        page: String(currentPage + 1),
                      })}
                    >
                      Próxima
                    </Link>
                  </Button>
                )}
              </nav>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
