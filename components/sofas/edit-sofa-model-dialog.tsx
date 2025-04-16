"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Trash } from "lucide-react";
import type { SofaModel } from "./columns";
import type { Material } from "../materials/columns";

const materialItemSchema = z.object({
  id: z.string().optional(),
  material_id: z.string({
    required_error: "Selecciona un material",
  }),
  quantity: z.coerce.number().positive({
    message: "La cantidad debe ser un número positivo",
  }),
});

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional(),
  profit_percentage: z.coerce.number().min(0, {
    message: "El porcentaje de ganancia debe ser un número positivo.",
  }),
  materials: z.array(materialItemSchema),
});

interface EditSofaModelDialogProps {
  sofaModel: SofaModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SofaMaterialItem {
  id: string;
  material_id: string;
  quantity: number;
}

export function EditSofaModelDialog({
  sofaModel,
  open,
  onOpenChange,
}: EditSofaModelDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [sofaMaterials, setSofaMaterials] = useState<SofaMaterialItem[]>([]);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: sofaModel.name,
      description: sofaModel.description || "",
      profit_percentage: sofaModel.profit_percentage,
      materials: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  useEffect(() => {
    if (open) {
      fetchMaterials();
      fetchSofaMaterials();
    }
  }, [open, sofaModel.id]);

  // Update form values when sofaModel changes
  useEffect(() => {
    form.setValue("name", sofaModel.name);
    form.setValue("description", sofaModel.description || "");
    form.setValue("profit_percentage", sofaModel.profit_percentage);
  }, [sofaModel, form]);

  // Update materials field when sofaMaterials changes
  useEffect(() => {
    if (sofaMaterials.length > 0) {
      replace(sofaMaterials);
    } else if (fields.length === 0) {
      append({ material_id: "", quantity: 1 });
    }
  }, [sofaMaterials, append, replace, fields.length]);

  async function fetchMaterials() {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("name", { ascending: false });

      if (error) throw error;
      setAvailableMaterials(data || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales.",
        variant: "destructive",
      });
    }
  }

  async function fetchSofaMaterials() {
    try {
      const { data, error } = await supabase
        .from("sofa_materials")
        .select("id, material_id, quantity")
        .eq("sofa_id", sofaModel.id);

      if (error) throw error;
      setSofaMaterials(data || []);
    } catch (error) {
      console.error("Error fetching sofa materials:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales del sillón.",
        variant: "destructive",
      });
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      // Calcular el costo base basado en los materiales
      let basePrice = 0;
      for (const item of values.materials) {
        const material = availableMaterials.find(
          (m) => m.id === item.material_id
        );
        if (material) {
          basePrice += material.cost * item.quantity;
        }
      }

      // Calcular el precio final con el porcentaje de ganancia
      const finalPrice = basePrice * (1 + values.profit_percentage / 100);

      // Actualizar el modelo de sillón
      const { error: sofaError } = await supabase
        .from("sofa_models")
        .update({
          name: values.name,
          description: values.description || null,
          profit_percentage: values.profit_percentage,
          base_price: basePrice,
          final_price: finalPrice,
        })
        .eq("id", sofaModel.id);

      if (sofaError) throw sofaError;

      // Obtener los IDs de los materiales existentes
      const existingMaterialIds = sofaMaterials.map((item) => item.id);

      // Identificar materiales a agregar, actualizar o eliminar
      const materialsToUpdate = values.materials.filter((item) => item.id);
      const materialsToAdd = values.materials.filter((item) => !item.id);
      const materialIdsToKeep = materialsToUpdate.map((item) => item.id);
      const materialIdsToDelete = existingMaterialIds.filter(
        (id) => !materialIdsToKeep.includes(id)
      );

      // Eliminar materiales que ya no están en la lista
      if (materialIdsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("sofa_materials")
          .delete()
          .in("id", materialIdsToDelete);

        if (deleteError) throw deleteError;
      }

      // Actualizar materiales existentes
      for (const material of materialsToUpdate) {
        const { error: updateError } = await supabase
          .from("sofa_materials")
          .update({
            material_id: material.material_id,
            quantity: material.quantity,
          })
          .eq("id", material.id);

        if (updateError) throw updateError;
      }

      // Agregar nuevos materiales
      if (materialsToAdd.length > 0) {
        const newMaterials = materialsToAdd.map((item) => ({
          sofa_id: sofaModel.id,
          material_id: item.material_id,
          quantity: item.quantity,
        }));

        const { error: addError } = await supabase
          .from("sofa_materials")
          .insert(newMaterials);

        if (addError) throw addError;
      }

      toast({
        title: "Modelo actualizado",
        description: "El modelo de sillón ha sido actualizado exitosamente.",
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating sofa model:", error);
      toast({
        title: "Error",
        description: "Hubo un error al actualizar el modelo de sillón.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Modelo de Sillón</DialogTitle>
          <DialogDescription>
            Modifica los detalles del modelo de sillón.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profit_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porcentaje de Ganancia (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <h3 className="text-lg font-medium mb-2">Materiales</h3>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex flex-col gap-4 p-4 border rounded-md"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`materials.${index}.material_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Material</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un material" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableMaterials.map((material) => (
                                    <SelectItem
                                      key={material.id}
                                      value={material.id}
                                    >
                                      {material.name} ({material.type})
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
                          name={`materials.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cantidad</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        material_id: "",
                        quantity: 1,
                      })
                    }
                  >
                    Agregar Material
                  </Button>
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
