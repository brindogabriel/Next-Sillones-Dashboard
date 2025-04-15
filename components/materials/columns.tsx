"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { EditMaterialDialog } from "./edit-material-dialog"
import { DeleteMaterialDialog } from "./delete-material-dialog"

export type Material = {
  id: string
  name: string
  type: string
  cost: number
  unit: string
}

export const columns: ColumnDef<Material>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "type",
    header: "Tipo",
  },
  {
    accessorKey: "cost",
    header: "Costo",
    cell: ({ row }) => {
      const cost = Number.parseFloat(row.getValue("cost"))
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(cost)
      return formatted
    },
  },
  {
    accessorKey: "unit",
    header: "Unidad",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const material = row.original
      const [showEditDialog, setShowEditDialog] = useState(false)
      const [showDeleteDialog, setShowDeleteDialog] = useState(false)

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                <Trash className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {showEditDialog && (
            <EditMaterialDialog material={material} open={showEditDialog} onOpenChange={setShowEditDialog} />
          )}

          {showDeleteDialog && (
            <DeleteMaterialDialog material={material} open={showDeleteDialog} onOpenChange={setShowDeleteDialog} />
          )}
        </>
      )
    },
  },
]
