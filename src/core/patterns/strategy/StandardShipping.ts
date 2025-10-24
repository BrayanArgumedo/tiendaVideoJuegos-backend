// src/core/patterns/strategy/StandardShipping.ts

import { IShippingStrategy, OrderItem } from './IShippingStrategy';

/**
 * StandardShipping - Estrategia de Envío Estándar
 * 
 * Características:
 * - Costo fijo: $5,000
 * - Tiempo: 5-7 días hábiles
 * - Disponible para todo el país
 */
export class StandardShipping implements IShippingStrategy {
  // Costo fijo del envío estándar
  private readonly STANDARD_COST = 5000;

  /**
   * Calcula el costo de envío estándar
   * 
   * @param items - Productos del pedido (no afecta el costo en esta estrategia)
   * @returns Costo fijo de $5,000
   */
  calculateCost(items: OrderItem[]): number {
    // Validación: debe haber al menos un producto
    if (!items || items.length === 0) {
      throw new Error('El pedido debe contener al menos un producto');
    }

    // En envío estándar, el costo es fijo sin importar la cantidad
    return this.STANDARD_COST;
  }

  /**
   * Nombre de la estrategia
   */
  getName(): string {
    return 'Envío Estándar';
  }

  /**
   * Descripción del servicio
   */
  getDescription(): string {
    return 'Envío económico a todo el país. Entrega segura con empresa de mensajería certificada.';
  }

  /**
   * Tiempo estimado de entrega
   */
  getEstimatedTime(): string {
    return '5-7 días hábiles';
  }
}