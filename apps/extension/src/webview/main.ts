import type {
  CartEntry,
  HostToWebviewMessage,
  MarketplaceScope,
  WebviewToHostMessage,
} from "../panel/protocol.js";

declare function acquireVsCodeApi(): {
  postMessage(message: WebviewToHostMessage): void;
  getState(): WebviewState | undefined;
  setState(state: WebviewState): void;
};

interface WebviewState {
  scope: MarketplaceScope;
  query: string;
  cart: CartEntry[];
  ideTarget: "auto" | "cursor" | "vscode" | "both";
  force: boolean;
}

const vscode = acquireVsCodeApi();

const SCOPES: Array<{ id: MarketplaceScope; label: string }> = [
  { id: "all", label: "Tudo" },
  { id: "skill", label: "Skills" },
  { id: "agent", label: "Agents" },
  { id: "mcp", label: "MCPs" },
  { id: "doc", label: "Docs" },
  { id: "profiles", label: "Profiles" },
  { id: "collections", label: "Coleções" },
];

const saved = vscode.getState();
let scope: MarketplaceScope = saved?.scope ?? "all";
let query = saved?.query ?? "";
let cart: CartEntry[] = saved?.cart ?? [];
let ideTarget: WebviewState["ideTarget"] = saved?.ideTarget ?? "auto";
let force = saved?.force ?? false;
let authenticated = false;
let provider: string | undefined;
let loading = false;
let error = "";
let status = "Pronto";
let items: CartEntry[] = [];
let installing = false;

function persist() {
  vscode.setState({ scope, query, cart, ideTarget, force });
}

