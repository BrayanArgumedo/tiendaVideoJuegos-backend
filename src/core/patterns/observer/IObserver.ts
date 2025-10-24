// src/core/patterns/observer/IObserver.ts

/**
 * IObserver - Interfaz del patrón Observer
 * 
 * Define el contrato que todos los observers deben cumplir
 * Cada observer implementa su propia lógica de respuesta al evento
 */

export interface IObserver {
  /**
   * Método llamado cuando el Subject notifica un evento
   * 
   * @param data - Datos del evento (puede ser cualquier cosa)
   */
  update(data: any): void | Promise<void>;
  
  /**
   * Nombre descriptivo del observer
   * Útil para logging y debugging
   */
  getName(): string;
}