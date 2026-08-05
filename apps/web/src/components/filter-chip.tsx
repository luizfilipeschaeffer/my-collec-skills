import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function FilterChip({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active?: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Button
      asChild
      size="sm"
      variant={active ? "default" : "outline"}
      className={cn(
        "transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-out",
        "hover:-translate-y-0.5 hover:shadow-sm",
        "active:scale-[0.96] active:translate-y-0",
        active && "shadow-sm",
      )}
    >
      <Link href={href} aria-current={active ? "page" : undefined}>
        {Icon ? <Icon data-icon="inline-start" /> : null}
        {children}
      </Link>
    </Button>
  );
}

export function buildFilterHref(
  basePath: string,
  current: URLSearchParams,
  patch: Record<string, string | null>,
) {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (!value) params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
