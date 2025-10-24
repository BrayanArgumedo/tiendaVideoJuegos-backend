// src/features/pedidos/application/order.service.ts

import pool from '../../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../domain/order.entity';
import {
  OrderData,
  OrderStatus,
  CreateOrderDTO,
  CreateOrderResponse,
  OrderListResponse,
  OrderDetailResponse,
  UpdateOrderStatusDTO,
  UpdateOrderStatusResponse,
  OrderFilters,
  OrderStats
} from '../domain/order.types';
import { CheckoutFacade } from '../../../core/patterns/facade/CheckoutFacade';
import { EmailObserver } from '../../../core/patterns/observer/EmailObserver';
import { InventoryObserver } from '../../../core/patterns/observer/InventoryObserver';
import { LRUCache } from '../../../core/structures/LRUCache';
import { Stack } from '../../../core/structures/Stack';

/**
 * OrderService - Servicio de Pedidos
 * 
 * Contiene toda la lógica de negocio relacionada con pedidos
 * Integra todas las estructuras de datos y patrones implementados
 * 
 * Estructuras usadas:
 * - CheckoutFacade (Facade Pattern)
 * - LRUCache (para cachear pedidos frecuentes)
 * - Stack (para historial de cambios de estado)
 * - Observer Pattern (email + inventario)
 */

export class OrderService {
  // Caché LRU para pedidos frecuentemente consultados
  private orderCache: LRUCache<string, OrderData>;
  
  // Stack para historial de cambios de estado por pedido
  private statusHistoryStacks: Map<string, Stack<any>>;
  
  // Facade de checkout
  private checkoutFacade: CheckoutFacade;

  /**
   * Constructor
   * Inicializa el caché y el facade con observers
   */
  constructor() {
    // Inicializar caché con capacidad de 50 pedidos
    this.orderCache = new LRUCache<string, OrderData>(50);
    
    // Inicializar mapa de stacks para historial
    this.statusHistoryStacks = new Map();
    
    // Inicializar CheckoutFacade con observers
    this.checkoutFacade = new CheckoutFacade();
    
    // Registrar observers
    const emailQueue = (global as any).emailQueue;
    if (emailQueue) {
      this.checkoutFacade.attachObserver(new EmailObserver(emailQueue));
    }
    this.checkoutFacade.attachObserver(new InventoryObserver());
  }

  // ====================================
  // CREAR PEDIDO
  // ====================================

  /**
   * Crear un nuevo pedido
   * Usa el CheckoutFacade para procesar todo el flujo
   * 
   * @param data - Datos del pedido
   * @param userId - ID del usuario que crea el pedido
   * @returns Respuesta con el pedido creado
   */
  async create(data: CreateOrderDTO, userId: string): Promise<CreateOrderResponse> {
    try {
      console.log(`\n📝 Creando pedido para usuario ${userId}`);

      // Si no viene direccion_envio, usar valor por defecto
      const direccionEnvio = data.direccion_envio || 'Dirección no especificada';

      // Procesar checkout usando el Facade
      const result = await this.checkoutFacade.process({
        usuario_id: userId,
        productos: data.productos,
        metodo_envio: data.metodo_envio,
        direccion_envio: direccionEnvio  // ⬅️ Usar variable
      });

      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Error al crear el pedido'
        };
      }

      console.log(`✅ Pedido ${result.orderId} creado exitosamente\n`);

      // Invalidar caché del usuario (tiene un nuevo pedido)
      this.invalidateUserCache(userId);

