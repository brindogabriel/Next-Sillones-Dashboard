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
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { MultiSelect } from "./MultiSelect"; // Asegurate que este import esté bien
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order } from "./columns";

interface Material {
  id: string;
  name: string;
  type?: string;
  cost?: number;
}

const orderItemSchema = z.object({
  sofa_id: z.string(),
  quantity: z.coerce.number().int().positive(),
  unit_price: z.coerce.number().positive(),
  total_price: z.coerce.number().positive(),
  selected_materials: z.array(z.string()),
});

const formSchema = z.object({
  customer_name: z.string().min(2),
  customer_phone: z.string().optional(),
  customer_email: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema),
});

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
  const [sofaModels, setSofaModels] = useState<any[]>([]);
  const [materialsPorItem, setMaterialsPorItem] = useState<Material[][]>([]);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || "",
      customer_email: order.customer_email || "",
      status: order.status,
      notes: order.notes || "",
      items: (order.items ?? []).map((item) => ({
        sofa_id: item.sofa_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        selected_materials: item.selected_materials || [],
      })),
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
        .order("name", { ascending: true });
      if (error) throw error;
      setSofaModels(data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los modelos de sillones.",
        variant: "destructive",
      });
    }
  }

  async function fetchMaterialsBySofa(sofaId: string) {
    try {
      const { data, error } = await supabase
        .from("sofa_materials")
        .select("material_id, materials(name, type, cost)")
        .eq("sofa_id", sofaId);

      if (error) throw error;

      if (!data) return [];

      const relatedMaterials = data.map((item: any) => {
        const material = item.materials;
        return {
          id: item.material_id,
          name: material?.name || "Material desconocido",
          type: material?.type || "Sin tipo",
          cost: material?.cost || 0,
        };
      });

      return relatedMaterials;
    } catch (error) {
      console.error(error);
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

    setMaterialsPorItem((prev) => {
      const nuevo = [...prev];
      nuevo[index] = fetchedMaterials;
      return nuevo;
    });

    form.setValue(`items.${index}.selected_materials`, []);
    updateItemPrices(
      index,
      sofaId,
      form.getValues(`items.${index}.quantity`),
      []
    );
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          customer_name: values.customer_name,
          customer_phone: values.customer_phone || null,
          customer_email: values.customer_email || null,
          status: values.status,
          notes: values.notes || null,
        })
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Pedido actualizado",
        description: "El pedido ha sido actualizado exitosamente.",
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error(error);
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
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Editar Pedido</DialogTitle>
          <DialogDescription>
            Modifica los detalles del pedido.
          </DialogDescription>
        </DialogHeader>
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-4">
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

                  <MultiSelect
                    options={materialsPorItem[index] || []}
                    selected={form.getValues(
                      `items.${index}.selected_materials`
                    )}
                    onChange={(selected) =>
                      form.setValue(
                        `items.${index}.selected_materials`,
                        selected
                      )
                    }
                    placeholder="Selecciona materiales..."
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
