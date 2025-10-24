// src/core/patterns/strategy/StorePickup.ts

import { IShippingStrategy, OrderItem } from './IShippingStrategy';

/**
 * StorePickup - Estrategia de Recogida en Tienda
 * 
 * Características:
 * - Costo: $0 (GRATIS)
 * - Tiempo: Disponible el mismo día
 * - Cliente recoge en tienda física
 * - Sin intermediarios
 */
export class StorePickup implements IShippingStrategy {
  // Costo de recogida en tienda (gratis)
  private readonly PICKUP_COST = 0;

  /**
   * Calcula el costo de recogida en tienda
   * 
   * @param items - Productos del pedido (no afecta el costo)
   * @returns Costo de $0 (gratis)
   */
  calculateCost(items: OrderItem[]): number {
    // Validación: debe haber al menos un producto
    if (!items || items.length === 0) {
      throw new Error('El pedido debe contener al menos un producto');
    }

    // Recogida en tienda es siempre gratis
    return this.PICKUP_COST;
  }

  /**
   * Nombre de la estrategia
   */
  getName(): string {
    return 'Recogida en Tienda';
  }

  /**
   * Descripción del servicio
   */
  getDescription(): string {
    return 'Recoge tu pedido sin costo en nuestra tienda física. Disponible el mismo día de la compra.';
  }

  /**
   * Tiempo estimado de disponibilidad
   */
  getEstimatedTime(): string {
    return 'Mismo día (2-4 horas después de la compra)';
  }
}