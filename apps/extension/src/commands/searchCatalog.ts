import * as vscode from "vscode";
import {
  searchCatalog,
  type CatalogApiItem,
  type CatalogItemType,
} from "../api/client.js";
import { getApiUrl } from "../config.js";
import type { McsTreeProvider } from "../tree/mcsTreeProvider.js";
import { installCatalogItemCommand } from "./installCatalogItem.js";

const TYPE_PICKS: Array<{
  label: string;
  description: string;
  type: CatalogItemType | "all";
}> = [
  { label: "Tudo", description: "Skills, agents, MCPs e docs", type: "all" },
  { label: "Skills", description: "Instruções e workflows", type: "skill" },
  { label: "Agents", description: "Agentes especializados", type: "agent" },
  { label: "MCPs", description: "Servidores Model Context Protocol", type: "mcp" },
  { label: "Docs", description: "Referências e documentação", type: "doc" },
];

function iconForType(type: CatalogItemType): vscode.ThemeIcon {
  switch (type) {
    case "skill":
      return new vscode.ThemeIcon("symbol-event");
    case "agent":
      return new vscode.ThemeIcon("robot");
    case "mcp":
      return new vscode.ThemeIcon("plug");
    case "doc":
      return new vscode.ThemeIcon("book");
  }
}

export async function searchCatalogCommand(deps: {
  workspaceState: vscode.Memento;
  tree: McsTreeProvider;
}): Promise<void> {
  const typePick = await vscode.window.showQuickPick(TYPE_PICKS, {
    title: "MCS Marketplace — tipo",
    placeHolder: "Filtrar por tipo de item",
    ignoreFocusOut: true,
  });
  if (!typePick) return;

  const query = await vscode.window.showInputBox({
    title: "MCS Marketplace — busca",
    prompt: "Termo de busca (vazio lista o catálogo built-in)",
    placeHolder: "prisma, nextjs, filesystem…",
    ignoreFocusOut: true,
  });
  if (query === undefined) return;

  let items: CatalogApiItem[] = [];
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "MCS: buscando catálogo…",
        cancellable: false,
      },
      async () => {
        const result = await searchCatalog({
          apiUrl: getApiUrl(),
          q: query,
          type: typePick.type,
          take: 40,
        });
        items = result.items;
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`MCS Search Catalog: ${message}`);
    return;
  }

  if (items.length === 0) {
    void vscode.window.showInformationMessage(
      "Nenhum item encontrado no catálogo MCS.",
    );
    return;
  }

  const selected = await vscode.window.showQuickPick(
    items.map((item) => ({
      label: item.name,
      description: `${item.type} · ${item.source}`,
      detail: item.description || item.externalId,
      iconPath: iconForType(item.type),
      item,
    })),
    {
      title: "MCS Marketplace — resultados",
      placeHolder: `${items.length} resultado(s) — selecione para instalar`,
      matchOnDescription: true,
      matchOnDetail: true,
      ignoreFocusOut: true,
    },
  );
  if (!selected) return;

  const action = await vscode.window.showQuickPick(
    [
      {
        label: "$(cloud-download) Instalar no workspace",
        action: "install" as const,
      },
      {
        label: "$(info) Ver detalhes",
        action: "details" as const,
      },
    ],
    {
      title: selected.item.name,
      placeHolder: "Escolha uma ação",
      ignoreFocusOut: true,
    },
  );
  if (!action) return;

  if (action.action === "details") {
    const md = [
      `# ${selected.item.name}`,
      "",
      `- Tipo: \`${selected.item.type}\``,
      `- Source: \`${selected.item.source}\``,
      `- Id: \`${selected.item.externalId}\``,
      selected.item.url ? `- URL: ${selected.item.url}` : "",
      "",
      selected.item.description || "_Sem descrição_",
    ]
      .filter(Boolean)
      .join("\n");
    const doc = await vscode.workspace.openTextDocument({
      content: md,
      language: "markdown",
    });
    await vscode.window.showTextDocument(doc, { preview: true });

    const installNow = await vscode.window.showInformationMessage(
      `Instalar ${selected.item.name}?`,
      "Instalar",
    );
    if (installNow !== "Instalar") return;
  }

  await installCatalogItemCommand(deps, selected.item);
}