function post(message: WebviewToHostMessage) {
  vscode.postMessage(message);
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "className") node.className = String(value);
    else if (key === "text") node.textContent = String(value);
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === "checked" || key === "disabled") {
      (node as HTMLInputElement)[key] = Boolean(value);
    } else if (value !== undefined && value !== null) {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function inCart(key: string) {
  return cart.some((entry) => entry.key === key);
}

function toggleCart(entry: CartEntry) {
  if (inCart(entry.key)) {
    cart = cart.filter((e) => e.key !== entry.key);
  } else {
    cart = [...cart, entry];
  }
  persist();
  render();
}

function runSearch() {
  loading = true;
  error = "";
  status = "Buscando…";
  persist();
  render();
  post({ type: "search", scope, query, take: 40 });
}

function render() {
  const root = document.getElementById("root");
  if (!root) return;
  root.replaceChildren();

  const nav = el("nav", { className: "nav", "aria-label": "Escopos" }, [
    el("div", { className: "brand", text: "MCS Marketplace" }),
    ...SCOPES.map((s) =>
      el(
        "button",
        {
          className: "nav-btn",
          type: "button",
          "aria-current": scope === s.id ? "true" : "false",
          onClick: () => {
            scope = s.id;
            persist();
            runSearch();
          },
        },
        [s.label],
      ),
    ),
    el("div", { className: "session" }, [
      authenticated
        ? `Sessão: ${provider ?? "token"}`
        : "Convidado (público)",
      el("div", {}, [
        el(
          "button",
          {
            className: "btn secondary",
            type: "button",
            style: "margin-top:8px",
            onClick: () => post({ type: "refreshSession" }),
          },
          ["Atualizar sessão"],
        ),
      ]),
    ]),
  ]);

  const results = el("section", { className: "results", "aria-label": "Resultados" }, [
    el("div", { className: "toolbar" }, [
      el("input", {
        type: "search",
        placeholder: "Buscar skills, profiles, coleções…",
        value: query,
        "aria-label": "Busca",
        onInput: (event: Event) => {
          query = (event.target as HTMLInputElement).value;
          persist();
        },
        onKeydown: (event: KeyboardEvent) => {
          if (event.key === "Enter") runSearch();
        },
      }),
      el(
        "button",
        {
          className: "btn",
          type: "button",
          disabled: loading || installing,
          onClick: () => runSearch(),
        },
        [loading ? "…" : "Buscar"],
      ),
    ]),
    el("div", { className: "status", text: status }),
    error
      ? el("div", { className: "error", role: "alert", text: error })
      : null,
    items.length === 0 && !loading && !error
      ? el("div", {
          className: "empty",
          text: "Nenhum resultado. Ajuste o filtro ou a busca.",
        })
      : el(
          "div",
          { className: "list", role: "list" },
          items.map((entry) => {
            const selected = inCart(entry.key);
            return el(
              "article",
              {
                className: `card${selected ? " selected" : ""}`,
                role: "listitem",
              },
              [
                el("input", {
                  type: "checkbox",
                  checked: selected,
                  "aria-label": `Selecionar ${entry.name}`,
                  onChange: () => toggleCart(entry),
                }),
                el("div", {}, [
                  el("h3", { text: entry.name }),
                  el("p", {
                    text:
                      entry.kind === "item"
                        ? entry.description || entry.externalId
                        : entry.kind === "profile"
                          ? entry.description || `${entry.username}/${entry.slug}`
                          : entry.description || entry.type,
                  }),
                  el("div", { className: "meta" }, [
                    el("span", {
                      className: "badge",
                      text: entry.kind,
                    }),
                    entry.kind === "item"
                      ? el("span", {
                          className: "badge",
                          text: `${entry.type} · ${entry.source}`,
                        })
                      : null,
                    entry.kind === "profile"
                      ? el("span", {
                          className: "badge",
                          text: `${entry.username}/${entry.slug}`,
                        })
                      : null,
                    entry.kind === "collection"
                      ? el("span", {
                          className: "badge",
                          text: entry.type,
                        })
                      : null,
                  ].filter(Boolean) as Node[]),
                ]),
                el(
                  "button",
                  {
                    className: "btn secondary",
                    type: "button",
                    onClick: () => toggleCart(entry),
                  },
                  [selected ? "Remover" : "Add"],
                ),
              ],
            );
          }),
        ),
  ].filter(Boolean) as Node[]);

  const side = el("aside", { className: "side", "aria-label": "Carrinho" }, [
    el("h2", { text: `Selecionados (${cart.length})` }),
    el(
      "div",
      { className: "cart-list" },
      cart.length === 0
        ? [
            el("div", {
              className: "empty",
              text: "Marque itens, profiles ou coleções para instalar em lote.",
            }),
          ]
        : cart.map((entry) =>
            el("div", { className: "cart-item" }, [
              el("span", {
                text:
                  entry.kind === "item"
                    ? `${entry.type}: ${entry.name}`
                    : entry.kind === "profile"
                      ? `profile: ${entry.name}`
                      : `collection: ${entry.name}`,
              }),
              el(
                "button",
                {
                  type: "button",
                  "aria-label": `Remover ${entry.name}`,
                  onClick: () => toggleCart(entry),
                },
                ["✕"],
              ),
            ]),
          ),
    ),
    (() => {
      const select = el(
        "select",
        {
          "aria-label": "IDE target",
          onChange: (event: Event) => {
            ideTarget = (event.target as HTMLSelectElement)
              .value as WebviewState["ideTarget"];
            persist();
          },
        },
        ["auto", "cursor", "vscode", "both"].map((value) => {
          const option = el("option", { value, text: value });
          if (value === ideTarget) option.selected = true;
          return option;
        }),
      );
      return el("label", { className: "field" }, ["IDE target", select]);
    })(),
    el("label", { className: "check" }, [
      el("input", {
        type: "checkbox",
        checked: force,
        onChange: (event: Event) => {
          force = (event.target as HTMLInputElement).checked;
          persist();
        },
      }),
      "Sobrescrever conteúdo diferente (--force)",
    ]),
    el(
      "button",
      {
        className: "btn",
        type: "button",
        disabled: cart.length === 0 || installing,
        onClick: () => {
          installing = true;
          status = "Instalando…";
          render();
          post({
            type: "installBatch",
            entries: cart,
            ideTarget,
            force,
          });
        },
      },
      [installing ? "Instalando…" : "Instalar selecionados"],
    ),
  ]);

  root.append(
    el("div", { className: "app" }, [nav, results, side]),
  );
}

window.addEventListener("message", (event: MessageEvent<HostToWebviewMessage>) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object") return;

  switch (msg.type) {
    case "bootstrap":
      authenticated = msg.authenticated;
      provider = msg.provider;
      if (msg.focusQuery) {
        const input = document.querySelector<HTMLInputElement>('input[type="search"]');
        input?.focus();
      }
      status = `API: ${msg.apiUrl}`;
      render();
      runSearch();
      break;
    case "session":
      authenticated = msg.authenticated;
      provider = msg.provider;
      render();
      break;
    case "searchResult":
      loading = false;
      error = "";
      scope = msg.scope;
      query = msg.query;
      items = [...msg.items, ...msg.profiles, ...msg.collections];
      status = `${items.length} resultado(s)`;
      persist();
      render();
      break;
    case "installProgress":
      status = `Instalando ${msg.current}/${msg.total}: ${msg.label}`;
      render();
      break;
    case "installComplete": {
      installing = false;
      const ok = msg.results.filter((r) => r.ok).length;
      const fail = msg.results.length - ok;
      status = `Concluído: ${ok} ok, ${fail} falha(s)`;
      if (fail === 0) cart = [];
      persist();
      render();
      break;
    }
    case "error":
      loading = false;
      installing = false;
      error = msg.message;
      status = "Erro";
      render();
      break;
  }
});

render();
post({ type: "ready" });
