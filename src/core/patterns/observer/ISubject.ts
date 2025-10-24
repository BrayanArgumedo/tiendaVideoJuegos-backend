// src/core/patterns/observer/ISubject.ts

import { IObserver } from './IObserver';

/**
 * ISubject - Interfaz del Subject (Observable)
 * 
 * Define el contrato para objetos que pueden ser observados
 * Gestiona la lista de observers y las notificaciones
 */

export interface ISubject {
  /**
   * Agregar un observer a la lista
   * 
   * @param observer - Observer a agregar
   */
  attach(observer: IObserver): void;
  
  /**
   * Remover un observer de la lista
   * 
   * @param observer - Observer a remover
   */
  detach(observer: IObserver): void;
  
  /**
   * Notificar a TODOS los observers registrados
   * 
   * @param data - Datos del evento a notificar
   */
  notify(data: any): void | Promise<void>;
}