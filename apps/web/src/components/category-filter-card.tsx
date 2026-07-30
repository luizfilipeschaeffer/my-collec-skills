import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Link from "next/link";

export function CategoryFilterCard({
  href,
  name,
  description,
  count,
  active,
}: {
  href: string;
  name: string;
  description: string;
  count: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-28 flex-col justify-between gap-4 rounded-xl border bg-card p-4",
        "transition-[background-color,border-color,box-shadow] duration-150",
        "hover:border-foreground/20 hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active && "border-primary bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-base font-medium leading-snug">{name}</span>
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
      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}
