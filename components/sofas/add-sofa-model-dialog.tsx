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

  // Observar cambios en materiales y porcentaje de ganancia
  const watchedMaterials = useWatch({
    control: form.control,
    name: "materials",
  });
  const watchedProfit = useWatch({
    control: form.control,
    name: "profit_percentage",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  // Calcular costos en tiempo real
  const [costDetails, setCostDetails] = useState({
    materialsCost: 0,
    basePrice: 0,
    finalPrice: 0,
  });

  useEffect(() => {
    if (open) {
      fetchMaterials();
    }
  }, [open]);

  useEffect(() => {
    calculateCosts();
  }, [watchedMaterials, watchedProfit]);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const { data: sofaData, error: sofaError } = await supabase
        .from("sofa_models")
        .insert([
          {
            name: values.name,
            description: values.description || null,
            profit_percentage: values.profit_percentage,
            base_price: costDetails.basePrice,
            final_price: costDetails.finalPrice,
          },
        ])
        .select("id")
        .single();

      if (sofaError) throw sofaError;

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
                  variant="outline"
                  onClick={() => {
                    append({
                      material_id: "",
                      quantity: 1,
                    });
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
      </DialogContent>
    </Dialog>
  );
}
