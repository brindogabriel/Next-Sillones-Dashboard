"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
  materials: z.array(materialItemSchema).nonempty({
    message: "Debe haber al menos un material",
  }),
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

  // Estado para los cálculos de costo
  const [costDetails, setCostDetails] = useState({
    materialsCost: 0,
    basePrice: 0,
    finalPrice: 0,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: sofaModel.name,
      description: sofaModel.description || "",
      profit_percentage: sofaModel.profit_percentage,
      materials: [{ material_id: "", quantity: 1 }],
    },
  });

  // Observar cambios en materiales y porcentaje de ganancia
  const watchedMaterials = useWatch({
    control: form.control,
    name: "materials",
  });
  const watchedProfit = useWatch({
    control: form.control,
    name: "profit_percentage",
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

  // Calcular costos cuando cambian los materiales o el porcentaje de ganancia
  useEffect(() => {
    calculateCosts();
  }, [watchedMaterials, watchedProfit]);

  // Función para calcular los costos
  function calculateCosts() {
    let materialsCost = 0;

    if (watchedMaterials && watchedMaterials.length > 0) {
      watchedMaterials.forEach((item) => {
        const material = availableMaterials.find(
          (m) => m.id === item.material_id
        );
        if (material && item.quantity) {
          materialsCost += material.cost * item.quantity;
        }
      });
    }

    const profitPercentage = watchedProfit || 0;
    const finalPrice = materialsCost * (1 + profitPercentage / 100);

    setCostDetails({
      materialsCost,
      basePrice: materialsCost,
      finalPrice,
    });
  }

  // Update form values when sofaModel or materials change
  useEffect(() => {
    if (open && !form.formState.isDirty) {
      form.reset({
        name: sofaModel.name,
        description: sofaModel.description || "",
        profit_percentage: sofaModel.profit_percentage,
        materials:
          sofaMaterials.length > 0
            ? sofaMaterials
            : [{ material_id: "", quantity: 1 }],
      });
    }
  }, [sofaModel, sofaMaterials, form, open]);

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
      // Usamos los costos calculados en tiempo real
      const { error: sofaError } = await supabase
        .from("sofa_models")
        .update({
          name: values.name,
          description: values.description || null,
          profit_percentage: values.profit_percentage,
          base_price: costDetails.basePrice,
          final_price: costDetails.finalPrice,
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
        const newMaterials = materialsToAdd
          .filter((item) => item.material_id && item.quantity > 0)
          .map((item) => ({
            sofa_id: sofaModel.id,
            material_id: item.material_id,
            quantity: item.quantity,
          }));

        if (newMaterials.length > 0) {
          const { error: addError } = await supabase
            .from("sofa_materials")
            .insert(newMaterials);

          if (addError) throw addError;
        }
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
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          form.reset();
        }
        onOpenChange(isOpen);
      }}
    >
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

              {/* Sección de resumen de costos */}
              <div className="space-y-2 p-4 border rounded-md">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Costo de Materiales:
                  </span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(costDetails.materialsCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Precio Base:
                  </span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(costDetails.basePrice)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Precio Final:</span>
                  <span className="text-lg font-bold">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(costDetails.finalPrice)}
                  </span>
                </div>
              </div>

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
                                      {material.name} ({material.type}) - $
                                      {material.cost}
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
                                  onChange={(e) => {
                                    field.onChange(e);
                                    calculateCosts();
                                  }}
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
                          onClick={() => {
                            remove(index);
                            calculateCosts();
                          }}
                          disabled={fields.length === 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => {
                      append({
                        material_id: "",
                        quantity: 1,
                      });
                      calculateCosts();
                    }}
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
