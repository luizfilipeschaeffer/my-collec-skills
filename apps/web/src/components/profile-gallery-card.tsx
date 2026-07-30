import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { profileItemCount } from "@/lib/public-gallery";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type ProfileCardData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  owner: { username: string };
  _count: {
    collections: number;
    skills: number;
    agents: number;
    mcps: number;
    docs?: number;
    extensions?: number;
  };
};

export function ProfileGalleryCard({ profile }: { profile: ProfileCardData }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardDescription>@{profile.owner.username}</CardDescription>
        <CardTitle className="line-clamp-1">{profile.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {profile.description || "Profile MCS compartilhado."}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {profile._count.collections > 0 && (
            <Badge variant="secondary">
              {profile._count.collections} coleções
            </Badge>
          )}
          {profile._count.skills > 0 && (
            <Badge variant="outline">{profile._count.skills} skills</Badge>
          )}
          {profile._count.agents > 0 && (
            <Badge variant="outline">{profile._count.agents} agents</Badge>
          )}
          {profile._count.mcps > 0 && (
            <Badge variant="outline">{profile._count.mcps} mcps</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          {profileItemCount(profile._count)} itens
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/u/${profile.owner.username}/${profile.slug}`}>
            Abrir <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
