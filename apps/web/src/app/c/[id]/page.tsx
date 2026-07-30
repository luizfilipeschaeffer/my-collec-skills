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
import { Separator } from "@/components/ui/separator";
import { getPublicCollection } from "@/lib/public-gallery";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const collection = await getPublicCollection(id);
  return collection
    ? {
        title: `${collection.name} · My Collec Skills`,
        description: collection.description ?? undefined,
      }
    : { title: "Coleção não encontrada" };
}

const typeLabel = {
  skill: "Skill",
  agent: "Agent",
  mcp: "MCP",
} as const;

export default async function PublicCollectionPage({ params }: Props) {
  const { id } = await params;
  const collection = await getPublicCollection(id);
  if (!collection) notFound();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-12">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{typeLabel[collection.type]}</Badge>
            <Badge variant="outline">
              {collection.category.name} / {collection.subcategory.name}
            </Badge>
            <Badge variant="secondary">@{collection.owner.username}</Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            {collection.name}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {collection.description ??
              "Coleção pública compartilhada no My Collec Skills."}
          </p>
          <Button asChild variant="outline">
            <Link href="/collections">Voltar à galeria</Link>
          </Button>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Itens ({collection.items.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {collection.items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <CardDescription>
                    {item.source} · {item.externalId}
                  </CardDescription>
                </CardHeader>
                {item.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>

        {collection.profiles.length > 0 && (
          <>
            <Separator />
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                Profiles que usam esta coleção
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {collection.profiles.map(({ profile }) => (
                  <Card key={profile.id}>
                    <CardHeader>
                      <CardDescription>
                        @{profile.owner.username}
                      </CardDescription>
                      <CardTitle className="text-base">{profile.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          href={`/u/${profile.owner.username}/${profile.slug}`}
                        >
                          Ver profile <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
