import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesChart } from "./sales-chart"
import { MaterialsUsageChart } from "./materials-usage-chart"
import { TopSofasTable } from "./top-sofas-table"
import { ExportReportButton } from "./export-report-button"

// Modificar la función ReportsContent para manejar mejor los errores de variables de entorno
export async function ReportsContent() {
  try {
 
    // Get total sales
    const { data: salesData, error: salesError } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "completed")

    if (salesError) throw salesError
    const totalSales = salesData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

    // Get total orders
    const { count: totalOrders, error: ordersError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })

    if (ordersError) throw ordersError

    // Get completed orders
    const { count: completedOrders, error: completedError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")

    if (completedError) throw completedError

    // Get pending orders
    const { count: pendingOrders, error: pendingError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    if (pendingError) throw pendingError

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <ExportReportButton />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                }).format(totalSales)}
              </div>
              <p className="text-xs text-muted-foreground">De pedidos completados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">Todos los pedidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Completados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders || 0}</div>
              <p className="text-xs text-muted-foreground">
                {totalOrders
                  ? `${Math.round(((completedOrders || 0) / totalOrders) * 100)}% del total`
                  : "0% del total"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders || 0}</div>
              <p className="text-xs text-muted-foreground">
                {totalOrders ? `${Math.round(((pendingOrders || 0) / totalOrders) * 100)}% del total` : "0% del total"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="materials">Materiales</TabsTrigger>
            <TabsTrigger value="sofas">Modelos</TabsTrigger>
          </TabsList>
          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Mes</CardTitle>
                <CardDescription>Resumen de ventas mensuales</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <SalesChart />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Uso de Materiales</CardTitle>
                <CardDescription>Materiales más utilizados</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <MaterialsUsageChart />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sofas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Modelos Más Vendidos</CardTitle>
                <CardDescription>Ranking de modelos de sillones</CardDescription>
              </CardHeader>
              <CardContent>
                <TopSofasTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  } catch (error) {
    console.error("Error fetching report data:", error)

    // Mensaje de error específico para variables de entorno faltantes
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    const isEnvError = errorMessage.includes("environment variables")

    return (
      <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-md">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error al cargar los datos de reportes</h3>
        <p className="text-red-700 dark:text-red-300">
          {isEnvError
            ? "Las variables de entorno de Supabase no están configuradas. Por favor, configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local o en la configuración de tu plataforma de despliegue."
            : "No se pudieron cargar los datos. Por favor, verifica la conexión a la base de datos."}
        </p>
        {!isEnvError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">Detalles: {errorMessage}</p>}
        <div className="mt-4">
          <a href="/configuracion" className="text-primary hover:underline font-medium">
            Ir a la página de configuración
          </a>
        </div>
      </div>
    )
  }
}
