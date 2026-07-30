import {
  extractSkillSummary,
  getSkillsShAudit,
  getSkillsShDetail,
  skillsShHasOidc,
} from "@/lib/skills-sh";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string[] }> },
) {
  const { id: segments } = await context.params;
  const skillId = segments?.map(decodeURIComponent).join("/") ?? "";

  if (!skillId || skillId.split("/").length < 2) {
    return Response.json(
      { error: "invalid_id", message: "Informe source/slug da skill." },
      { status: 400 },
    );
  }

  if (!(await skillsShHasOidc())) {
    return Response.json(
      {
        error: "oidc_required",
        message:
          "API v1 do skills.sh exige Vercel OIDC. Configure vercel link + env pull, ou habilite OIDC Federation no projeto.",
        available: false,
      },
      { status: 503 },
    );
  }

  const [detail, audit] = await Promise.all([
    getSkillsShDetail(skillId),
    getSkillsShAudit(skillId),
  ]);

  if (!detail) {
    return Response.json(
      { error: "not_found", message: "Skill não encontrada no skills.sh." },
      { status: 404 },
    );
  }

  const skillMd = detail.files?.find(
    (file) =>
      file.path === "SKILL.md" ||
      file.path.endsWith("/SKILL.md") ||
      file.path.toLowerCase() === "skill.md",
  );

  return Response.json({
    available: true,
    detail,
    audit,
    summary: extractSkillSummary(skillMd?.contents),
    skillMarkdown: skillMd?.contents ?? null,
    fileCount: detail.files?.length ?? 0,
  });
}