      return {
        success: true,
        message: 'Pedido creado exitosamente',
        pedido: {
          id: result.orderId!,
          subtotal: result.subtotal!,
          descuentos: result.descuentos!.map(d => ({
            nombre: d.nombre,
            valor: d.type === 'percentage' 
              ? result.subtotal! * (d.value / 100)
              : d.value
          })),
          total_descuentos: result.total_descuentos!,
          costo_envio: result.costo_envio!,
          total: result.total!,
          estado: OrderStatus.PROCESANDO,
          fecha_pedido: new Date()
        }
      };

    } catch (error: any) {
      console.error('❌ Error en OrderService.create:', error);
      return {
        success: false,
        message: error.message || 'Error al crear el pedido'
      };
    }
  }

  // ====================================
  // OBTENER PEDIDOS DEL USUARIO
  // ====================================

  /**
   * Obtener todos los pedidos de un usuario
   * Usa caché para pedidos consultados frecuentemente
   * 
   * @param userId - ID del usuario
   * @returns Lista de pedidos
   */
  async getUserOrders(userId: string): Promise<OrderListResponse> {
    const connection = await pool.getConnection();

    try {
      // Intentar obtener del caché
      const cacheKey = `user_orders_${userId}`;
      const cached = this.orderCache.get(cacheKey);
      
      if (cached) {
        console.log(`📦 Pedidos del usuario ${userId} desde caché`);
        return {
          success: true,
          records: [cached]
        };
      }

      // Consultar pedidos del usuario
      const [rows]: any = await connection.execute(
        `SELECT 
          p.id,
          p.usuario_id,
          p.subtotal,
          p.costo_envio,
          p.total,
          p.estado,
          p.metodo_envio,
          p.direccion_envio,
          p.fecha_pedido
        FROM pedidos p
        WHERE p.usuario_id = ?
        ORDER BY p.fecha_pedido DESC`,
        [userId]
      );

      // Guardar en caché
      if (rows.length > 0) {
        rows.forEach((order: OrderData) => {
          this.orderCache.set(order.id, order);
        });
      }

      return {
        success: true,
        records: rows,
        total: rows.length
      };

    } catch (error: any) {
      console.error('❌ Error en getUserOrders:', error);
      throw new Error('Error al obtener los pedidos del usuario');
    } finally {
      connection.release();
    }
  }

  // ====================================
  // OBTENER TODOS LOS PEDIDOS (ADMIN)
  // ====================================

  /**
   * Obtener todos los pedidos (solo admin)
   * Con filtros opcionales
   * 
   * @param filters - Filtros opcionales
   * @returns Lista de pedidos
   */
    async getAll(filters?: OrderFilters): Promise<OrderListResponse> {
    const connection = await pool.getConnection();

    try {
        let query = `
        SELECT 
            p.id,
            p.usuario_id,
            p.subtotal,
            p.costo_envio,
            p.total,
            p.estado,
            p.metodo_envio,
            p.direccion_envio,
            p.fecha_pedido,
            u.nombre,
            u.apellido,
            u.correo,
            u.telefono
        FROM pedidos p
        INNER JOIN usuarios u ON p.usuario_id = u.id
        WHERE 1=1
        `;

      const params: any[] = [];

      // Aplicar filtros
      if (filters?.estado) {
        query += ' AND p.estado = ?';
        params.push(filters.estado);
      }

      if (filters?.metodo_envio) {
        query += ' AND p.metodo_envio = ?';
        params.push(filters.metodo_envio);
      }

      if (filters?.fecha_desde) {
        query += ' AND p.fecha_pedido >= ?';
        params.push(filters.fecha_desde);
      }

      if (filters?.fecha_hasta) {
        query += ' AND p.fecha_pedido <= ?';
        params.push(filters.fecha_hasta);
      }

      query += ' ORDER BY p.fecha_pedido DESC';

      const [rows]: any = await connection.execute(query, params);

      // Mapear resultados incluyendo datos del usuario
      const orders: OrderData[] = rows.map((row: any) => ({
        id: row.id,
        usuario_id: row.usuario_id,
        subtotal: parseFloat(row.subtotal),
        costo_envio: parseFloat(row.costo_envio),
        total: parseFloat(row.total),
        estado: row.estado,
        metodo_envio: row.metodo_envio,
        direccion_envio: row.direccion_envio,
        fecha_pedido: row.fecha_pedido,
        usuario: {
          nombre: row.nombre,
          apellido: row.apellido,
          correo: row.correo,
          telefono: row.telefono || ''
        }
      }));

      return {
        success: true,
        records: orders,
        total: orders.length
      };

    } catch (error: any) {
      console.error('❌ Error en getAll:', error);
      throw new Error('Error al obtener los pedidos');
    } finally {
      connection.release();
    }
  }

  // ====================================
  // OBTENER PEDIDO POR ID
  // ====================================

  /**
   * Obtener un pedido específico con sus detalles
   * Usa caché para acceso frecuente
   * 
   * @param orderId - ID del pedido
   * @param userId - ID del usuario (para verificar permisos)
   * @param isAdmin - Si el usuario es admin
   * @returns Detalle del pedido
   */
  async getById(
    orderId: string, 
    userId: string, 
    isAdmin: boolean = false
  ): Promise<OrderDetailResponse> {
    const connection = await pool.getConnection();

    try {
      // Intentar obtener del caché
      const cached = this.orderCache.get(orderId);
      
      if (cached && cached.detalles && cached.detalles.length > 0) {
        // Verificar permisos
        if (!isAdmin && cached.usuario_id !== userId) {
          throw new Error('No tienes permiso para ver este pedido');
        }
        
        console.log(`📦 Pedido ${orderId} desde caché`);
        return {
          success: true,
          pedido: cached
        };
      }

      // Obtener pedido principal
      const [orderRows]: any = await connection.execute(
        `SELECT 
          p.id,
          p.usuario_id,
          p.subtotal,
          p.costo_envio,
          p.total,
          p.estado,
          p.metodo_envio,
          p.direccion_envio,
          p.fecha_pedido,
          u.nombre,
          u.apellido,
          u.correo,
          u.telefono
        FROM pedidos p
        INNER JOIN usuarios u ON p.usuario_id = u.id
        WHERE p.id = ?`,
        [orderId]
      );

      if (orderRows.length === 0) {
        throw new Error('Pedido no encontrado');
      }

      const orderData = orderRows[0];

      // Verificar permisos
      if (!isAdmin && orderData.usuario_id !== userId) {
        throw new Error('No tienes permiso para ver este pedido');
      }

      // Obtener detalles del pedido
      const [detailRows]: any = await connection.execute(
        `SELECT
          d.id,
          d.pedido_id,
          d.producto_id,
          d.cantidad,
          d.precio_unitario,
          pr.nombre,
          pr.consola,
          pr.categoria,
          pr.imagen_url
        FROM detalle_pedidos d
        INNER JOIN productos pr ON d.producto_id = pr.id
        WHERE d.pedido_id = ?`,
        [orderId]
      );

      // Construir objeto completo
      const order: OrderData = {
        id: orderData.id,
        usuario_id: orderData.usuario_id,
        subtotal: parseFloat(orderData.subtotal),
        costo_envio: parseFloat(orderData.costo_envio),
        total: parseFloat(orderData.total),
        estado: orderData.estado,
        metodo_envio: orderData.metodo_envio,
        direccion_envio: orderData.direccion_envio,
        fecha_pedido: orderData.fecha_pedido,
        usuario: {
          nombre: orderData.nombre,
          apellido: orderData.apellido,
          correo: orderData.correo,
          telefono: orderData.telefono
        },
        detalles: detailRows.map((detail: any) => ({
          id: detail.id,
          pedido_id: detail.pedido_id,
          producto_id: detail.producto_id,
          cantidad: detail.cantidad,
          precio_unitario: parseFloat(detail.precio_unitario),
          producto: {
            nombre: detail.nombre,
            consola: detail.consola,
            categoria: detail.categoria,
            imagen_url: detail.imagen_url
          }
        }))
      };

      // Guardar en caché
      this.orderCache.set(orderId, order);

      return {
        success: true,
        pedido: order
      };

    } catch (error: any) {
      console.error('❌ Error en getById:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ====================================
  // ACTUALIZAR ESTADO DEL PEDIDO
  // ====================================

  /**
   * Actualizar el estado de un pedido (solo admin)
   * Usa Stack para mantener historial de cambios
   * 
   * @param orderId - ID del pedido
   * @param data - Nuevo estado
   * @param adminId - ID del admin que realiza el cambio
   * @returns Respuesta de la actualización
   */
  async updateStatus(
    orderId: string,
    data: UpdateOrderStatusDTO,
    adminId: string
  ): Promise<UpdateOrderStatusResponse> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Obtener pedido actual
      const [rows]: any = await connection.execute(
        'SELECT * FROM pedidos WHERE id = ?',
        [orderId]
      );

      if (rows.length === 0) {
        throw new Error('Pedido no encontrado');
      }

      const orderData = rows[0];

      // Crear entidad Order para validar transición
      const order = Order.fromDatabase({
        ...orderData,
        subtotal: parseFloat(orderData.subtotal),
        costo_envio: parseFloat(orderData.costo_envio),
        total: parseFloat(orderData.total)
      });

      // Intentar cambiar estado (valida transiciones)
      order.cambiarEstado(data.estado, adminId);

      // Actualizar en BD
      await connection.execute(
        'UPDATE pedidos SET estado = ? WHERE id = ?',
        [data.estado, orderId]
      );

      await connection.commit();

      // Guardar en Stack de historial
      if (!this.statusHistoryStacks.has(orderId)) {
        this.statusHistoryStacks.set(orderId, new Stack());
      }
      
      const stack = this.statusHistoryStacks.get(orderId)!;
      stack.push({
        estado: data.estado,
        fecha: new Date(),
        admin_id: adminId
      });

      // Invalidar caché del pedido
      this.orderCache.delete(orderId);
      this.invalidateUserCache(orderData.usuario_id);

      console.log(`✅ Estado del pedido ${orderId} actualizado a: ${data.estado}`);

      return {
        success: true,
        message: 'Estado del pedido actualizado exitosamente',
        pedido: {
          id: orderId,
          estado: data.estado,
          fecha_actualizacion: new Date()
        }
      };

    } catch (error: any) {
      await connection.rollback();
      console.error('❌ Error en updateStatus:', error);
      
      return {
        success: false,
        message: error.message || 'Error al actualizar el estado del pedido'
      };
    } finally {
      connection.release();
    }
  }

  // ====================================
  // OBTENER ESTADÍSTICAS (ADMIN)
  // ====================================

  /**
   * Obtener estadísticas de pedidos
   * Para dashboard de admin
   * 
   * @returns Estadísticas
   */
  async getStats(): Promise<OrderStats> {
    const connection = await pool.getConnection();

    try {
      // Total de pedidos
      const [totalRows]: any = await connection.execute(
        'SELECT COUNT(*) as total FROM pedidos'
      );

      // Total de ventas
      const [ventasRows]: any = await connection.execute(
        'SELECT SUM(total) as total_ventas FROM pedidos WHERE estado != ?',
        [OrderStatus.CANCELADO]
      );

      // Pedidos por estado
      const [estadoRows]: any = await connection.execute(
        `SELECT 
          estado,
          COUNT(*) as cantidad
        FROM pedidos
        GROUP BY estado`
      );

      const pedidosPorEstado = {
        procesando: 0,
        enviado: 0,
        completado: 0,
        cancelado: 0
      };

      estadoRows.forEach((row: any) => {
        pedidosPorEstado[row.estado as keyof typeof pedidosPorEstado] = row.cantidad;
      });

      // Producto más vendido
      const [productoRows]: any = await connection.execute(
        `SELECT
          d.producto_id,
          p.nombre,
          SUM(d.cantidad) as cantidad_vendida
        FROM detalle_pedidos d
        INNER JOIN productos p ON d.producto_id = p.id
        GROUP BY d.producto_id, p.nombre
        ORDER BY cantidad_vendida DESC
        LIMIT 1`
      );

      return {
        total_pedidos: totalRows[0].total,
        total_ventas: parseFloat(ventasRows[0].total_ventas || 0),
        pedidos_por_estado: pedidosPorEstado,
        producto_mas_vendido: productoRows.length > 0 ? {
          producto_id: productoRows[0].producto_id,
          nombre: productoRows[0].nombre,
          cantidad_vendida: productoRows[0].cantidad_vendida
        } : undefined
      };

    } catch (error: any) {
      console.error('❌ Error en getStats:', error);
      throw new Error('Error al obtener estadísticas');
    } finally {
      connection.release();
    }
  }

  // ====================================
  // MÉTODOS AUXILIARES
  // ====================================

  /**
   * Invalidar caché de pedidos de un usuario
   * 
   * @param userId - ID del usuario
   */
  private invalidateUserCache(userId: string): void {
    const cacheKey = `user_orders_${userId}`;
    this.orderCache.delete(cacheKey);
  }

  /**
   * Obtener historial de cambios de estado de un pedido
   * 
   * @param orderId - ID del pedido
   * @returns Historial de cambios
   */
  getStatusHistory(orderId: string): any[] {
    const stack = this.statusHistoryStacks.get(orderId);
    return stack ? stack.getHistory() : [];
  }
}
