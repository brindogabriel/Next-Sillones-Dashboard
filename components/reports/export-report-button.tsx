"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import ExcelJS from "exceljs";

export function ExportReportButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function exportToExcel() {
    setIsLoading(true);

    try {
      // Fetch orders data
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          `
          customer_name,
          customer_phone,
          customer_email,
          status,
          total_amount,
          notes,
          created_at
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Pedidos");

      // Add headers with styling
      worksheet.addRow([

        "Cliente",
        "Teléfono",
        "Email",
        "Estado",
        "Total",
        "Notas",
        "Fecha",
      ]);

      // Style headers
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9D9D9" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add data rows
      orders.forEach((order) => {
        worksheet.addRow([

          order.customer_name,
          order.customer_phone || "",
          order.customer_email || "",
          order.status,
          order.total_amount,
          order.notes || "",
          new Date(order.created_at).toLocaleDateString("es-AR"),
        ]);
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        const lengths = (column.values ?? []).map((v) =>
          v ? v.toString().length : 0
        );
        const maxLength = Math.max(
          ...lengths.filter((v) => typeof v === "number")
        );
        column.width = Math.min(Math.max(maxLength + 2, 10), 30);
      });

      // Format currency column
      worksheet.getColumn(6).numFmt = '"$"#,##0.00';

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Create and download file
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pedidos_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke the object URL
      setTimeout(() => URL.revokeObjectURL(url), 100);

      toast({
        title: "Reporte exportado",
        description: "El reporte ha sido exportado exitosamente.",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Error",
        description: "Hubo un error al exportar el reporte.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={exportToExcel} disabled={isLoading}>
      <Download className="mr-2 h-4 w-4" />
      {isLoading ? "Exportando..." : "Exportar a Excel"}
    </Button>
  );
}
