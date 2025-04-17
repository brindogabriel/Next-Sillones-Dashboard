import { supabase } from "./supabase";

/**
 * Función para verificar la estructura de la tabla 'orders'
 */
export async function checkOrdersTableStructure() {
  try {
    // Consultar unos pocos registros para ver su estructura
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .limit(1);
    
    if (error) {
      console.error("Error al consultar la tabla orders:", error.message);
      return { success: false, error: error };
    }
    
    // Verificar si hay registros y obtener las claves del primer registro
    if (data && data.length > 0) {
      const firstRecord = data[0];
      const columns = Object.keys(firstRecord);
      console.log("Estructura de la tabla orders:", columns);
      
      // Verificar específicamente si existe la columna delivery_date
      const hasDeliveryDate = columns.includes("delivery_date");
      console.log("¿Tiene columna delivery_date?", hasDeliveryDate);
      
      return { 
        success: true, 
        columns, 
        hasDeliveryDate,
        sampleRecord: firstRecord
      };
    } else {
      console.log("No se encontraron registros para analizar");
      return { success: true, columns: [], hasDeliveryDate: false, noRecords: true };
    }
  } catch (error) {
    console.error("Error al verificar la estructura de la tabla:", error);
    return { success: false, error };
  }
}

/**
 * Función para simular la actualización de pedidos vencidos (solo para pruebas)
 */
export async function testExpiredOrdersUpdate() {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log(`Buscando pedidos con fecha de entrega anterior a ${yesterdayStr}...`);
    
    // Solo consultar, no actualizar
    const { data, error } = await supabase
      .from("orders")
      .select("id, delivery_date, status, customer_name")
      .in("status", ["pending", "in_progress"])
      .lt("delivery_date", yesterdayStr)
      .not("delivery_date", "is", null);
    
    if (error) {
      console.error("Error en la consulta:", error.message);
      return { success: false, error };
    }
    
    console.log("Pedidos vencidos encontrados:", data);
    return { success: true, expiredOrders: data };
    
  } catch (error) {
    console.error("Error al simular actualización:", error);
    return { success: false, error };
  }
} 