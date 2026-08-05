"use client";

import { CatalogItemDetailDialog } from "@/components/catalog-item-detail-dialog";
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
import {
  catalogTypeLabel,
  type CatalogItem,
} from "@/lib/catalog";
import { ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function itemKey(item: CatalogItem) {
  return `${item.type}:${item.source}:${item.externalId}`;
}

export function CatalogItemCard({ item }: { item: CatalogItem }) {
  const [open, setOpen] = useState(false);
  const tags = (item.metadata?.tags as string[] | undefined) ?? [];
  const buildHref = `/build?add=${encodeURIComponent(itemKey(item))}`;

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        className="flex h-full cursor-pointer flex-col outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge>{catalogTypeLabel(item.type)}</Badge>
            <Badge variant="outline">{item.source}</Badge>
            {item.category ? (
              <Badge variant="secondary">{item.category.name}</Badge>
            ) : null}
          </div>
          <CardTitle className="line-clamp-1">{item.name}</CardTitle>
          <CardDescription className="font-mono text-xs">
            {item.externalId}
            {item.submittedBy?.username
              ? ` · @${item.submittedBy.username}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {item.description}
          </p>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="justify-between gap-2">
          {item.url ? (
            <Button asChild variant="ghost" size="sm">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                Docs <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ) : (
            <span />
          )}
          <Button asChild size="sm">
            <Link href={buildHref} onClick={(event) => event.stopPropagation()}>
              <Plus className="size-4" /> Adicionar
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <CatalogItemDetailDialog
        item={item}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
