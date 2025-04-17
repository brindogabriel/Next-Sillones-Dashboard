import { supabase } from "./supabase";

/**
 * Verifica y actualiza el estado de pedidos cuya fecha de entrega ha pasado sin ser entregados
 */
export async function checkAndUpdateExpiredOrders() {
  try {
    // Primero verificamos si la columna delivery_date existe
    const { data: checkData, error: checkError } = await supabase
      .from("orders")
      .select("id, delivery_date")
      .limit(1);
    
    // Si hay un error o no se puede acceder a delivery_date, abortamos
    if (checkError) {
      console.error("Error al verificar si existe la columna delivery_date:", checkError.message);
      return 0; // No actualizamos ningún pedido
    }
    
    // Verificar si la columna delivery_date existe
    const hasDeliveryDate = checkData && checkData.length > 0 && 
      Object.prototype.hasOwnProperty.call(checkData[0], 'delivery_date');
    
    if (!hasDeliveryDate) {
      console.error("La columna delivery_date no existe en la tabla orders. Ejecuta primero la migración de la base de datos.");
      return 0; // No actualizamos ningún pedido
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día actual
    
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`Verificando pedidos vencidos antes de ${todayStr}...`);
    
    // Buscar pedidos pendientes o en progreso con fecha de entrega vencida
    const { data: expiredOrders, error } = await supabase
      .from("orders")
      .select("id, delivery_date, status")
      .in("status", ["pending", "in_progress"])
      .lt("delivery_date", todayStr)
      .not("delivery_date", "is", null);
    
    if (error) {
      console.error("Error al consultar pedidos vencidos:", error.message, error.details, error.hint);
      return 0; // No actualizamos ningún pedido
    }
    
    console.log(`Encontrados ${expiredOrders ? expiredOrders.length : 0} pedidos vencidos`);
    
    if (expiredOrders && expiredOrders.length > 0) {
      // Mostrar información de los pedidos vencidos para depuración
      console.log("Pedidos a actualizar:", expiredOrders);
      
      // Actualizar los pedidos vencidos a estado "stock"
      const orderIds = expiredOrders.map(order => order.id);
      
      const { error: updateError, data: updateData } = await supabase
        .from("orders")
        .update({ status: "stock" })
        .in("id", orderIds)
        .select();
      
      if (updateError) {
        console.error("Error al actualizar pedidos vencidos:", updateError.message, updateError.details, updateError.hint);
        return 0; // No confirmamos las actualizaciones
      }
      
      console.log(`${expiredOrders.length} pedidos vencidos actualizados a 'stock'`, updateData);
      return expiredOrders.length;
    }
    
    return 0;
  } catch (error) {
    // Capturar más detalles del error
    console.error("Error al verificar pedidos vencidos:", {
      error,
      message: error instanceof Error ? error.message : "Error desconocido",
      stack: error instanceof Error ? error.stack : "Sin stack trace",
      name: error instanceof Error ? error.name : "Tipo desconocido"
    });
    
    return 0; // En caso de error, no actualizamos nada
  }
} 