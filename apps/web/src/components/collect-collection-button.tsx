"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, PackagePlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type ProfileOption = {
  id: string;
  name: string;
  slug: string;
  collections?: Array<{ collectionId: string }>;
};

export function CollectCollectionButton({
  collectionId,
  size = "default",
}: {
  collectionId: string;
  size?: "default" | "sm" | "lg";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profiles, setProfiles] = useState<ProfileOption[] | null>(null);
  const [sessionState, setSessionState] = useState<"unknown" | "guest" | "user">(
    "unknown",
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [collected, setCollected] = useState(false);

  const buildHref = `/build?collectCollection=${encodeURIComponent(collectionId)}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/c/${collectionId}`)}`;

  async function openDialog() {
    setOpen(true);
    if (profiles) return;
    setLoading(true);
    try {
      const response = await fetch("/api/profiles");
      if (response.status === 401) {
        setSessionState("guest");
        setProfiles([]);
        return;
      }
      const payload = (await response.json()) as { profiles?: ProfileOption[] };
      const nextProfiles = payload.profiles ?? [];
      setSessionState("user");
      setProfiles(nextProfiles);
      const available = nextProfiles.filter(
        (profile) =>
          !profile.collections?.some((item) => item.collectionId === collectionId),
      );
      setCollected(nextProfiles.length > 0 && available.length === 0);
      setSelectedProfileId((available[0] ?? nextProfiles[0])?.id ?? "");
    } catch {
      toast.error("Não foi possível carregar seus profiles.");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  async function collect() {
    if (!selectedProfileId) {
      toast.error("Escolha um profile.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/collect`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId: selectedProfileId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(payload.error ?? "Não foi possível colecionar.");
        return;
      }
      const nextProfiles = (profiles ?? []).map((profile) =>
        profile.id === selectedProfileId
          ? {
              ...profile,
              collections: [...(profile.collections ?? []), { collectionId }],
            }
          : profile,
      );
      setProfiles(nextProfiles);
      setCollected(
        nextProfiles.length > 0 &&
          nextProfiles.every((profile) =>
            profile.collections?.some((item) => item.collectionId === collectionId),
          ),
      );
      setOpen(false);
      toast.success("Coleção adicionada ao seu profile.");
    } catch {
      toast.error("Não foi possível colecionar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (collected) {
    return (
      <Button type="button" variant="outline" size={size} disabled>
        <Check className="size-4" /> Já colecionado
      </Button>
    );
  }

  const loggedOut = !loading && sessionState === "guest";
  const noProfiles =
    !loading && sessionState === "user" && (profiles?.length ?? 0) === 0;

  return (
    <>
      <Button type="button" size={size} onClick={() => void openDialog()}>
        <PackagePlus className="size-4" /> Colecionar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Colecionar neste profile</DialogTitle>
            <DialogDescription>
              Anexa a coleção original ao seu profile, sem copiar os itens.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando profiles…</p>
          ) : loggedOut ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Entre para colecionar esta coleção em um dos seus profiles.</p>
              <Button asChild>
                <Link href={loginHref}>Entrar</Link>
              </Button>
            </div>
          ) : noProfiles ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Você ainda não tem um profile. Monte um rascunho e esta coleção
                será anexada ao criar.
              </p>
              <Button asChild>
                <Link href={buildHref}>Montar profile</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="collect-profile">Profile</Label>
              <Select
                value={selectedProfileId}
                onValueChange={setSelectedProfileId}
              >
                <SelectTrigger id="collect-profile" className="w-full">
                  <SelectValue placeholder="Escolha um profile" />
                </SelectTrigger>
                <SelectContent>
                  {(profiles ?? []).map((profile) => {
                    const already = profile.collections?.some(
                      (item) => item.collectionId === collectionId,
                    );
                    return (
                      <SelectItem key={profile.id} value={profile.id}>
                        {already
                          ? `${profile.name} · Na sua coleção`
                          : profile.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {!loading && profiles && profiles.length > 0 ? (
            <DialogFooter>
              <Button
                type="button"
                onClick={() => void collect()}
                disabled={submitting || !selectedProfileId}
              >
                {submitting ? "Colecionando…" : "Colecionar"}
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
