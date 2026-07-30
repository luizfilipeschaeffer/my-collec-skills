"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Boxes,
  Copy,
  FolderPlus,
  Globe2,
  PackageSearch,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type Category = {
  id: string;
  slug: string;
  name: string;
  subcategories: { id: string; slug: string; name: string }[];
};

type Collection = {
  id: string;
  name: string;
  description: string | null;
  type: "skill" | "agent" | "mcp";
  isPublic: boolean;
  category: { name: string };
  subcategory: { name: string };
  items: { id: string; name: string }[];
  _count: { profiles: number };
};

type Profile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  _count: Record<
    "collections" | "skills" | "agents" | "mcps" | "docs" | "extensions",
    number
  >;
};

type CatalogItem = {
  type: "skill" | "agent" | "mcp" | "doc";
  source: string;
  externalId: string;
  name: string;
  description: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export function DashboardClient({
  username,
  initialProfiles,
  initialCollections,
  categories,
}: {
  username: string;
  initialProfiles: Profile[];
  initialCollections: Collection[];
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "profiles";
  const initialCatalogQuery = searchParams.get("q") ?? "";
  const initialCatalogType = searchParams.get("type") ?? "all";

  const [profiles, setProfiles] = useState(initialProfiles);
  const [collections, setCollections] = useState(initialCollections);
  const [activeTab, setActiveTab] = useState(
    ["profiles", "collections", "catalog", "install"].includes(initialTab)
      ? initialTab
      : "profiles",
  );
  const [profileDialog, setProfileDialog] = useState(false);
  const [collectionDialog, setCollectionDialog] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogQuery, setCatalogQuery] = useState(initialCatalogQuery);
  const [catalogType, setCatalogType] = useState(initialCatalogType);
  const [selectedCatalogItem, setSelectedCatalogItem] =
    useState<CatalogItem | null>(null);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [extensionToken, setExtensionToken] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState(
    categories[0]?.subcategories[0]?.id ?? "",
  );
  const [isPending, startTransition] = useTransition();

  const subcategories = useMemo(
    () => categories.find((item) => item.id === categoryId)?.subcategories ?? [],
    [categories, categoryId],
  );

  async function loadCatalog(query = catalogQuery, type = catalogType) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (type !== "all") params.set("type", type);
    const response = await fetch(`/api/catalog?${params}`);
    const payload = await response.json();
    setCatalog(payload.items ?? []);
    if (!response.ok) toast.error("Catálogo indisponível.");
  }

  useEffect(() => {
    if (activeTab !== "catalog") return;

    let cancelled = false;
    const params = new URLSearchParams();
    if (catalogQuery.trim()) params.set("q", catalogQuery.trim());
    if (catalogType !== "all") params.set("type", catalogType);

    void fetch(`/api/catalog?${params}`)
      .then(async (response) => {
        const payload = await response.json();
        if (cancelled) return;
        setCatalog(payload.items ?? []);
        if (!response.ok) toast.error("Catálogo indisponível.");
      })
      .catch(() => {
        if (!cancelled) toast.error("Catálogo indisponível.");
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, catalogQuery, catalogType]);

  function copy(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copiado.");
  }

  async function createProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const directName = String(form.get("directName") ?? "").trim();
    const directType = String(form.get("directType") ?? "skill") as
      | "skill"
      | "agent";
    const directItem = directName
      ? {
          source: "manual",
          externalId: directName.toLowerCase().replaceAll(" ", "-"),
          name: directName,
        }
      : null;
    const docName = String(form.get("docName") ?? "").trim();
    const docUrl = String(form.get("docUrl") ?? "").trim();
    const extensionId = String(form.get("extensionId") ?? "").trim();
    startTransition(async () => {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
          description: form.get("description") || null,
          isPublic: form.get("isPublic") === "on",
          collectionIds: selectedCollectionIds,
          skills: directItem && directType === "skill" ? [directItem] : [],
          agents: directItem && directType === "agent" ? [directItem] : [],
          mcps: [],
          docs:
            docName && docUrl
              ? [
                  {
                    source: "manual",
                    externalId: docName.toLowerCase().replaceAll(" ", "-"),
                    name: docName,
                    url: docUrl,
                  },
                ]
              : [],
          extensions: extensionId
            ? [
                {
                  ide: form.get("extensionIde") ?? "cursor",
                  extensionId,
                  name: extensionId,
                },
              ]
            : [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload.error ?? "Falha ao criar.");
        return;
      }
      setProfiles((current) => [payload.profile, ...current]);
      setSelectedCollectionIds([]);
      setProfileDialog(false);
      toast.success("Profile criado.");
    });
  }

  async function createCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const itemName = String(form.get("itemName") ?? "").trim();
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description") || null,
          type: form.get("type"),
          categoryId,
          subcategoryId,
          isPublic: form.get("isPublic") === "on",
          items: selectedCatalogItem
            ? [
                {
                  source: selectedCatalogItem.source,
                  externalId: selectedCatalogItem.externalId,
                  name: selectedCatalogItem.name,
                  description: selectedCatalogItem.description,
                  metadata: {
                    ...selectedCatalogItem.metadata,
                    ...(selectedCatalogItem.url
                      ? { url: selectedCatalogItem.url }
                      : {}),
                  },
                },
              ]
            : itemName
            ? [
                {
                  source: "manual",
                  externalId: itemName.toLowerCase().replaceAll(" ", "-"),
                  name: itemName,
                },
              ]
            : [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload.error ?? "Falha ao criar.");
        return;
      }
      setCollections((current) => [payload.collection, ...current]);
      setSelectedCatalogItem(null);
      setCollectionDialog(false);
      toast.success("Coleção criada.");
    });
  }

  async function remove(kind: "profiles" | "collections", id: string) {
    const response = await fetch(`/api/${kind}/${id}`, { method: "DELETE" });
    if (!response.ok) return toast.error("Não foi possível excluir.");
    if (kind === "profiles") {
      setProfiles((current) => current.filter((item) => item.id !== id));
    } else {
      setCollections((current) => current.filter((item) => item.id !== id));
    }
    toast.success("Excluído.");
  }

  async function toggleProfileVisibility(profile: Profile) {
    const response = await fetch(`/api/profiles/${profile.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isPublic: !profile.isPublic }),
    });
    if (!response.ok) {
      toast.error("Não foi possível atualizar o profile.");
      return;
    }
    setProfiles((current) =>
      current.map((item) =>
        item.id === profile.id
          ? { ...item, isPublic: !profile.isPublic }
          : item,
      ),
    );
    toast.success("Visibilidade atualizada.");
  }

  async function searchCatalog(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      await loadCatalog();
    });
  }

  async function generateExtensionToken() {
    const response = await fetch("/api/tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Extensão MCS", expiresInDays: 30 }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? "Não foi possível gerar o token.");
      return;
    }
    setExtensionToken(payload.token);
    toast.success("Token gerado. Copie agora; ele não será exibido novamente.");
  }

  const totalItems = profiles.reduce(
    (sum, profile) =>
      sum +
      profile._count.collections +
      profile._count.skills +
      profile._count.agents +
      profile._count.mcps +
      profile._count.docs +
      profile._count.extensions,
    0,
  );

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <div>
        <Badge variant="secondary">@{username}</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monte coleções e profiles; depois compartilhe ou aplique localmente.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Profiles" value={profiles.length} icon={Boxes} />
        <MetricCard
          title="Coleções"
          value={collections.length}
          icon={FolderPlus}
        />
        <MetricCard title="Itens preparados" value={totalItems} icon={Globe2} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="collections">Coleções</TabsTrigger>
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="install">Instalar</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Seus profiles</h2>
              <p className="text-sm text-muted-foreground">
                Cada profile vira um manifesto instalável.
              </p>
            </div>
            <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" /> Novo profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <form onSubmit={createProfile} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>Criar profile</DialogTitle>
                    <DialogDescription>
                      Você poderá anexar coleções e itens pela API/editor.
                    </DialogDescription>
                  </DialogHeader>
                  <Field label="Nome" name="name" required />
                  <Field label="Slug" name="slug" placeholder="nextjs-prisma" required />
                  <div className="space-y-2">
                    <Label htmlFor="profile-description">Descrição</Label>
                    <Textarea id="profile-description" name="description" />
                  </div>
                  <SwitchField name="isPublic" label="Profile público" />
                  {collections.length > 0 && (
                    <div className="space-y-2">
                      <Label>Coleções incluídas</Label>
                      <div className="space-y-2 rounded-lg border p-3">
                        {collections.map((collection) => (
                          <label
                            key={collection.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={selectedCollectionIds.includes(collection.id)}
                              onCheckedChange={(checked) =>
                                setSelectedCollectionIds((current) =>
                                  checked
                                    ? [...current, collection.id]
                                    : current.filter((id) => id !== collection.id),
                                )
                              }
                            />
                            {collection.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label="Tipo de item avulso"
                      name="directType"
                      defaultValue="skill"
                      options={[
                        ["skill", "Skill"],
                        ["agent", "Agent"],
                      ]}
                    />
                    <Field
                      label="Item avulso (opcional)"
                      name="directName"
                      placeholder="Code reviewer"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Doc (opcional)" name="docName" />
                    <Field
                      label="URL do doc"
                      name="docUrl"
                      type="url"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label="IDE"
                      name="extensionIde"
                      defaultValue="cursor"
                      options={[
                        ["cursor", "Cursor"],
                        ["vscode", "VS Code"],
                      ]}
                    />
                    <Field
                      label="Extensão (opcional)"
                      name="extensionId"
                      placeholder="Prisma.prisma"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isPending}>
                      Criar profile
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Visibilidade</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="font-medium">{profile.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {profile.slug}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={profile.isPublic ? "default" : "outline"}>
                        {profile.isPublic ? "Público" : "Privado"}
                      </Badge>
                    </TableCell>
                    <TableCell>{Object.values(profile._count).reduce((a, b) => a + b, 0)}</TableCell>
                    <TableCell className="text-right">
                      {profile.isPublic && (
                        <Button asChild size="icon" variant="ghost">
                          <Link href={`/u/${username}/${profile.slug}`}>
                            <Share2 className="size-4" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleProfileVisibility(profile)}
                        title="Alternar visibilidade"
                      >
                        <Globe2 className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove("profiles", profile.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Coleções</h2>
              <p className="text-sm text-muted-foreground">
                Agrupe skill, agent ou MCP por categoria e subcategoria.
              </p>
            </div>
            <Dialog open={collectionDialog} onOpenChange={setCollectionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" /> Nova coleção
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={createCollection} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>Criar coleção</DialogTitle>
                    <DialogDescription>
                      A taxonomia é compartilhada entre os tipos.
                    </DialogDescription>
                  </DialogHeader>
                  <Field label="Nome" name="name" required />
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label="Tipo"
                      name="type"
                      defaultValue={selectedCatalogItem?.type ?? "skill"}
                      options={[
                        ["skill", "Skill"],
                        ["agent", "Agent"],
                        ["mcp", "MCP"],
                      ]}
                    />
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={categoryId}
                        onValueChange={(value) => {
                          setCategoryId(value);
                          setSubcategoryId(
                            categories.find((item) => item.id === value)
                              ?.subcategories[0]?.id ?? "",
                          );
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subcategoria</Label>
                    <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {subcategories.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedCatalogItem ? (
                    <Card>
                      <CardHeader className="py-3">
                        <CardDescription>Item selecionado do catálogo</CardDescription>
                        <CardTitle className="text-base">
                          {selectedCatalogItem.name}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ) : (
                    <Field label="Primeiro item (opcional)" name="itemName" />
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="collection-description">Descrição</Label>
                    <Textarea id="collection-description" name="description" />
                  </div>
                  <SwitchField name="isPublic" label="Coleção pública" />
                  <DialogFooter>
                    <Button type="submit" disabled={isPending}>
                      Criar coleção
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {collections.map((collection) => (
              <Card key={collection.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge>{collection.type}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove("collections", collection.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <CardTitle>{collection.name}</CardTitle>
                  <CardDescription>
                    {collection.category.name} / {collection.subcategory.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {collection.items.length} itens · usada em{" "}
                  {collection._count.profiles} profiles
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="catalog">
          <Card>
            <CardHeader>
              <CardTitle>Catálogo</CardTitle>
              <CardDescription>
                Skills, agents, docs e MCPs para anexar às suas coleções.{" "}
                <Link href="/catalog" className="underline underline-offset-4">
                  Ver galeria pública
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={searchCatalog} className="flex gap-2">
                <Input
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                  placeholder="Filtrar por nome, tag ou id…"
                />
                <Select value={catalogType} onValueChange={setCatalogType}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="skill">Skills</SelectItem>
                    <SelectItem value="agent">Agents</SelectItem>
                    <SelectItem value="mcp">MCPs</SelectItem>
                    <SelectItem value="doc">Docs</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={isPending}>
                  <PackageSearch className="size-4" /> Buscar
                </Button>
              </form>
              {catalog.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum item. Ajuste o filtro ou abra a aba para carregar o
                  catálogo.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {catalog.map((item) => (
                    <Card key={`${item.source}:${item.externalId}`}>
                      <CardHeader>
                        <Badge className="w-fit" variant="outline">{item.type}</Badge>
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      {item.type !== "doc" && (
                        <CardContent>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCatalogItem(item);
                              setActiveTab("collections");
                              setTimeout(() => setCollectionDialog(true), 0);
                            }}
                          >
                            <Plus className="size-4" /> Usar em coleção
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="install">
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aplicar um profile</CardTitle>
              <CardDescription>
                Use a CLI ou a extensão MCS no Cursor/VS Code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profiles.map((profile) => {
                const command = `npx my-collec-skills install --username ${username} --perfil ${profile.slug}`;
                return (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{profile.name}</div>
                      <code className="text-xs text-muted-foreground">{command}</code>
                    </div>
                    <Button size="icon" variant="outline" onClick={() => copy(command)}>
                      <Copy className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sessão da extensão</CardTitle>
              <CardDescription>
                Gere um token de 30 dias e cole no comando MCS: Login. O token
                é armazenado com hash no banco e em SecretStorage na IDE.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {extensionToken ? (
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={extensionToken}
                    className="font-mono text-xs"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copy(extensionToken)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={generateExtensionToken}>
                  Gerar token da extensão
                </Button>
              )}
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: typeof Boxes;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{title}</CardDescription>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent><CardTitle className="text-3xl">{value}</CardTitle></CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}

function SwitchField({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label htmlFor={name}>{label}</Label>
      <Switch id={name} name={name} />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: [string, string][];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(([value, optionLabel]) => (
            <SelectItem key={value} value={value}>{optionLabel}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
