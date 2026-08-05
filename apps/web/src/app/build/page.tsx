import { auth } from "@/auth";
import { ProfileBuilder } from "@/components/profile-builder";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { searchCatalog } from "@/lib/catalog-server";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Montar profile · My Collec Skills",
  description:
    "Monte um profile único com skills, agents, MCPs e documentação — público ou privado.",
};

type Props = {
  searchParams: Promise<{
    add?: string | string[];
    collectCollection?: string | string[];
  }>;
};

export default async function BuildPage({ searchParams }: Props) {
  const { add, collectCollection } = await searchParams;
  const initialAddKey = Array.isArray(add) ? add[0] : add;
  const initialCollectCollectionId = Array.isArray(collectCollection)
    ? collectCollection[0]
    : collectCollection;
  const session = await auth();
  const { items } = await searchCatalog({ type: null });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Profile</p>
            <h1 className="text-4xl font-bold tracking-tight">
              Monte seu profile
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Combine skills, agents, MCPs e documentação em um pacote único.
              Deixe público para compartilhar ou privado — só você terá acesso.
              Você também pode adicionar novos itens e reutilizar o que a
              comunidade compartilha.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/catalog">Só explorar catálogo</Link>
          </Button>
        </div>

        <ProfileBuilder
          items={items}
          loggedIn={Boolean(session?.user)}
          username={session?.user?.username}
          initialAddKey={initialAddKey}
          initialCollectCollectionId={initialCollectCollectionId}
        />
      </main>
    </div>
  );
}
