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
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge>{typeLabel[collection.type]}</Badge>
          <Badge variant="outline">
            {collection.category.name} / {collection.subcategory.name}
          </Badge>
        </div>
        <CardTitle className="line-clamp-1">{collection.name}</CardTitle>
        <CardDescription>@{collection.owner.username}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {collection.description || "Coleção pública reutilizável."}
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          {collection._count.items} itens · {collection._count.profiles}{" "}
          profiles
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/c/${collection.id}`}>
            Abrir <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
