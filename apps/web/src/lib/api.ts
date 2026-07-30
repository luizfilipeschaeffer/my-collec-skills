import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json(
      { error: "Dados inválidos.", issues: error.flatten() },
      { status: 400 },
    );
  }

  console.error(error);
  return Response.json(
    { error: error instanceof Error ? error.message : "Erro interno." },
    { status: 500 },
  );
}

export function unauthorized() {
  return Response.json({ error: "Não autenticado." }, { status: 401 });
}

export function notFound(resource = "Recurso") {
  return Response.json({ error: `${resource} não encontrado.` }, { status: 404 });
}
