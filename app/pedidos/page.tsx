import { Suspense } from "react"
import { OrdersTable } from "@/components/orders/orders-table"
import { OrdersTableSkeleton } from "@/components/orders/orders-table-skeleton"
import { AddOrderButton } from "@/components/orders/add-order-button"
import { unstable_noStore as noStore } from 'next/cache';

export default function OrdersPage() {
  // Deshabilitar el caché para esta página
  noStore();

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
  )
}
