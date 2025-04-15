"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { AddMaterialDialog } from "./add-material-dialog"

export function AddMaterialButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Agregar Material
      </Button>
      <AddMaterialDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
