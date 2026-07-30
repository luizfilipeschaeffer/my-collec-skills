import { CatalogItemCard } from "@/components/catalog-item-card";
import { CollectionGalleryCard } from "@/components/collection-gallery-card";
import { ProfileGalleryCard } from "@/components/profile-gallery-card";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { searchCatalog } from "@/lib/catalog";
import {
  listPublicCollections,
  listPublicProfiles,
} from "@/lib/public-gallery";
import { ArrowRight, PackageCheck, Share2, Terminal } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const [profiles, collections, catalog] = await Promise.all([
    listPublicProfiles({ take: 6 }),
    listPublicCollections({ take: 6 }),
    searchCatalog({ take: 6, includeRegistry: false }),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="border-b">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[1.2fr_.8fr] lg:py-28">
            <div className="space-y-6">
              <Badge variant="secondary">Cursor-first · open source workflow</Badge>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
                Seu ambiente AI-ready, compartilhável e instalável.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Monte um profile único com skills, agents, MCPs e documentação.
                Publique para compartilhar ou mantenha privado — e aplique pelo
                terminal ou pela IDE.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/build">
                    Montar meu profile <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/catalog">Ver catálogo</Link>
                </Button>
              </div>
            </div>
            <Card className="self-center">
              <CardHeader>
                <CardDescription>Instale em qualquer workspace</CardDescription>
                <CardTitle className="font-mono text-base">
                  npx @mcs/cli install --username demo --perfil nextjs-prisma
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  [PackageCheck, "Skills, agents e MCPs"],
                  [Share2, "Público ou privado"],
                  [Terminal, "Apply idempotente"],
                ].map(([Icon, label]) => (
                  <div key={String(label)} className="flex items-center gap-3">
                    <Icon className="size-5 text-primary" />
                    <span className="text-sm">{String(label)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Catálogo em destaque</h2>
              <p className="text-muted-foreground">
                Skills, agents, MCPs e docs para montar e compartilhar seu profile.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/catalog">Ver tudo</Link>
              </Button>
              <Button asChild>
                <Link href="/build">Montar profile</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {catalog.items.map((item) => (
              <CatalogItemCard
                key={`${item.type}:${item.source}:${item.externalId}`}
                item={item}
              />
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Profiles em destaque</h2>
                <p className="text-muted-foreground">
                  Configurações prontas para instalar ou usar como ponto de partida.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/profiles">Ver todos</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <ProfileGalleryCard key={profile.id} profile={profile} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Coleções públicas</h2>
                <p className="text-muted-foreground">
                  Skills, agents e MCPs organizados por categoria.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/collections">Ver todas</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <CollectionGalleryCard
                  key={collection.id}
                  collection={collection}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
