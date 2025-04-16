import { supabase } from "@/lib/supabase";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { unstable_noStore as noStore } from 'next/cache';

export async function SofaModelsTable() {
  // Deshabilitar el caché para este componente
  noStore();
  
  try {
    const { data: sofaModels, error } = await supabase
      .from("sofa_models")
      .select("*")
      .order("name", { ascending: false });

    if (error) {
      throw error;
    }

    return (
      <div className="rounded-md border">
        <DataTable
          columns={columns}
          data={sofaModels || []}
          filterColumn="name"
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching sofa models:", error);
    return (
      <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-md">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Error al cargar los modelos de sillones
        </h3>
        <p className="text-red-700 dark:text-red-300">
          No se pudieron cargar los datos. Por favor, verifica la conexión a la
          base de datos.
        </p>
      </div>
    );
  }
}
