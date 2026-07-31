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
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Catálogo · My Collec Skills",
  description:
    "Explore skills, agents, MCPs e docs para montar e compartilhar profiles.",
};

type Props = {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
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
  const { q, type, page } = await searchParams;
  const selectedType =
    type === "skill" || type === "agent" || type === "mcp" || type === "doc"
      ? type
      : "all";

  const { items: allItems, source } = await searchCatalog({ q, type: null });

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
          <Button asChild size="lg">
            <Link href="/build">Montar meu profile</Link>
          </Button>
        </div>

        <Suspense fallback={null}>
          <GallerySearch
            basePath="/catalog"
            placeholder="Buscar skills, agents, MCPs, docs…"
          />
        </Suspense>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Tipo</h2>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((item) => (
              <FilterChip
                key={item.value}
                active={selectedType === item.value}
                href={buildFilterHref("/catalog", params, {
                  type: item.value === "all" ? null : item.value,
                })}
              >
                {item.label}
                {` (${typeCounts[item.value]})`}
              </FilterChip>
            ))}
          </div>
        </section>

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
