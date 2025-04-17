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
import type { Material } from "../materials/columns";

const materialItemSchema = z.object({
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
  materials: z.array(materialItemSchema).optional(),
});

interface AddSofaModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSofaModelDialog({
  open,
  onOpenChange,
}: AddSofaModelDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      profit_percentage: 30,
      materials: [{ material_id: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  useEffect(() => {
    if (open) {
      fetchMaterials();
    }
  }, [open]);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      // Calcular el costo base basado en los materiales
      let basePrice = 0;
      if (values.materials && values.materials.length > 0) {
        for (const item of values.materials) {
          const material = availableMaterials.find(
            (m) => m.id === item.material_id
          );
          if (material) {
            basePrice += material.cost * item.quantity;
          }
        }
      }

      // Calcular el precio final con el porcentaje de ganancia
      const finalPrice = basePrice * (1 + values.profit_percentage / 100);

      // Insertar el modelo de sillón
      const { data: sofaData, error: sofaError } = await supabase
        .from("sofa_models")
        .insert([
          {
            name: values.name,
            description: values.description || null,
            profit_percentage: values.profit_percentage,
            base_price: basePrice,
            final_price: finalPrice,
          },
        ])
        .select("id")
        .single();

      if (sofaError) throw sofaError;

      // Insertar los materiales del sillón
      if (values.materials && values.materials.length > 0 && sofaData) {
        const sofaMaterials = values.materials
          .filter((item) => item.material_id && item.quantity > 0)
          .map((item) => ({
            sofa_id: sofaData.id,
            material_id: item.material_id,
            quantity: item.quantity,
          }));

        if (sofaMaterials.length > 0) {
          const { error: materialsError } = await supabase
            .from("sofa_materials")
            .insert(sofaMaterials);

          if (materialsError) throw materialsError;
        }
      }

      toast({
        title: "Modelo agregado",
        description: "El modelo de sillón ha sido agregado exitosamente.",
      });

      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error adding sofa model:", error);
      toast({
        title: "Error",
        description: "Hubo un error al agregar el modelo de sillón.",
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
          <DialogTitle>Agregar Modelo de Sillón</DialogTitle>
          <DialogDescription>
            Ingresa los detalles del nuevo modelo de sillón.
          </DialogDescription>
        </DialogHeader>
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
                      <Input placeholder="Sillón Esquinero" {...field} />
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
                    <Textarea
                      placeholder="Descripción del modelo de sillón"
                      {...field}
                      value={field.value || ""}
                    />
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
                              defaultValue={field.value}
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
      </DialogContent>
    </Dialog>
  );
}
