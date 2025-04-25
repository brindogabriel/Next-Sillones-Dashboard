"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order } from "./columns";
import type { SofaModel } from "../sofas/columns";
import { Trash } from "lucide-react";

const orderItemSchema = z.object({
  id: z.string().optional(),
  sofa_id: z.string({
    required_error: "Selecciona un modelo de sillón",
  }),
  quantity: z.coerce.number().int().positive({
    message: "La cantidad debe ser un número entero positivo",
  }),
  unit_price: z.coerce.number().positive({
    message: "El precio unitario debe ser un número positivo",
  }),
  total_price: z.coerce.number().positive({
    message: "El precio total debe ser un número positivo",
  }),
});

const formSchema = z.object({
  customer_name: z.string().min(2, {
    message: "El nombre del cliente debe tener al menos 2 caracteres.",
  }),
  customer_phone: z.string().optional(),
  customer_email: z
    .string()
    .email({
      message: "Ingresa un correo electrónico válido.",
    })
    .optional(),
  customer_location: z.string().optional(),
  customer_address: z.string().optional(),
  status: z.string({
    required_error: "Selecciona un estado para el pedido",
  }),
  delivery_date: z.string().optional(),
  payment_method: z.string({
    required_error: "Selecciona un método de pago",
  }),
  shipping_cost: z.coerce
    .number()
    .min(0, {
      message: "El costo de envío debe ser un número positivo o cero",
    })
    .default(0),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, {
    message: "Debes agregar al menos un modelo de sillón al pedido",
  }),
});

interface OrderItem {
  id: string;
  order_id: string;
  sofa_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface EditOrderDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOrderDialog({
  order,
  open,
  onOpenChange,
}: EditOrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sofaModels, setSofaModels] = useState<SofaModel[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const router = useRouter();

  const formSchema = z.object({
    customer_name: z.string().min(2),
    customer_phone: z.string().optional(),
    customer_email: z.string().email().optional(),
    customer_location: z.string().optional(),
    customer_address: z.string().optional(),
    status: z.string(),
    delivery_date: z.string().optional(),
    payment_method: z.string(),
    shipping_cost: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).min(1),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || "",
      customer_email: order.customer_email || "",
      customer_location: order.customer_location || "",
      customer_address: order.customer_address || "",
      status: order.status,
      delivery_date: order.delivery_date || "",
      payment_method: order.payment_method || "efectivo",
      shipping_cost: order.shipping_cost || 0,
      notes: order.notes || "",
      items: [],
    },
  });

  useEffect(() => {
    if (open) {
      fetchSofaModels();
      fetchOrderItems();
    }
  }, [open, order.id]);

  useEffect(() => {
    if (orderItems.length > 0) {
      form.reset({
        customer_name: order.customer_name,
        customer_phone: order.customer_phone || "",
        customer_email: order.customer_email || "",
        customer_location: order.customer_location || "",
        customer_address: order.customer_address || "",
        status: order.status,
        delivery_date: order.delivery_date || "",
        payment_method: order.payment_method || "efectivo",
        shipping_cost: order.shipping_cost || 0,
        notes: order.notes || "",
        items: orderItems.map((item) => ({
          id: item.id,
          sofa_id: item.sofa_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
      });
    }
  }, [order, form, orderItems]);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const totalAmount =
        values.items.reduce((sum, item) => sum + item.total_price, 0) +
        values.shipping_cost;

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          customer_name: values.customer_name,
          customer_phone: values.customer_phone || null,
          customer_email: values.customer_email || null,
          customer_location: values.customer_location || null,
          customer_address: values.customer_address || null,
          status: values.status,
          delivery_date: values.delivery_date || null,
          payment_method: values.payment_method,
          shipping_cost: values.shipping_cost,
          total_amount: totalAmount,
          notes: values.notes || null,
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      const { error: deleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", order.id);

      if (deleteError) throw deleteError;

      const orderItems = values.items.map((item) => ({
        order_id: order.id,
        sofa_id: item.sofa_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Pedido actualizado",
        description: "El pedido ha sido actualizado exitosamente.",
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Hubo un error al actualizar el pedido.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Editar Pedido</DialogTitle>
          <DialogDescription>
            Modifica los detalles del pedido y los sillones asociados.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-1 max-h-[70vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Resto del formulario */}
              <FormField
                control={form.control}
                name="shipping_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo de Envío</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => {
                          const value =
                            e.target.value === "" ? 0 : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Botón de Guardar */}
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
