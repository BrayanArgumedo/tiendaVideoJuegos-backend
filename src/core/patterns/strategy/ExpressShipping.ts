// src/core/patterns/strategy/ExpressShipping.ts

import { IShippingStrategy, OrderItem } from './IShippingStrategy';

/**
 * ExpressShipping - Estrategia de Envío Express
 * 
 * Características:
 * - Costo fijo: $15,000
 * - Tiempo: 1-2 días hábiles
 * - Servicio prioritario
 * - Rastreo en tiempo real
 */
export class ExpressShipping implements IShippingStrategy {
  // Costo fijo del envío express
  private readonly EXPRESS_COST = 15000;

  /**
   * Calcula el costo de envío express
   * 
   * @param items - Productos del pedido (no afecta el costo en esta estrategia)
   * @returns Costo fijo de $15,000
   */
  calculateCost(items: OrderItem[]): number {
    // Validación: debe haber al menos un producto
    if (!items || items.length === 0) {
      throw new Error('El pedido debe contener al menos un producto');
    }

    // En envío express, el costo es fijo sin importar la cantidad
    return this.EXPRESS_COST;
  }

  /**
   * Nombre de la estrategia
   */
  getName(): string {
    return 'Envío Express';
  }

  /**
   * Descripción del servicio
   */
  getDescription(): string {
    return 'Envío prioritario con entrega rápida. Incluye rastreo en tiempo real y notificaciones.';
  }

  /**
   * Tiempo estimado de entrega
   */
  getEstimatedTime(): string {
    return '1-2 días hábiles';
  }
}