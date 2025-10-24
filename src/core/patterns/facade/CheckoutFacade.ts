// src/core/patterns/facade/CheckoutFacade.ts

import pool from '../../../config/database';
import { productIndex } from '../../structures/ProductIndex';
import { ShippingStrategyFactory, ShippingType } from '../strategy/ShippingStrategyFactory';
import { Subject } from '../observer/Subject';
import { IObserver } from '../observer/IObserver';
import { v4 as uuidv4 } from 'uuid';

/**
 * CheckoutFacade - Patrón Facade
 * 
 * Orquesta TODO el proceso de checkout de manera simplificada
 * Oculta la complejidad de coordinar múltiples subsistemas
 * 
 * Responsabilidades:
 * 1. Validar productos y stock
 * 2. Calcular subtotal
 * 3. Aplicar descuentos (recursividad)
 * 4. Calcular envío (Strategy Pattern)
 * 5. Crear pedido en BD (transacción)
 * 6. Notificar observers (Observer Pattern)
 */

// ====================================
// TIPOS E INTERFACES
// ====================================

export interface CheckoutItem {
  producto_id: string;
  cantidad: number;
}

export interface CheckoutData {
  usuario_id: string;
  productos: CheckoutItem[];
  metodo_envio: ShippingType;
  direccion_envio?: string;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  nombre: string;
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  subtotal?: number;
  descuentos?: Discount[];
  total_descuentos?: number;
  costo_envio?: number;
  total?: number;
  error?: string;
}

// ====================================
// CHECKOUT FACADE
// ====================================

export class CheckoutFacade {
  private orderSubject: Subject;

  /**
   * Constructor
   * Inicializa el Subject para notificar observers
   */
  constructor() {
    this.orderSubject = new Subject();
  }

  /**
   * ATTACH_OBSERVER
   * Registra un observer para recibir notificaciones
   * 
   * @param observer - Observer a registrar
   */
  attachObserver(observer: IObserver): void {
    this.orderSubject.attach(observer);
  }

  /**
   * PROCESS
   * Método principal del Facade
   * Orquesta TODO el proceso de checkout
   * 
   * @param data - Datos del checkout
   * @returns Resultado del proceso
   */
  async process(data: CheckoutData): Promise<CheckoutResult> {
    const connection = await pool.getConnection();

    try {
      // Iniciar transacción
      await connection.beginTransaction();

      console.log('\n🛒 === INICIANDO PROCESO DE CHECKOUT ===\n');

      // ====================================
      // PASO 1: VALIDAR PRODUCTOS Y STOCK
      // ====================================
      console.log('1️⃣ Validando productos y stock...');
      
      const validationResult = this.validateProducts(data.productos);
      
      if (!validationResult.success) {
        await connection.rollback();
        return {
          success: false,
          error: validationResult.error
        };
      }

      const productosConDetalles = validationResult.productos!;
      console.log(`   ✅ ${productosConDetalles.length} producto(s) validados\n`);

      // ====================================
      // PASO 2: CALCULAR SUBTOTAL
      // ====================================
      console.log('2️⃣ Calculando subtotal...');
      
      const subtotal = this.calculateSubtotal(productosConDetalles);
      console.log(`   Subtotal: $${subtotal.toLocaleString('es-CO')}\n`);

      // ====================================
      // PASO 3: APLICAR DESCUENTOS (RECURSIVIDAD)
      // ====================================
      console.log('3️⃣ Aplicando descuentos automáticos...');
      
      const discounts = await this.getAutomaticDiscounts(data.usuario_id, subtotal, data.productos);
      const totalConDescuentos = this.applyDiscountsRecursive(subtotal, discounts);
      const totalDescuentos = subtotal - totalConDescuentos;
      
      console.log(`   Descuentos aplicados: ${discounts.length}`);
      discounts.forEach(d => {
        console.log(`   - ${d.nombre}: ${d.type === 'percentage' ? d.value + '%' : '$' + d.value.toLocaleString('es-CO')}`);
      });
      console.log(`   Total con descuentos: $${totalConDescuentos.toLocaleString('es-CO')}\n`);

      // ====================================
      // PASO 4: CALCULAR COSTO DE ENVÍO (STRATEGY PATTERN)
      // ====================================
      console.log('4️⃣ Calculando costo de envío...');
      
      const shippingStrategy = ShippingStrategyFactory.create(data.metodo_envio);
      const costoEnvio = shippingStrategy.calculateCost(
        productosConDetalles.map(p => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad,
          precio_unitario: p.precio
        }))
      );
      
