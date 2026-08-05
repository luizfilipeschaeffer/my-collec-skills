import { Badge } from "@/components/ui/badge";
import { getTaxonomyIcon } from "@/lib/taxonomy-icons";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Link from "next/link";

export function CategoryFilterCard({
  href,
  name,
  description,
  count,
  active,
  slug,
}: {
  href: string;
  name: string;
  description: string;
  count: number;
  active?: boolean;
  slug?: string;
}) {
  const Icon = getTaxonomyIcon(slug ?? (active ? "all" : name));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-28 flex-col justify-between gap-4 overflow-hidden rounded-xl border bg-card p-4",
        "transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out",
        "hover:-translate-y-1 hover:border-foreground/20 hover:bg-accent/40 hover:shadow-md",
        "active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active && "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20",
      )}
    >
      <Icon
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -bottom-4 size-24 text-foreground/10 transition-[transform,opacity,color] duration-150 ease-out group-hover:scale-110 group-hover:text-foreground/20"
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <span className="flex items-start gap-2 text-base font-medium leading-snug">
          <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {name}
        </span>
        {active ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" aria-hidden="true" />
          </span>
        ) : (
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {count}
          </Badge>
        )}
      </div>
      <p className="relative z-10 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}
