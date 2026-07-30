"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyInstallButton({ command }: { command: string }) {
  return (
    <Button
      onClick={async () => {
        await navigator.clipboard.writeText(command);
        toast.success("Comando copiado.");
      }}
    >
      <Copy className="size-4" />
      Copiar comando
    </Button>
  );
}
