"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderItem {
  quantity: number;
  total_price: number;
  sofa_models: { name: string } | { name: string }[] | null;
}

interface TopSofa {
  name: string;
  quantity: number;
  total_sales: number;
}

export function TopSofasTable() {
  const [data, setData] = useState<TopSofa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopSofas() {
      try {
        const { data: orderItems, error } = await supabase
          .from("order_items")
          .select(
            `
            quantity,
            total_price,
            sofa_models (
              name
            ),
            orders (
              status
            )
          `
          )
          .eq("orders.status", "completed")
          .as("OrderItem[]");

        if (error) throw error;

        // Group by sofa model
        const sofaData: Record<
          string,
          { quantity: number; total_sales: number }
        > = {};

        // Sum quantities and sales by sofa model
        orderItems?.forEach((item) => {
          const sofaName = Array.isArray(item.sofa_models)
            ? item.sofa_models[0]?.name
            : item.sofa_models?.name;
          if (!sofaData[sofaName]) {
            sofaData[sofaName] = { quantity: 0, total_sales: 0 };
          }
          sofaData[sofaName].quantity += item.quantity;
          sofaData[sofaName].total_sales += item.total_price;
        });

        // Convert to array for table
        const tableData = Object.entries(sofaData)
          .map(([name, { quantity, total_sales }]) => ({
            name,
            quantity,
            total_sales,
          }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10); // Top 10 sofas

        setData(tableData);
      } catch (error) {
        console.error("Error fetching top sofas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTopSofas();
  }, []);

  if (loading) {
    return <div>Cargando datos de modelos...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Modelo</TableHead>
            <TableHead>Cantidad Vendida</TableHead>
            <TableHead>Ventas Totales</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                No hay datos disponibles
              </TableCell>
            </TableRow>
          ) : (
            data.map((sofa, index) => (
              <TableRow key={index}>
                <TableCell>{sofa.name}</TableCell>
                <TableCell>{sofa.quantity}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  }).format(sofa.total_sales)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
