"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  catalogTypeLabel,
  type CatalogItem,
} from "@/lib/catalog";
import { Check, Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function itemKey(item: CatalogItem) {
  return `${item.type}:${item.source}:${item.externalId}`;
}

type SkillsShEnrichment = {
  available: boolean;
  summary?: string | null;
  skillMarkdown?: string | null;
  fileCount?: number;
  audit?: {
    audits?: Array<{
      provider: string;
      status: string;
      summary: string;
      riskLevel?: string;
    }>;
  } | null;
  message?: string;
};

type EnrichmentState = {
  skillId: string;
  data: SkillsShEnrichment | null;
  status: "loading" | "ready" | "error";
};

function auditBadgeVariant(status: string) {
  if (status === "pass") return "secondary" as const;
  if (status === "warn") return "outline" as const;
  return "destructive" as const;
}

export function CatalogItemDetailDialog({
  item,
  open,
  onOpenChange,
  selected,
  onToggle,
}: {
  item: CatalogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected?: boolean;
  onToggle?: (item: CatalogItem) => void;
}) {
  const enrichmentKey =
    open && item?.source === "skills.sh" ? item.externalId : null;
  const [enrichment, setEnrichment] = useState<EnrichmentState | null>(null);

  useEffect(() => {
    if (!enrichmentKey) return;

    let cancelled = false;
    const path = enrichmentKey
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    void fetch(`/api/catalog/skills/${path}`)
      .then(async (res) => {
        const data = (await res.json()) as SkillsShEnrichment;
        if (cancelled) return;
        setEnrichment({
          skillId: enrichmentKey,
          data,
          status: "ready",
        });
      })
      .catch(() => {
        if (cancelled) return;
        setEnrichment({
          skillId: enrichmentKey,
          data: {
            available: false,
            message: "Não foi possível carregar o detalhe v1.",
          },
          status: "error",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enrichmentKey]);

  if (!item) return null;

  const tags = (item.metadata?.tags as string[] | undefined) ?? [];
  const installs = item.metadata?.installs as number | undefined;
  const installCommand = item.metadata?.installCommand as string | undefined;
  const repo = item.metadata?.repo as string | undefined;
  const skillId = item.metadata?.skillId as string | undefined;
  const packages = item.metadata?.packages;
  const apiVersion = item.metadata?.api as string | undefined;
  const buildHref = `/build?add=${encodeURIComponent(itemKey(item))}`;

  const activeEnrichment =
    enrichmentKey && enrichment?.skillId === enrichmentKey
      ? enrichment
      : null;
  const loadingDetail = Boolean(enrichmentKey) && !activeEnrichment;
  const enrichmentData = activeEnrichment?.data ?? null;
  const description =
    enrichmentData?.summary?.trim() ||
    item.description ||
    "Sem descrição disponível.";
  const audits = enrichmentData?.audit?.audits ?? [];

  function copy(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copiado.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <div className="flex flex-wrap gap-2 pr-8">
            <Badge>{catalogTypeLabel(item.type)}</Badge>
            <Badge variant="outline">{item.source}</Badge>
            {apiVersion ? (
              <Badge variant="outline">API {apiVersion}</Badge>
            ) : null}
            {typeof installs === "number" ? (
              <Badge variant="secondary">
                {installs.toLocaleString("en-US")} installs
              </Badge>
            ) : null}
          </div>
          <DialogTitle className="text-xl leading-snug">{item.name}</DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">
            {item.externalId}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <section className="space-y-2">
            <h3 className="text-sm font-medium">O que é</h3>
            {loadingDetail ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </section>

          {tags.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          <Separator />

          <section className="space-y-2">
            <h3 className="text-sm font-medium">Detalhes</h3>
            <dl className="grid gap-2 text-sm">
              <div className="grid grid-cols-[7rem_1fr] gap-2">
                <dt className="text-muted-foreground">Tipo</dt>
                <dd>{catalogTypeLabel(item.type)}</dd>
              </div>
              <div className="grid grid-cols-[7rem_1fr] gap-2">
                <dt className="text-muted-foreground">Fonte</dt>
                <dd>{item.source}</dd>
              </div>
              {repo ? (
                <div className="grid grid-cols-[7rem_1fr] gap-2">
                  <dt className="text-muted-foreground">Repositório</dt>
                  <dd className="break-all">{repo}</dd>
                </div>
              ) : null}
              {skillId ? (
                <div className="grid grid-cols-[7rem_1fr] gap-2">
                  <dt className="text-muted-foreground">Skill ID</dt>
                  <dd className="font-mono text-xs">{skillId}</dd>
                </div>
              ) : null}
              {typeof enrichmentData?.fileCount === "number" &&
              enrichmentData.fileCount > 0 ? (
                <div className="grid grid-cols-[7rem_1fr] gap-2">
                  <dt className="text-muted-foreground">Arquivos</dt>
                  <dd>{enrichmentData.fileCount} arquivo(s) no snapshot</dd>
                </div>
              ) : null}
              {Array.isArray(packages) && packages.length > 0 ? (
                <div className="grid grid-cols-[7rem_1fr] gap-2">
                  <dt className="text-muted-foreground">Pacotes</dt>
                  <dd>{packages.length} pacote(s) MCP</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {item.source === "skills.sh" && audits.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Auditorias de segurança</h3>
              <ul className="space-y-2">
                {audits.map((audit) => (
                  <li
                    key={`${audit.provider}-${audit.status}`}
                    className="rounded-lg border p-2.5 text-sm"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-medium">{audit.provider}</span>
                      <Badge variant={auditBadgeVariant(audit.status)}>
                        {audit.status}
                      </Badge>
                      {audit.riskLevel ? (
                        <Badge variant="outline">{audit.riskLevel}</Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground">{audit.summary}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {item.source === "skills.sh" &&
          enrichmentData &&
          !enrichmentData.available &&
          enrichmentData.message ? (
            <p className="text-xs text-muted-foreground">
              {enrichmentData.message}
            </p>
          ) : null}

          {installCommand ? (
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Instalar localmente</h3>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
                <code className="flex-1 overflow-x-auto text-xs">
                  {installCommand}
                </code>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => copy(installCommand)}
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
            </section>
          ) : null}
        </div>

        <DialogFooter className="border-t pt-4 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {item.url ? (
              <Button asChild variant="outline" size="sm">
                <a href={item.url} target="_blank" rel="noreferrer">
                  Abrir fonte <ExternalLink className="size-3.5" />
                </a>
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {onToggle ? (
              <Button
                type="button"
                size="sm"
                variant={selected ? "outline" : "default"}
                onClick={() => {
                  onToggle(item);
                  if (!selected) onOpenChange(false);
                }}
              >
                {selected ? (
                  <>
                    <Trash2 className="size-3.5" /> Remover do profile
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" /> Adicionar ao profile
                  </>
                )}
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href={buildHref}>
                  <Plus className="size-3.5" /> Adicionar ao profile
                </Link>
              </Button>
            )}
            {selected ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="size-3.5" /> Já no profile
              </span>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
