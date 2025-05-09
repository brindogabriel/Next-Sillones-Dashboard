import { supabase } from "@/lib/supabase";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { unstable_noStore as noStore } from 'next/cache';
import { Input } from "@/components/ui/input";

export async function OrdersTable() {
  // Deshabilitar el caché para este componente
  noStore();

  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filtrar por cliente..."
            className="max-w-sm"
            id="filter-orders"
          />
        </div>
        <div className="rounded-md border">
          <DataTable
            columns={columns}
            data={orders || []}
            filterColumn="customer_name"
            filterId="filter-orders"
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return (
      <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-md">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Error al cargar los pedidos
        </h3>
        <p className="text-red-700 dark:text-red-300">
          No se pudieron cargar los datos. Por favor, verifica la conexión a la
          base de datos.
        </p>
      </div>
    );
  }
}
