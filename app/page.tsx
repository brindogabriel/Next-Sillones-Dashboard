import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Layers, ShoppingCart, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Overview } from "@/components/overview";
import { RecentOrders } from "@/components/recent-orders";

export default async function DashboardPage() {
  let materialsCount = 0;
  let sofaModelsCount = 0;
  let ordersCount = 0;
  let error = null;

  try {
    const [materialsResult, sofaModelsResult, ordersResult] = await Promise.all(
      [
        supabase.from("materials").select("*", { count: "exact", head: true }),
        supabase
          .from("sofa_models")
          .select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
      ]
    );

    materialsCount = materialsResult.count || 0;
    sofaModelsCount = sofaModelsResult.count || 0;
    ordersCount = ordersResult.count || 0;

    if (materialsResult.error || sofaModelsResult.error || ordersResult.error) {
      throw new Error("Error fetching data from Supabase");
    }
  } catch (err) {
    console.error("Error in DashboardPage:", err);
    error = err instanceof Error ? err.message : "Unknown error occurred";
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>

        <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-md">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Error de conexión
          </h3>
          <p className="text-red-700 dark:text-red-300">
            No se pudo conectar con la base de datos. Por favor, verifica tus
            variables de entorno y la conexión a Supabase.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            Detalles: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="analytics">Analítica</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Materiales
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{materialsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Tipos de materiales registrados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Modelos de Sillones
                </CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sofaModelsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Modelos configurados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ordersCount}</div>
                <p className="text-xs text-muted-foreground">
                  Pedidos registrados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ganancia Promedio
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">30%</div>
                <p className="text-xs text-muted-foreground">
                  Porcentaje promedio de ganancia
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Resumen de Ventas</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Pedidos Recientes</CardTitle>
                <CardDescription>Últimos pedidos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentOrders />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Materiales más utilizados</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Modelos más vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentOrders />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
