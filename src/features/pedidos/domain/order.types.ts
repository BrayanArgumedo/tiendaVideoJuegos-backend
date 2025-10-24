// src/features/pedidos/domain/order.types.ts

/**
 * TIPOS E INTERFACES DEL MÓDULO DE PEDIDOS
 * 
 * Define todos los tipos, interfaces y enums relacionados con pedidos
 * Estos tipos son la base del dominio y se usan en toda la aplicación
 */

// ====================================
// ENUMS
// ====================================

/**
 * Estados posibles de un pedido
 */
export enum OrderStatus {
  PROCESANDO = 'procesando',
  ENVIADO = 'enviado',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado'
}

/**
 * Métodos de envío disponibles
 */
export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  PICKUP = 'pickup'
}

// ====================================
// INTERFACES DE DATOS
// ====================================

/**
 * Detalle de un producto en el pedido
 */
export interface OrderItemData {
  id?: number;
  pedido_id?: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  // Datos adicionales del producto (para respuestas)
  producto?: {
    nombre: string;
    consola: string;
    categoria: string;
    imagen_url: string | null;
  };
}

/**
 * Datos completos de un pedido
 */
export interface OrderData {
  id: string;
  usuario_id: string;
  subtotal: number;
  costo_envio: number;
  total: number;
  estado: OrderStatus;
  metodo_envio: ShippingMethod;
  direccion_envio: string;
  fecha_pedido: Date;
  // Datos adicionales del usuario (para respuestas)
  usuario?: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
  };
  // Detalles del pedido
  detalles?: OrderItemData[];
}

// ====================================
// DTOs (Data Transfer Objects)
// ====================================

/**
 * DTO para crear un pedido
 * Lo que el cliente envía en el POST
 */
export interface CreateOrderDTO {
  productos: Array<{
    producto_id: string;
    cantidad: number;
  }>;
  metodo_envio: ShippingMethod;
  direccion_envio?: string;
}

/**
 * DTO para actualizar el estado de un pedido (solo admin)
 */
export interface UpdateOrderStatusDTO {
  estado: OrderStatus;
}

/**
 * DTO de respuesta al crear un pedido
 */
export interface CreateOrderResponse {
  success: boolean;
  message: string;
  pedido?: {
    id: string;
    subtotal: number;
    descuentos: Array<{
      nombre: string;
      valor: number;
    }>;
    total_descuentos: number;
    costo_envio: number;
    total: number;
    estado: OrderStatus;
    fecha_pedido: Date;
  };
}

/**
 * DTO de respuesta para listar pedidos
 */
export interface OrderListResponse {
  success: boolean;
  records: OrderData[];
  total?: number;
}

/**
 * DTO de respuesta para ver un pedido específico
 */
export interface OrderDetailResponse {
  success: boolean;
  pedido: OrderData;
}

/**
 * DTO de respuesta para actualizar estado
 */
export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  pedido?: {
    id: string;
    estado: OrderStatus;
    fecha_actualizacion: Date;
  };
}

// ====================================
// TIPOS AUXILIARES
// ====================================

/**
 * Filtros para buscar pedidos
 */
export interface OrderFilters {
  usuario_id?: string;
  estado?: OrderStatus;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  metodo_envio?: ShippingMethod;
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort_by?: 'fecha_pedido' | 'total';
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Tipo para el historial de cambios de estado
 */
export interface OrderStatusHistory {
  estado: OrderStatus;
  fecha: Date;
  usuario_admin?: string;
}

/**
 * Resumen de estadísticas de pedidos (para admin)
 */
export interface OrderStats {
  total_pedidos: number;
  total_ventas: number;
  pedidos_por_estado: {
    procesando: number;
    enviado: number;
    completado: number;
    cancelado: number;
  };
  producto_mas_vendido?: {
    producto_id: string;
    nombre: string;
    cantidad_vendida: number;
  };
}