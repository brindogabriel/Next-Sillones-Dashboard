"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import type { Order } from "./columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ViewOrderDetailsDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderItem {
  id: string;
  sofa_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function ViewOrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: ViewOrderDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (open) {
      fetchOrderItems();
    }
  }, [open, order.id]);

  async function fetchOrderItems() {
    setIsLoading(true);
    try {
      // Primero traemos los items del pedido
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from("order_items")
        .select("id, quantity, unit_price, total_price, sofa_id")
        .eq("order_id", order.id);

      if (orderItemsError) throw orderItemsError;

      // Para cada ítem, obtenemos el nombre del sofá
      const itemsWithSofaNames = await Promise.all(
        orderItemsData.map(async (item) => {
          let sofaName = "Sin nombre";

          // Obtenemos el nombre del sofá
          const { data: sofaData, error: sofaError } = await supabase
            .from("sofa_models")
            .select("name")
            .eq("id", item.sofa_id)
            .single();

          if (!sofaError && sofaData) {
            sofaName = sofaData.name;
          }

          return {
            id: item.id,
            sofa_name: sofaName,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          };
        })
      );

      setOrderItems(itemsWithSofaNames);
    } catch (error) {
      console.error("Error fetching order items:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const statusMap: Record<
    string,
    {
      label: string;
      variant: "default" | "outline" | "secondary" | "destructive";
    }
  > = {
    pending: { label: "Pendiente", variant: "outline" },
    in_progress: { label: "En Progreso", variant: "secondary" },
    completed: { label: "Completado", variant: "default" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  };

  const { label: statusLabel, variant: statusVariant } = statusMap[
    order.status
  ] || {
    label: order.status,
    variant: "outline",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Detalles del Pedido</DialogTitle>
          <DialogDescription>
            Información completa del pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Cliente
              </h3>
              <p className="text-base">{order.customer_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Estado
              </h3>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
            {order.customer_phone && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Teléfono
                </h3>
                <p className="text-base">{order.customer_phone}</p>
              </div>
            )}
            {order.customer_email && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Email
                </h3>
                <p className="text-base">{order.customer_email}</p>
              </div>
            )}
            {order.customer_location && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Localidad
                </h3>
                <p className="text-base">{order.customer_location}</p>
              </div>
            )}
            {order.customer_address && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Dirección
                </h3>
                <p className="text-base">{order.customer_address}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Fecha de Creación
              </h3>
              <p className="text-base">
                {new Date(order.created_at).toLocaleDateString("es-AR")}
              </p>
            </div>
            {order.delivery_date && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Fecha Máxima de Entrega
                </h3>
                <p className="text-base">
                  {new Date(order.delivery_date).toLocaleDateString("es-AR")}
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Método de Pago
              </h3>
              <p className="text-base">
                {order.payment_method
                  ? order.payment_method === "efectivo"
                    ? "Efectivo"
                    : order.payment_method === "transferencia"
                    ? "Transferencia"
                    : order.payment_method === "tarjeta"
                    ? "Tarjeta"
                    : order.payment_method
                  : "No especificado"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Total
              </h3>
              <p className="text-base font-bold">
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                }).format(order.total_amount)}
              </p>
            </div>
          </div>

          {order.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Notas
              </h3>
              <p className="text-base">{order.notes}</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium mb-2">Modelos de Sillones</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Precio Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Cargando detalles...
                      </TableCell>
                    </TableRow>
                  ) : orderItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No hay modelos asociados a este pedido
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.sofa_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: "ARS",
                          }).format(item.unit_price)}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: "ARS",
                          }).format(item.total_price)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
