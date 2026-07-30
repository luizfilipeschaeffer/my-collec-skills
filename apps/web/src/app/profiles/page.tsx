import { FilterChip, buildFilterHref } from "@/components/filter-chip";
import { GallerySearch } from "@/components/gallery-search";
import { ProfileGalleryCard } from "@/components/profile-gallery-card";
import { SiteHeader } from "@/components/site-header";
import { listPublicProfiles } from "@/lib/public-gallery";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Galeria de Profiles · My Collec Skills",
  description:
    "Explore profiles públicos de ambientes AI-ready prontos para instalar.",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ProfilesGalleryPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const profiles = await listPublicProfiles({ q });
  const params = new URLSearchParams();
  if (q) params.set("q", q);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Catálogo</p>
          <h1 className="text-4xl font-bold tracking-tight">
            Galeria de Profiles
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Pacotes públicos de skills, agents, MCPs, docs e extensões. Abra um
            profile para instalar com a CLI ou a extensão MCS.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Suspense fallback={null}>
            <GallerySearch
              basePath="/profiles"
              placeholder="Buscar por nome, slug ou autor…"
            />
          </Suspense>
          <FilterChip href={buildFilterHref("/profiles", params, { q: null })} active={!q}>
            Todos
          </FilterChip>
        </div>

        {profiles.length === 0 ? (
          <EmptyState query={q} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <ProfileGalleryCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <h2 className="text-lg font-semibold">Nenhum profile encontrado</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {query
          ? `Não há profiles públicos para “${query}”.`
          : "Ainda não há profiles públicos. Crie o seu no dashboard."}
      </p>
    </div>
  );
}
