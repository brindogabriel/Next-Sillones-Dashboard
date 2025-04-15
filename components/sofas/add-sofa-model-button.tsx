"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { AddSofaModelDialog } from "./add-sofa-model-dialog"

export function AddSofaModelButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Agregar Modelo
      </Button>
      <AddSofaModelDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
