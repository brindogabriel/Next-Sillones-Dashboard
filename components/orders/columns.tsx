"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash, FileText } from "lucide-react";
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
import { EditOrderDialog } from "./edit-order-dialog";
import { DeleteOrderDialog } from "./delete-order-dialog";
import { ViewOrderDetailsDialog } from "./view-order-details-dialog";
import { Badge } from "@/components/ui/badge";

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_location: string | null;
  customer_address: string | null;
  status: string;
  delivery_date: string | null;
  total_amount: number;
  shipping_cost: number | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "customer_name",
    header: "Cliente",
  },
  {
    accessorKey: "customer_location",
    header: "Localidad",
    cell: ({ row }) => {
      const location = row.getValue("customer_location") as string | null;
      return location || "No especificada";
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;

      const statusMap: Record<
        string,
        {
          label: string;
          variant:
            | "default"
            | "outline"
            | "secondary"
            | "destructive"
            | "success";
        }
      > = {
        pending: { label: "Pendiente", variant: "outline" },
        in_progress: { label: "En Progreso", variant: "secondary" },
        completed: { label: "Completado", variant: "default" },
        cancelled: { label: "Cancelado", variant: "destructive" },
        delivered: { label: "Entregado", variant: "success" },
        stock: { label: "En Stock", variant: "outline" },
      };

      const { label, variant } = statusMap[status] || {
        label: status,
        variant: "outline",
      };

      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    accessorKey: "payment_method",
    header: "Método de Pago",
    cell: ({ row }) => {
      const method = row.getValue("payment_method") as string | null;
      return method || "No especificado";
    },
  },
  {
    accessorKey: "total_amount",
    header: "Total",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("total_amount"));
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(amount);
      return formatted;
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) => {
      return new Date(row.getValue("created_at")).toLocaleDateString("es-AR");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;
      const [showEditDialog, setShowEditDialog] = useState(false);
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);
      const [showDetailsDialog, setShowDetailsDialog] = useState(false);

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
              <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>
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
            <EditOrderDialog
              order={order}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
            />
          )}

          {showDeleteDialog && (
            <DeleteOrderDialog
              order={order}
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            />
          )}

          {showDetailsDialog && (
            <ViewOrderDetailsDialog
              order={order}
              open={showDetailsDialog}
              onOpenChange={setShowDetailsDialog}
            />
          )}
        </>
      );
    },
  },
];
