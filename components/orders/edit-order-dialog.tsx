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

  const form = useForm<z.infer<typeof formSchema>>({
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
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

  async function fetchSofaModels() {
    try {
      const { data, error } = await supabase
        .from("sofa_models")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      setSofaModels(data || []);
    } catch (error) {
      console.error("Error fetching sofa models:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los modelos de sillones.",
        variant: "destructive",
      });
    }
  }

  async function fetchOrderItems() {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error("Error fetching order items:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del pedido.",
        variant: "destructive",
      });
    }
  }

  const updateItemPrices = (
    index: number,
    sofaId: string,
    quantity: number
  ) => {
    const sofaModel = sofaModels.find((model) => model.id === sofaId);
    if (sofaModel) {
      const unitPrice = sofaModel.final_price;
      const totalPrice = unitPrice * quantity;
      form.setValue(`items.${index}.unit_price`, unitPrice);
      form.setValue(`items.${index}.total_price`, totalPrice);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
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
              {/* Cliente */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Cliente</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customer_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localidad</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customer_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="in_progress">
                            En Progreso
                          </SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                          <SelectItem value="delivered">Entregado</SelectItem>
                          <SelectItem value="stock">En Stock</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="delivery_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Máxima de Entrega</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un método de pago" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="transferencia">
                            Transferencia
                          </SelectItem>
                          <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Costo de Envío */}
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
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notas */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Items del Pedido */}
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Modelos de Sillones
                </h3>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex flex-col gap-4 p-4 border rounded-md"
                    >
                      <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.sofa_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modelo</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  updateItemPrices(
                                    index,
                                    value,
                                    form.getValues(`items.${index}.quantity`)
                                  );
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un modelo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {sofaModels.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                      {model.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cantidad</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    updateItemPrices(
                                      index,
                                      form.getValues(`items.${index}.sofa_id`),
                                      Number.parseInt(e.target.value)
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Precio Unitario</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  readOnly
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.total_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Precio Total</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  readOnly
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-end">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => remove(index)}
                              className="ml-auto"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        sofa_id: "",
                        quantity: 1,
                        unit_price: 0,
                        total_price: 0,
                      })
                    }
                  >
                    Agregar Modelo
                  </Button>
                </div>
              </div>

              {/* Resumen del Pedido */}
              <div className="text-right mt-4 space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Subtotal Productos:
                  </p>
                  <p className="text-base font-medium">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 2,
                    }).format(
                      form
                        .watch("items")
                        .reduce((sum, item) => sum + item.total_price, 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Costo de Envío:
                  </p>
                  <p className="text-base font-medium">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 2,
                    }).format(form.watch("shipping_cost") || 0)}
                  </p>
                </div>
                <div className="border-t pt-2 mt-2">
                  <h3 className="text-lg font-medium">
                    Precio Total del Pedido
                  </h3>
                  <p className="text-xl font-bold">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 2,
                    }).format(
                      form
                        .watch("items")
                        .reduce((sum, item) => sum + item.total_price, 0) +
                        (form.watch("shipping_cost") || 0)
                    )}
                  </p>
                </div>
              </div>

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
