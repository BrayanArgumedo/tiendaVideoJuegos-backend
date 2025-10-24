// src/core/patterns/strategy/ShippingStrategyFactory.ts

import { IShippingStrategy } from './IShippingStrategy';
import { StandardShipping } from './StandardShipping';
import { ExpressShipping } from './ExpressShipping';
import { StorePickup } from './StorePickup';

/**
 * ShippingStrategyFactory - Factory Pattern
 * 
 * Crea instancias de estrategias de envío según el tipo solicitado
 * Centraliza la creación de objetos y facilita agregar nuevas estrategias
 * 
 * Patrón: Factory Pattern + Strategy Pattern
 */

// Tipos de envío disponibles
export type ShippingType = 'standard' | 'express' | 'pickup';

export class ShippingStrategyFactory {
  /**
   * Crea una estrategia de envío según el tipo
   * 
   * @param type - Tipo de envío ('standard', 'express', 'pickup')
   * @returns Instancia de la estrategia correspondiente
   * @throws Error si el tipo no es válido
   */
  static create(type: ShippingType): IShippingStrategy {
    switch (type) {
      case 'standard':
        return new StandardShipping();
      
      case 'express':
        return new ExpressShipping();
      
      case 'pickup':
        return new StorePickup();
      
      default:
        // TypeScript nunca debería llegar aquí gracias al tipo ShippingType
        throw new Error(`Tipo de envío no válido: ${type}`);
    }
  }

  /**
   * Obtiene todas las estrategias disponibles con sus detalles
   * Útil para mostrar opciones al usuario
   * 
   * @returns Array con información de todas las estrategias
   */
  static getAllStrategies(): Array<{
    type: ShippingType;
    name: string;
    description: string;
    estimatedTime: string;
    baseCost: number;
  }> {
    const strategies: ShippingType[] = ['standard', 'express', 'pickup'];
    
    return strategies.map(type => {
      const strategy = this.create(type);
      
      // Calcular costo base con un item dummy
      const dummyItem = [{
        producto_id: 'dummy',
        cantidad: 1,
        precio_unitario: 100000
      }];
      const baseCost = strategy.calculateCost(dummyItem);
      
      return {
        type,
        name: strategy.getName(),
        description: strategy.getDescription(),
        estimatedTime: strategy.getEstimatedTime(),
        baseCost
      };
    });
  }

  /**
   * Valida si un tipo de envío es válido
   * 
   * @param type - Tipo a validar
   * @returns true si es válido, false si no
   */
  static isValidType(type: string): type is ShippingType {
    return ['standard', 'express', 'pickup'].includes(type);
  }
}