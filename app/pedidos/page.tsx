import { Suspense } from "react";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersTableSkeleton } from "@/components/orders/orders-table-skeleton";
import { AddOrderButton } from "@/components/orders/add-order-button";
import { unstable_noStore as noStore } from "next/cache";
import { checkAndUpdateExpiredOrders } from "@/lib/check-order-status";
import { supabase } from "@/lib/supabase";

export default async function OrdersPage() {
  // Deshabilitar el caché para esta página
  noStore();

  // Verificar la conexión a la base de datos
  try {
    const { error } = await supabase
      .from("orders")
      .select("count", { count: "exact", head: true });
    if (error) {
      console.error(
        "Error al conectar con la base de datos:",
        error.message,
        error.details
      );
    } else {
      console.log("Conexión a la base de datos establecida correctamente");
    }
  } catch (dbError) {
    console.error("Error grave al conectar con la base de datos:", dbError);
  }

  // Verificar y actualizar pedidos vencidos
  try {
    console.log("Iniciando verificación de pedidos vencidos...");
    const updatedCount = await checkAndUpdateExpiredOrders();
    console.log(
      `Verificación completada: ${updatedCount} pedidos actualizados`
    );
  } catch (error) {
    console.error("Error al verificar pedidos vencidos:", {
      error,
      message: error instanceof Error ? error.message : "Error desconocido",
      stack: error instanceof Error ? error.stack : "Sin stack trace",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
        <AddOrderButton />
      </div>

      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersTable />
      </Suspense>
    </div>
  );
}
