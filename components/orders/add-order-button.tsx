"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { AddOrderDialog } from "./add-order-dialog"

export function AddOrderButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Registrar Pedido
      </Button>
      <AddOrderDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
