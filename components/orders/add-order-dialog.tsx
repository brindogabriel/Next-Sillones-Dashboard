"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MultiSelect } from "./MultiSelect";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
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
import type { SofaModel } from "../sofas/columns";
import { Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Material {
  id: string;
  name: string;
  type: string;
  cost: number;
}

const orderItemSchema = z.object({
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
  selected_materials: z.array(z.string()),
});

const formSchema = z.object({
  customer_name: z.string().min(2, {
    message: "El nombre del cliente debe tener al menos 2 caracteres.",
  }),
  customer_phone: z.string().optional().or(z.literal("")),
  customer_email: z
    .string()
    .email({
      message: "Ingresa un correo electrónico válido.",
    })
    .optional()
    .or(z.literal("")),
  customer_location: z.string().optional().or(z.literal("")),
  customer_address: z.string().optional().or(z.literal("")),
  status: z.string({
    required_error: "Selecciona un estado para el pedido",
  }),
  delivery_date: z.string().optional().or(z.literal("")),
  payment_method: z.string({
    required_error: "Selecciona un método de pago",
  }),
  shipping_cost: z.number().min(0, {
    message: "El costo de envío debe ser un número positivo o cero",
  }),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, {
    message: "Debes agregar al menos un modelo de sillón al pedido",
  }),
});

interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddOrderDialog({ open, onOpenChange }: AddOrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sofaModels, setSofaModels] = useState<SofaModel[]>([]);
  const [materialsPorItem, setMaterialsPorItem] = useState<Material[][]>([]);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_location: "",
      customer_address: "",
      status: "pending",
      delivery_date: "",
      payment_method: "efectivo",
      shipping_cost: 0,
      notes: "",
      items: [
        {
          sofa_id: "",
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          selected_materials: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (open) {
      fetchSofaModels();
    }
  }, [open]);

  useEffect(() => {
    if (fields.length !== materialsPorItem.length) {
      setMaterialsPorItem((prev) => {
        const nuevo = [...prev];
        while (nuevo.length < fields.length) nuevo.push([]);
        while (nuevo.length > fields.length) nuevo.pop();
        return nuevo;
      });
    }
  }, [fields.length]);

  async function fetchSofaModels() {
    try {
      const { data, error } = await supabase
        .from("sofa_models")
        .select("*")
        .order("name", { ascending: false });

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

  async function fetchMaterialsBySofa(sofaId: string): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from("sofa_materials")
        .select(
          `
        material_id, 
        materials (
          name, 
          type, 
          cost
        )
      `
        )
        .eq("sofa_id", sofaId);

      if (error) throw error;

      if (!data) return [];

      // Type the response data explicitly
      type SofaMaterialResponse = {
        material_id: string;
        materials: {
          name: string;
          type?: string;
          cost?: number;
        } | null; // materials can be null if the relationship doesn't exist
      };

      const relatedMaterials = data.map((item: SofaMaterialResponse) => ({
        id: item.material_id,
        name: item.materials?.name || "Material desconocido",
        type: item.materials?.type || "Sin tipo",
        cost: item.materials?.cost || 0,
      }));

      return relatedMaterials;
    } catch (error) {
      console.error("Error fetching materials for sofa:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales del sillón.",
        variant: "destructive",
      });
      return [];
    }
  }
  const updateItemPrices = (
    index: number,
    sofaId: string,
    quantity: number,
    selectedMaterialIds: string[]
  ) => {
    const sofaModel = sofaModels.find((model) => model.id === sofaId);
    if (!sofaModel) return;

    const materials = materialsPorItem[index] || [];
    const materialCost = selectedMaterialIds
      .map((id) => materials.find((m) => m.id === id)?.cost || 0)
      .reduce((sum, cost) => sum + cost, 0);

    const unitPrice = sofaModel.final_price + materialCost;
    const totalPrice = unitPrice * quantity;

    form.setValue(`items.${index}.unit_price`, unitPrice);
    form.setValue(`items.${index}.total_price`, totalPrice);
  };

  const handleSofaChange = async (index: number, sofaId: string) => {
    const fetchedMaterials = await fetchMaterialsBySofa(sofaId);
    const materialIds = fetchedMaterials.map((m) => m.id);

    setMaterialsPorItem((prev) => {
      const nuevo = [...prev];
      nuevo[index] = fetchedMaterials;
      return nuevo;
    });

    form.setValue(`items.${index}.selected_materials`, materialIds, {
      shouldValidate: true,
    });

    updateItemPrices(
      index,
      sofaId,
      form.getValues(`items.${index}.quantity`),
      materialIds
    );
  };

  const handleQuantityChange = (index: number, value: number) => {
    const sofaId = form.getValues(`items.${index}.sofa_id`);
    const selectedMaterials = form.getValues(
      `items.${index}.selected_materials`
    );
    updateItemPrices(index, sofaId, value, selectedMaterials);
  };

  const toggleMaterial = (index: number, materialId: string) => {
    const currentMaterials = form.getValues(
      `items.${index}.selected_materials`
    );
    const newMaterials = currentMaterials.includes(materialId)
      ? currentMaterials.filter((id) => id !== materialId)
      : [...currentMaterials, materialId];

    form.setValue(`items.${index}.selected_materials`, newMaterials);
    updateItemPrices(
      index,
      form.getValues(`items.${index}.sofa_id`),
      form.getValues(`items.${index}.quantity`),
      newMaterials
    );
  };

  const toggleAllMaterials = (index: number) => {
    const currentMaterials = form.getValues(
      `items.${index}.selected_materials`
    );
    const allSelected =
      currentMaterials.length === materialsPorItem[index].length;
    const newMaterials = allSelected
      ? []
      : materialsPorItem[index].map((m) => m.id);

    form.setValue(`items.${index}.selected_materials`, newMaterials);

    updateItemPrices(
      index,
      form.getValues(`items.${index}.sofa_id`),
      form.getValues(`items.${index}.quantity`),
      newMaterials
    );
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const totalAmount =
        values.items.reduce((sum, item) => sum + item.total_price, 0) +
        values.shipping_cost;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
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
        .select("id")
        .single();

      if (orderError) throw orderError;

      const orderItems = values.items.map((item) => ({
        order_id: orderData.id,
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
        title: "Pedido registrado",
        description: "El pedido ha sido registrado exitosamente.",
      });

      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error adding order:", error);
      toast({
        title: "Error",
        description: "Hubo un error al registrar el pedido.",
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
          <DialogTitle>Registrar Pedido</DialogTitle>
          <DialogDescription>
            Ingresa los detalles del nuevo pedido.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez" {...field} />
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
                        <Input
                          placeholder="11-1234-5678"
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
                  name="customer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="cliente@ejemplo.com"
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
                  name="customer_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localidad</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Buenos Aires"
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
                  name="customer_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Av. Corrientes 1234"
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
              </div>

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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales sobre el pedido"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                                  handleSofaChange(index, value);
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
                                    const value = parseInt(e.target.value) || 1;
                                    field.onChange(value);
                                    handleQuantityChange(index, value);
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
                      <div>
                        <h3 className="text-lg font-medium mb-2">Materiales</h3>
                        {materialsPorItem[index] &&
                        materialsPorItem[index].length > 0 ? (
                          <MultiSelect
                            options={materialsPorItem[index].map(
                              (material) => ({
                                value: material.id,
                                name: material.name,
                                type: material.type,
                                cost: material.cost,
                              })
                            )}
                            selected={form.getValues(
                              `items.${index}.selected_materials`
                            )}
                            onChange={(selected) => {
                              form.setValue(
                                `items.${index}.selected_materials`,
                                selected
                              );
                              updateItemPrices(
                                index,
                                form.getValues(`items.${index}.sofa_id`),
                                form.getValues(`items.${index}.quantity`),
                                selected
                              );
                            }}
                            placeholder="Selecciona materiales..."
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Selecciona un modelo de sillón para ver los
                            materiales disponibles
                          </p>
                        )}
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
                        selected_materials: [],
                      })
                    }
                  >
                    Agregar Modelo
                  </Button>
                </div>
              </div>

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
                    Costo de Materiales:
                  </p>
                  <p className="text-base font-medium">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 2,
                    }).format(
                      form.watch("items").reduce((sum, item, idx) => {
                        const materials = materialsPorItem[idx] || [];
                        const materialCost =
                          item.selected_materials
                            .map(
                              (id) =>
                                materials.find((m) => m.id === id)?.cost || 0
                            )
                            .reduce((sum, cost) => sum + cost, 0) *
                          item.quantity;
                        return sum + materialCost;
                      }, 0)
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
