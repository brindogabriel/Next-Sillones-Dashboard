"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { SofaModel } from "./columns";

interface DeleteSofaModelDialogProps {
  sofaModel: SofaModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSofaModelDialog({
  sofaModel,
  open,
  onOpenChange,
}: DeleteSofaModelDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onDelete() {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("sofa_models")
        .delete()
        .eq("id", sofaModel.id);

      if (error) throw error;

      toast({
        title: "Modelo eliminado",
        description: "El modelo de sillón ha sido eliminado exitosamente.",
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting sofa model:", error);
      toast({
        title: "Error",
        description: "Hubo un error al eliminar el modelo de sillón.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eliminar Modelo de Sillón</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar este modelo de sillón? Esta
            acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={isLoading}>
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
