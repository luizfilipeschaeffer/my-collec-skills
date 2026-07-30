import { authenticateBearer } from "@/lib/api-token";
import { resolveProfileManifest } from "@/lib/profile-manifest";
import { parseProfileManifest } from "my-collec-skills-manifest";

type Context = { params: Promise<{ username: string; slug: string }> };

export async function GET(request: Request, { params }: Context) {
  const { username, slug } = await params;
  const tokenUser = await authenticateBearer(request);
  const manifest = await resolveProfileManifest(username, slug, tokenUser?.id);

  if (!manifest) {
    return Response.json({ error: "Profile público não encontrado." }, { status: 404 });
  }

  return Response.json(parseProfileManifest(manifest), {
    headers: {
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
