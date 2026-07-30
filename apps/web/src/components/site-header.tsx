import { auth, signOut } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Boxes,
  FolderOpen,
  LayoutDashboard,
  Library,
  LogIn,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

function initials(name?: string | null, username?: string | null) {
  const source = (name?.trim() || username?.trim() || "?").replace(/^@/, "");
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const displayName = user?.name?.trim() || user?.username || "Usuário";

  return (
    <header className="border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </span>
          My Collec Skills
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/profiles">
              <Users className="size-4" />
              Profiles
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/collections">
              <FolderOpen className="size-4" />
              Coleções
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/catalog">
              <Library className="size-4" />
              Catálogo
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/build">
              <Sparkles className="size-4" />
              Montar profile
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          </Button>
          {user ? (
            <div className="ml-1 flex items-center gap-2 border-l pl-3 sm:gap-3">
              <Link
                href="/dashboard"
                className="flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar size="default">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={displayName} />
                  ) : null}
                  <AvatarFallback>
                    {initials(user.name, user.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden min-w-0 flex-col leading-tight sm:flex">
                  <span className="truncate text-sm font-medium">{displayName}</span>
                  {user.username ? (
                    <span className="truncate text-xs text-muted-foreground">
                      @{user.username}
                    </span>
                  ) : null}
                </span>
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  Sair
                </Button>
              </form>
            </div>
          ) : (
            <Button asChild>
              <Link href="/login">
                <LogIn className="size-4" />
                Entrar
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
