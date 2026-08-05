import { CollectCollectionButton } from "@/components/collect-collection-button";
import { CollectionUsageLine } from "@/components/catalog-usage-line";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isPopularUsage, type CollectionUsageStats } from "@/lib/catalog-usage-stats";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type CollectionCardData = {
  id: string;
  name: string;
  description: string | null;
  type: "skill" | "agent" | "mcp";
  owner: { username: string };
  category: { name: string; slug: string };
  subcategory: { name: string; slug: string };
  _count: { items: number; profiles: number };
  usage?: CollectionUsageStats;
};

const typeLabel = {
  skill: "Skill",
  agent: "Agent",
  mcp: "MCP",
} as const;

export function CollectionGalleryCard({
  collection,
}: {
  collection: CollectionCardData;
}) {
  return (
    <Card className="flex h-full flex-col transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-1 hover:shadow-md">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge>{typeLabel[collection.type]}</Badge>
          <Badge variant="outline">
            {collection.category.name} / {collection.subcategory.name}
          </Badge>
          {isPopularUsage(collection.usage) ? (
            <Badge variant="secondary">Popular</Badge>
          ) : null}
        </div>
        <CardTitle className="line-clamp-1">{collection.name}</CardTitle>
        <CardDescription>@{collection.owner.username}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {collection.description || "Coleção pública reutilizável."}
        </p>
        <CollectionUsageLine usage={collection.usage} />
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {collection._count.items} itens
        </span>
        <div className="flex flex-wrap gap-2">
          <CollectCollectionButton collectionId={collection.id} size="sm" />
          <Button asChild variant="ghost" size="sm">
            <Link href={`/c/${collection.id}`}>
              Abrir <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
