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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  catalogTypeLabel,
  type CatalogItem,
  type CatalogItemType,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";
import {
  Check,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { toast } from "sonner";

const DRAFT_KEY = "mcs-profile-draft-v1";
const CATALOG_PAGE_SIZE = 24;

type Draft = {
  name: string;
  slug: string;
  description: string;
  isPublic: boolean;
  selectedKeys: string[];
};

const EMPTY_DRAFT: Draft = {
  name: "",
  slug: "",
  description: "",
  isPublic: true,
  selectedKeys: [],
};

function itemKey(item: CatalogItem) {
  return `${item.type}:${item.source}:${item.externalId}`;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function readDraft(): Draft {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY_DRAFT;
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Draft) };
  } catch {
    return EMPTY_DRAFT;
  }
}

function writeDraft(draft: Draft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function subscribeDraft(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === DRAFT_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

const TYPE_FILTERS: Array<{ value: "all" | CatalogItemType; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "skill", label: "Skills" },
  { value: "agent", label: "Agents" },
  { value: "mcp", label: "MCPs" },
  { value: "doc", label: "Docs" },
];

export function ProfileBuilder({
  items,
  loggedIn,
  username,
  initialAddKey,
}: {
  items: CatalogItem[];
  loggedIn: boolean;
  username?: string | null;
  initialAddKey?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const storedDraft = useSyncExternalStore(
    subscribeDraft,
    readDraft,
    () => EMPTY_DRAFT,
  );
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CatalogItemType>("all");
  const [name, setName] = useState(storedDraft.name);
  const [slug, setSlug] = useState(storedDraft.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(storedDraft.slug));
  const [description, setDescription] = useState(storedDraft.description);
  const [isPublic, setIsPublic] = useState(storedDraft.isPublic);
  const [selectedKeys, setSelectedKeys] = useState(() => {
    const keys = storedDraft.selectedKeys;
    if (initialAddKey && !keys.includes(initialAddKey)) {
      return [...keys, initialAddKey];
    }
    return keys;
  });
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);
  const [pageState, setPageState] = useState({
    filterKey: "all:",
    count: CATALOG_PAGE_SIZE,
  });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const draftReady = useRef(false);

  useEffect(() => {
    if (!draftReady.current) {
      draftReady.current = true;
      return;
    }
    writeDraft({ name, slug, description, isPublic, selectedKeys });
  }, [name, slug, description, isPublic, selectedKeys]);

  const catalogByKey = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    for (const item of items) map.set(itemKey(item), item);
    return map;
  }, [items]);

  const selectedItems = useMemo(
    () =>
      selectedKeys
        .map((key) => catalogByKey.get(key))
        .filter((item): item is CatalogItem => Boolean(item)),
    [selectedKeys, catalogByKey],
  );

  const counts = useMemo(() => {
    const base = { skill: 0, agent: 0, mcp: 0, doc: 0 };
    for (const item of selectedItems) base[item.type] += 1;
    return base;
  }, [selectedItems]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!normalized) return true;
      const haystack = [
        item.name,
        item.description,
        item.externalId,
        ...((item.metadata?.tags as string[] | undefined) ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query, typeFilter]);

  const filterKey = `${typeFilter}:${query}`;
  const visibleCount =
    pageState.filterKey === filterKey
      ? pageState.count
      : CATALOG_PAGE_SIZE;
  const visibleItems = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );
  const hasMoreItems = visibleCount < filtered.length;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMoreItems) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setPageState((current) => {
          const base =
            current.filterKey === filterKey
              ? current.count
              : CATALOG_PAGE_SIZE;
          return {
            filterKey,
            count: Math.min(base + CATALOG_PAGE_SIZE, filtered.length),
          };
        });
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [filterKey, filtered.length, hasMoreItems]);

  function toggleItem(item: CatalogItem) {
    const key = itemKey(item);
    setSelectedKeys((current) =>
      current.includes(key)
        ? current.filter((value) => value !== key)
        : [...current, key],
    );
  }

  function removeItem(key: string) {
    setSelectedKeys((current) => current.filter((value) => value !== key));
  }

  function clearSelection() {
    setSelectedKeys([]);
  }

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(toSlug(value));
  }

  async function createProfile() {
    if (!name.trim() || !slug.trim()) {
      toast.error("Informe nome e slug do profile.");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Adicione pelo menos um skill, agent, MCP ou doc.");
      return;
    }

    if (!loggedIn) {
      writeDraft({ name, slug, description, isPublic, selectedKeys });
      router.push(
        `/login?callbackUrl=${encodeURIComponent("/build")}`,
      );
      return;
    }

    const skills = selectedItems
      .filter((item) => item.type === "skill")
      .map((item) => ({
        source: item.source,
        externalId: item.externalId,
        name: item.name,
        description: item.description,
        metadata: item.metadata,
      }));
    const agents = selectedItems
      .filter((item) => item.type === "agent")
      .map((item) => ({
        source: item.source,
        externalId: item.externalId,
        name: item.name,
        description: item.description,
        metadata: item.metadata,
      }));
    const mcps = selectedItems
      .filter((item) => item.type === "mcp")
      .map((item) => ({
        source: item.source,
        externalId: item.externalId,
        name: item.name,
        description: item.description,
        metadata: {
          ...item.metadata,
          ...(item.url ? { url: item.url } : {}),
        },
      }));
    const docs = selectedItems
      .filter((item) => item.type === "doc" && item.url)
      .map((item) => ({
        source: item.source,
        externalId: item.externalId,
        name: item.name,
        description: item.description,
        url: item.url,
        metadata: item.metadata,
      }));

    startTransition(async () => {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          isPublic,
          collectionIds: [],
          skills,
          agents,
          mcps,
          docs,
          extensions: [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload.error ?? "Não foi possível criar o profile.");
        return;
      }
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Profile montado!");
      if (username) {
        router.push(`/u/${username}/${payload.profile.slug}`);
      } else {
        router.push("/dashboard");
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div className="rounded-2xl border bg-muted/30 p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Layers className="size-5" />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Catálogo</h2>
              <p className="text-sm text-muted-foreground">
                Adicione skills, agents, MCPs e documentação ao seu profile.
                Compartilhe publicamente ou mantenha privado.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar no catálogo…"
            className="sm:flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={typeFilter === item.value ? "default" : "outline"}
              onClick={() => setTypeFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {visibleItems.map((item) => {
            const key = itemKey(item);
            const selected = selectedKeys.includes(key);
            return (
              <Card
                key={key}
                role="button"
                tabIndex={0}
                className={cn(
                  "cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "border-primary bg-primary/5",
                )}
                onClick={() => setDetailItem(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setDetailItem(item);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{catalogTypeLabel(item.type)}</Badge>
                      <Badge variant="outline">{item.source}</Badge>
                    </div>
                    <button
                      type="button"
                      className={cn(
                        "grid size-7 place-items-center rounded-full border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                      aria-label={
                        selected
                          ? `Remover ${item.name}`
                          : `Adicionar ${item.name}`
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleItem(item);
                      }}
                    >
                      {selected ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                    </button>
                  </div>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {filtered.length > 0 ? (
          <div
            ref={loadMoreRef}
            className="flex min-h-10 items-center justify-center text-xs text-muted-foreground"
            aria-live="polite"
          >
            {hasMoreItems
              ? `Mostrando ${visibleItems.length} de ${filtered.length} — role para carregar mais`
              : `${filtered.length} item${filtered.length === 1 ? "" : "s"} carregado${filtered.length === 1 ? "" : "s"}`}
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Nenhum item com esse filtro.
          </div>
        ) : null}

        <CatalogItemDetailDialog
          item={detailItem}
          open={Boolean(detailItem)}
          onOpenChange={(open) => {
            if (!open) setDetailItem(null);
          }}
          selected={
            detailItem
              ? selectedKeys.includes(itemKey(detailItem))
              : false
          }
          onToggle={toggleItem}
        />
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/40">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-base">Seu profile</CardTitle>
            </div>
            <CardDescription>
              {selectedItems.length === 0
                ? "Comece adicionando itens do catálogo à esquerda."
                : `${selectedItems.length} item${selectedItems.length === 1 ? "" : "s"} selecionado${selectedItems.length === 1 ? "" : "s"}`}
            </CardDescription>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="secondary">{counts.skill} skills</Badge>
              <Badge variant="secondary">{counts.agent} agents</Badge>
              <Badge variant="secondary">{counts.mcp} mcps</Badge>
              <Badge variant="secondary">{counts.doc} docs</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Ex.: Next.js + Prisma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-slug">Slug</Label>
              <Input
                id="profile-slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(toSlug(event.target.value));
                }}
                placeholder="nextjs-prisma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-description">Descrição</Label>
              <Textarea
                id="profile-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="O que esse profile resolve?"
                rows={3}
              />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
              <span>Profile público</span>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </label>

            <ScrollArea className="h-48 rounded-lg border">
              <div className="space-y-2 p-3">
                {selectedItems.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Nenhum item ainda.
                  </p>
                ) : (
                  selectedItems.map((item) => {
                    const key = itemKey(item);
                    return (
                      <div
                        key={key}
                        role="button"
                        tabIndex={0}
                        className="flex cursor-pointer items-start justify-between gap-2 rounded-md border bg-background px-2.5 py-2 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setDetailItem(item)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setDetailItem(item);
                          }
                        }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {catalogTypeLabel(item.type)}
                            </Badge>
                            <span className="truncate text-sm font-medium">
                              {item.name}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeItem(key);
                          }}
                          aria-label={`Remover ${item.name}`}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex-col gap-2 border-t bg-muted/20">
            <Button
              className="w-full"
              size="lg"
              disabled={isPending}
              onClick={() => void createProfile()}
            >
              {loggedIn ? "Criar meu profile" : "Entrar e criar meu profile"}
            </Button>
            {selectedItems.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={clearSelection}
              >
                <Trash2 className="size-3.5" /> Limpar seleção
              </Button>
            ) : null}
            {!loggedIn ? (
              <p className="text-center text-xs text-muted-foreground">
                Seu rascunho fica salvo neste navegador.{" "}
                <Link href="/login?callbackUrl=%2Fbuild" className="underline">
                  Já tem conta?
                </Link>
              </p>
            ) : null}
          </CardFooter>
        </Card>
      </aside>
    </div>
  );
}
