"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogItem, CatalogItemType } from "@/lib/catalog";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type CategoryOption = {
  id: string;
  slug: string;
  name: string;
  subcategories: { id: string; slug: string; name: string }[];
};

const NEW_VALUE = "__new__";

export function CatalogContributeForm({
  categories,
  initialItem,
}: {
  categories: CategoryOption[];
  initialItem?: CatalogItem;
}) {
  const router = useRouter();
  const [type, setType] = useState<CatalogItemType>(initialItem?.type ?? "skill");
  const [categoryMode, setCategoryMode] = useState(
    initialItem?.category?.id ?? categories[0]?.id ?? NEW_VALUE,
  );
  const [subcategoryMode, setSubcategoryMode] = useState(
    initialItem?.subcategory?.id ??
      categories[0]?.subcategories[0]?.id ??
      NEW_VALUE,
  );
  const [isPending, startTransition] = useTransition();

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === categoryMode),
    [categories, categoryMode],
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      type,
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      url: String(form.get("url") ?? "").trim() || null,
    };

    if (categoryMode === NEW_VALUE) {
      payload.newCategoryName = String(form.get("newCategoryName") ?? "").trim();
    } else {
      payload.categoryId = categoryMode;
    }

    if (subcategoryMode === NEW_VALUE) {
      payload.newSubcategoryName = String(
        form.get("newSubcategoryName") ?? "",
      ).trim();
    } else {
      payload.subcategoryId = subcategoryMode;
    }

    if (type === "mcp") {
      const command = String(form.get("mcpCommand") ?? "").trim();
      const args = String(form.get("mcpArgs") ?? "")
        .split(/\s+/)
        .map((part) => part.trim())
        .filter(Boolean);
      const serverUrl = String(form.get("mcpUrl") ?? "").trim();
      if (command || serverUrl) {
        payload.metadata = {
          server: {
            ...(command ? { command } : {}),
            ...(args.length ? { args } : {}),
            ...(serverUrl ? { url: serverUrl } : {}),
          },
        };
      }
    }

    startTransition(async () => {
      const response = await fetch(
        initialItem?.id ? `/api/catalog/${initialItem.id}` : "/api/catalog",
        {
          method: initialItem?.id ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body.error ?? "Não foi possível publicar o item.");
        return;
      }
      toast.success(initialItem?.id ? "Item atualizado." : "Item publicado.");
      router.push("/catalog");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as CatalogItemType)}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skill">Skill</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="mcp">MCP</SelectItem>
              <SelectItem value="doc">Doc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            name="name"
            required
            minLength={2}
            maxLength={150}
            defaultValue={initialItem?.name}
            placeholder="Prisma Schema Review"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={1}
          maxLength={1000}
          defaultValue={initialItem?.description}
          placeholder="O que esse item faz e quando usar."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL {type === "doc" ? "" : "(opcional)"}</Label>
        <Input
          id="url"
          name="url"
          type="url"
          required={type === "doc"}
          defaultValue={initialItem?.url}
          placeholder="https://..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={categoryMode}
            onValueChange={(value) => {
              setCategoryMode(value);
              if (value === NEW_VALUE) {
                setSubcategoryMode(NEW_VALUE);
                return;
              }
              const next = categories.find((item) => item.id === value);
              setSubcategoryMode(next?.subcategories[0]?.id ?? NEW_VALUE);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Escolher categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
              <SelectItem value={NEW_VALUE}>Criar nova categoria</SelectItem>
            </SelectContent>
          </Select>
          {categoryMode === NEW_VALUE ? (
            <Input
              name="newCategoryName"
              required
              minLength={2}
              maxLength={80}
              placeholder="Nome da nova categoria"
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Subcategoria</Label>
          <Select value={subcategoryMode} onValueChange={setSubcategoryMode}>
            <SelectTrigger>
              <SelectValue placeholder="Escolher subcategoria" />
            </SelectTrigger>
            <SelectContent>
              {(selectedCategory?.subcategories ?? []).map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
              <SelectItem value={NEW_VALUE}>Criar nova subcategoria</SelectItem>
            </SelectContent>
          </Select>
          {subcategoryMode === NEW_VALUE ? (
            <Input
              name="newSubcategoryName"
              required
              minLength={2}
              maxLength={80}
              placeholder="Nome da nova subcategoria"
            />
          ) : null}
        </div>
      </div>

      {type === "mcp" ? (
        <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="mcpCommand">Comando MCP</Label>
            <Input
              id="mcpCommand"
              name="mcpCommand"
              placeholder="npx"
              defaultValue={
                typeof initialItem?.metadata?.server === "object" &&
                initialItem.metadata.server &&
                "command" in initialItem.metadata.server
                  ? String(
                      (initialItem.metadata.server as { command?: string })
                        .command ?? "",
                    )
                  : ""
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="mcpArgs">Args</Label>
            <Input
              id="mcpArgs"
              name="mcpArgs"
              placeholder="-y @org/server"
              defaultValue={
                typeof initialItem?.metadata?.server === "object" &&
                initialItem.metadata.server &&
                "args" in initialItem.metadata.server &&
                Array.isArray(
                  (initialItem.metadata.server as { args?: unknown }).args,
                )
                  ? (
                      (initialItem.metadata.server as { args: string[] }).args ??
                      []
                    ).join(" ")
                  : ""
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="mcpUrl">URL do servidor</Label>
            <Input
              id="mcpUrl"
              name="mcpUrl"
              type="url"
              placeholder="https://..."
              defaultValue={
                typeof initialItem?.metadata?.server === "object" &&
                initialItem.metadata.server &&
                "url" in initialItem.metadata.server
                  ? String(
                      (initialItem.metadata.server as { url?: string }).url ??
                        "",
                    )
                  : ""
              }
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {initialItem?.id ? "Salvar alterações" : "Publicar no catálogo"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
