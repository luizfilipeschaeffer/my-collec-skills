import { CopyInstallButton } from "@/components/copy-install-button";
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
import { resolveProfileManifest } from "@/lib/profile-manifest";
import { Download, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ username: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params;
  const manifest = await resolveProfileManifest(username, slug);
  return manifest
    ? {
        title: `${manifest.name} · My Collec Skills`,
        description: manifest.description,
      }
    : { title: "Profile não encontrado" };
}

export default async function ShareProfilePage({ params }: Props) {
  const { username, slug } = await params;
  const manifest = await resolveProfileManifest(username, slug);
  if (!manifest) notFound();
  const command = `npx my-collec-skills install --username ${username} --perfil ${slug}`;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-12">
        <div className="space-y-4">
          <Badge variant="secondary">@{username}</Badge>
          <h1 className="text-4xl font-bold tracking-tight">{manifest.name}</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {manifest.description ?? "Profile compartilhado no My Collec Skills."}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Aplicar no workspace atual</CardDescription>
            <CardTitle className="font-mono text-base">{command}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <CopyInstallButton command={command} />
            <Button asChild variant="outline">
              <a
                href={`/api/profiles/${username}/${slug}/manifest`}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="size-4" /> Ver manifesto
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`vscode://mcs.mcs/install?username=${username}&profile=${slug}`}>
                <ExternalLink className="size-4" /> Abrir na IDE
              </a>
            </Button>
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Coleções</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {manifest.collections.map((collection) => (
              <Card key={collection.id}>
                <CardHeader>
                  <div className="flex gap-2">
                    <Badge>{collection.type}</Badge>
                    <Badge variant="outline">
                      {collection.category}/{collection.subcategory}
                    </Badge>
                  </div>
                  <CardTitle>{collection.name}</CardTitle>
                  <CardDescription>
                    {collection.items.length} itens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {collection.items.map((item) => (
                    <div key={`${item.source}:${item.externalId}`}>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.source}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />
        <div className="flex flex-wrap gap-2">
          {[
            ["Skills", manifest.skills.length],
            ["Agents", manifest.agents.length],
            ["MCPs", manifest.mcps.length],
            ["Docs", manifest.docs.length],
            ["Extensões", manifest.extensions.length],
          ].map(([label, count]) => (
            <Badge key={String(label)} variant="secondary">
              {label}: {count}
            </Badge>
          ))}
        </div>
      </main>
    </div>
  );
}
