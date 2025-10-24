// src/core/patterns/strategy/IShippingStrategy.ts

/**
 * IShippingStrategy - Interfaz del patrón Strategy
 * 
 * Define el contrato que todas las estrategias de envío deben cumplir
 * Cada estrategia implementa su propio algoritmo de cálculo de costo
 */

export interface IShippingStrategy {
  /**
   * Calcula el costo de envío
   * 
   * @param items - Array de productos del pedido
   * @returns Costo de envío en pesos
   */
  calculateCost(items: OrderItem[]): number;
  
  /**
   * Nombre descriptivo de la estrategia
   * Ejemplo: "Envío Estándar", "Envío Express"
   */
  getName(): string;
  
  /**
   * Descripción del método de envío
   * Ejemplo: "Entrega en 5-7 días hábiles"
   */
  getDescription(): string;
  
  /**
   * Tiempo estimado de entrega
   * Ejemplo: "5-7 días", "1-2 días", "Mismo día"
   */
  getEstimatedTime(): string;
}

/**
 * OrderItem - Representa un producto en el pedido
 */
export interface OrderItem {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
}