import { signIn } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

function safeRedirect(callbackUrl?: string) {
  if (!callbackUrl?.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/dashboard";
  }
  return callbackUrl;
}

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const redirectTo = safeRedirect(callbackUrl);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>Entrar no My Collec Skills</CardTitle>
            <CardDescription>
              Use sua conta de desenvolvimento. Não armazenamos senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo });
              }}
            >
              <Button type="submit" className="w-full">
                Continuar com GitHub
              </Button>
            </form>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">ou</span>
              <Separator className="flex-1" />
            </div>
            <form
              action={async () => {
                "use server";
                await signIn("gitlab", { redirectTo });
              }}
            >
              <Button type="submit" variant="outline" className="w-full">
                Continuar com GitLab
              </Button>
            </form>
            {process.env.MCS_DEMO_MODE === "true" &&
              process.env.NODE_ENV !== "production" && (
                <p className="text-center text-xs text-muted-foreground">
                  Modo demo local ativo: o dashboard usa o usuário seed{" "}
                  <strong>demo</strong> sem OAuth.
                </p>
              )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
