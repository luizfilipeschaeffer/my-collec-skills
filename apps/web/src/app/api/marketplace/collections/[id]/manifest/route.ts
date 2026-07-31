import { authenticateBearer } from "@/lib/api-token";
import { resolveCollectionManifest } from "@/lib/marketplace";
import { parseProfileManifest } from "my-collec-skills-manifest";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  const user = await authenticateBearer(request);
  const manifest = await resolveCollectionManifest(id, user?.id);

  if (!manifest) {
    return Response.json(
      { error: "Coleção não encontrada ou inacessível." },
      { status: 404 },
    );
  }

  return Response.json(parseProfileManifest(manifest), {
    headers: {
      "cache-control": "private, max-age=30",
    },
  });
}
