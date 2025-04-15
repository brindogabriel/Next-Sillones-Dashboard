"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { EditSofaModelDialog } from "./edit-sofa-model-dialog";
import { DeleteSofaModelDialog } from "./delete-sofa-model-dialog";

export type SofaModel = {
  id: string;
  name: string;
  description: string;
  profit_percentage: number;
  base_price: number;
  final_price: number;
};

export const columns: ColumnDef<SofaModel>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return description || "---";
    },
  },
  {
    accessorKey: "profit_percentage",
    header: "% Ganancia",
    cell: ({ row }) => {
      const percentage = row.getValue("profit_percentage") as number;
      return `${percentage}%`;
    },
  },
  {
    accessorKey: "base_price",
    header: "Precio Base",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("base_price"));
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(amount);
      return formatted;
    },
  },
  {
    accessorKey: "final_price",
    header: "Precio Final",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("final_price"));
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(amount);
      return formatted;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sofaModel = row.original;
      const [showEditDialog, setShowEditDialog] = useState(false);
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
            <EditSofaModelDialog
              sofaModel={sofaModel}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
            />
          )}

          {showDeleteDialog && (
            <DeleteSofaModelDialog
              sofaModel={sofaModel}
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            />
          )}
        </>
      );
    },
  },
];