      console.log(`   Método: ${shippingStrategy.getName()}`);
      console.log(`   Costo: $${costoEnvio.toLocaleString('es-CO')}`);
      console.log(`   Tiempo: ${shippingStrategy.getEstimatedTime()}\n`);

      // ====================================
      // PASO 5: CALCULAR TOTAL FINAL
      // ====================================
      const total = totalConDescuentos + costoEnvio;
      console.log(`💰 TOTAL FINAL: $${total.toLocaleString('es-CO')}\n`);

      // ====================================
      // PASO 6: CREAR PEDIDO EN BD
      // ====================================
      console.log('5️⃣ Creando pedido en la base de datos...');
      
      const orderId = uuidv4();
      
      // Si no viene direccion_envio, usar valor por defecto
      const direccionEnvio = data.direccion_envio || 'Dirección no especificada';

      // Insertar pedido principal
      await connection.execute(
        `INSERT INTO pedidos (id, usuario_id, subtotal, costo_envio, total, estado, metodo_envio, direccion_envio) 
        VALUES (?, ?, ?, ?, ?, 'procesando', ?, ?)`,
        [orderId, data.usuario_id, subtotal, costoEnvio, total, data.metodo_envio, direccionEnvio]  // ⬅️ Usar variable
      );

      // Insertar detalles del pedido
      for (const producto of productosConDetalles) {
        await connection.execute(
          `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario)
           VALUES (?, ?, ?, ?)`,
          [orderId, producto.producto_id, producto.cantidad, producto.precio]
        );
      }

      console.log(`   ✅ Pedido creado: ${orderId}\n`);

      // ====================================
      // PASO 7: COMMIT DE LA TRANSACCIÓN
      // ====================================
      await connection.commit();
      console.log('6️⃣ Transacción confirmada\n');

      // ====================================
      // PASO 8: NOTIFICAR OBSERVERS (OBSERVER PATTERN)
      // ====================================
      console.log('7️⃣ Notificando observers...');
      
      // Obtener datos del usuario para el email
      const [userRows]: any = await connection.execute(
        'SELECT correo, nombre FROM usuarios WHERE id = ?',
        [data.usuario_id]
      );
      
      const user = userRows[0];

      await this.orderSubject.notify({
        orderId,
        userId: data.usuario_id,
        userEmail: user.correo,
        userName: user.nombre,
        total,
        productos: productosConDetalles
      });

      console.log('\n✅ === CHECKOUT COMPLETADO EXITOSAMENTE ===\n');

