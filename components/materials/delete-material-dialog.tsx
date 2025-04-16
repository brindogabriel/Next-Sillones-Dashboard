"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import type { Material } from "./columns"

interface DeleteMaterialDialogProps {
  material: Material
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteMaterialDialog({ material, open, onOpenChange }: DeleteMaterialDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function onDelete() {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("materials")
        .delete()
        .eq("id", material.id)

      if (error) throw error

      toast({
        title: "Material eliminado",
        description: "El material ha sido eliminado exitosamente.",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting material:", error)
      toast({
        title: "Error",
        description: "Hubo un error al eliminar el material.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eliminar Material</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar este material? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={isLoading}>
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