      // ====================================
      // RETORNAR RESULTADO
      // ====================================
      return {
        success: true,
        orderId,
        subtotal,
        descuentos: discounts,
        total_descuentos: totalDescuentos,
        costo_envio: costoEnvio,
        total
      };

    } catch (error: any) {
      // Si hay error, hacer rollback
      await connection.rollback();
      console.error('\n❌ Error en el checkout:', error.message);
      
      return {
        success: false,
        error: error.message
      };

    } finally {
      connection.release();
    }
  }

  /**
   * VALIDATE_PRODUCTS
   * Valida que los productos existan y tengan stock suficiente
   * Usa el ProductIndex (HashMap) para acceso O(1)
   * 
   * @param items - Productos a validar
   * @returns Resultado de la validación
   */
  private validateProducts(items: CheckoutItem[]): {
    success: boolean;
    error?: string;
    productos?: Array<CheckoutItem & { precio: number; nombre: string }>;
  } {
    const productosConDetalles: Array<CheckoutItem & { precio: number; nombre: string }> = [];

    for (const item of items) {
      // Buscar producto en el índice (O(1))
      const producto = productIndex.get(item.producto_id);

      if (!producto) {
        return {
          success: false,
          error: `Producto no encontrado: ${item.producto_id}`
        };
      }

      if (producto.stock < item.cantidad) {
        return {
          success: false,
          error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Solicitado: ${item.cantidad}`
        };
      }

      productosConDetalles.push({
        ...item,
        precio: parseFloat(producto.precio),
        nombre: producto.nombre
      });
    }

    return {
      success: true,
      productos: productosConDetalles
    };
  }

  /**
   * CALCULATE_SUBTOTAL
   * Calcula el subtotal del pedido
   * 
   * @param productos - Productos con precio
   * @returns Subtotal
   */
  private calculateSubtotal(productos: Array<{ cantidad: number; precio: number }>): number {
    return productos.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);
  }

  /**
   * GET_AUTOMATIC_DISCOUNTS
   * Obtiene los descuentos automáticos aplicables
   * 
   * @param userId - ID del usuario
   * @param subtotal - Subtotal del pedido
   * @param productos - Productos del pedido
   * @returns Array de descuentos
   */
  private async getAutomaticDiscounts(
    userId: string,
    subtotal: number,
    productos: CheckoutItem[]
  ): Promise<Discount[]> {
    const discounts: Discount[] = [];
    const connection = await pool.getConnection();

    try {
      // Descuento 1: Primera compra (10%)
      const [orderCount]: any = await connection.execute(
        'SELECT COUNT(*) as count FROM pedidos WHERE usuario_id = ?',
        [userId]
      );

      if (orderCount[0].count === 0) {
        discounts.push({
          type: 'percentage',
          value: 10,
          nombre: 'Bienvenida - Primera compra'
        });
      }

      // Descuento 2: Compra mayor a $500,000 (5%)
      if (subtotal > 500000) {
        discounts.push({
          type: 'percentage',
          value: 5,
          nombre: 'Compra Mayor a $500,000'
        });
      }

      // Descuento 3: Lunes de descuento ($10,000)
      const today = new Date().getDay();
      if (today === 1) {
        discounts.push({
          type: 'fixed',
          value: 10000,
          nombre: 'Lunes de Descuento'
        });
      }

      // Descuento 4: Cantidad de productos (3%)
      const totalProductos = productos.reduce((sum, p) => sum + p.cantidad, 0);
      if (totalProductos >= 5) {
        discounts.push({
          type: 'percentage',
          value: 3,
          nombre: 'Compra por Volumen (5+ productos)'
        });
      }

      // Descuento 5: Cliente frecuente (5%)
      if (orderCount[0].count >= 5) {
        discounts.push({
          type: 'percentage',
          value: 5,
          nombre: 'Cliente Frecuente'
        });
      }

      return discounts;

    } finally {
      connection.release();
    }
  }

  /**
   * APPLY_DISCOUNTS_RECURSIVE (RECURSIVIDAD)
   * Aplica descuentos en cadena de forma recursiva
   * 
   * @param total - Total actual
   * @param discounts - Array de descuentos
   * @returns Total con descuentos aplicados
   */
  private applyDiscountsRecursive(total: number, discounts: Discount[]): number {
    // CASO BASE: sin descuentos
    if (discounts.length === 0) {
      return total;
    }

    // Tomar el primer descuento y separar el resto
    const [first, ...rest] = discounts;

    // Aplicar el primer descuento
    let newTotal = total;
    if (first.type === 'percentage') {
      newTotal = total - (total * first.value / 100);
    } else {
      newTotal = total - first.value;
    }

    // RECURSIÓN: aplicar descuentos restantes
    return this.applyDiscountsRecursive(newTotal, rest);
  }
}