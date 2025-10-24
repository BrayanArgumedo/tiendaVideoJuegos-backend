// src/core/patterns/observer/Subject.ts

import { ISubject } from './ISubject';
import { IObserver } from './IObserver';

/**
 * Subject - Implementación base del patrón Observer
 * 
 * Gestiona la lista de observers y las notificaciones
 * Puede ser heredada por clases específicas o usada directamente
 */

export class Subject implements ISubject {
  // Lista de observers registrados
  private observers: IObserver[] = [];

  /**
   * ATTACH (Adjuntar)
   * Registra un observer para recibir notificaciones
   * 
   * @param observer - Observer a registrar
   */
  attach(observer: IObserver): void {
    // Verificar que no esté ya registrado
    const isExist = this.observers.includes(observer);
    
    if (isExist) {
      console.log(`⚠️ Observer ${observer.getName()} ya está registrado`);
      return;
    }

    this.observers.push(observer);
    console.log(`✅ Observer registrado: ${observer.getName()}`);
  }

  /**
   * DETACH (Desadjuntar)
   * Remueve un observer de la lista
   * 
   * @param observer - Observer a remover
   */
  detach(observer: IObserver): void {
    const observerIndex = this.observers.indexOf(observer);
    
    if (observerIndex === -1) {
      console.log(`⚠️ Observer ${observer.getName()} no está registrado`);
      return;
    }

    this.observers.splice(observerIndex, 1);
    console.log(`🗑️ Observer removido: ${observer.getName()}`);
  }

  /**
   * NOTIFY (Notificar)
   * Notifica a TODOS los observers registrados
   * Si un observer falla, los demás continúan
   * 
   * @param data - Datos del evento
   */
  async notify(data: any): Promise<void> {
    console.log(`📢 Notificando a ${this.observers.length} observer(s)...`);

    // Notificar a cada observer
    for (const observer of this.observers) {
      try {
        await observer.update(data);
        console.log(`   ✅ ${observer.getName()} notificado exitosamente`);
      } catch (error) {
        // Si un observer falla, loggeamos pero continuamos con los demás
        console.error(`   ❌ Error en ${observer.getName()}:`, error);
      }
    }
  }

  /**
   * GET_OBSERVERS_COUNT
   * Retorna la cantidad de observers registrados
   * Útil para debugging
   * 
   * @returns Número de observers
   */
  getObserversCount(): number {
    return this.observers.length;
  }

  /**
   * GET_OBSERVERS_NAMES
   * Retorna los nombres de todos los observers
   * Útil para debugging
   * 
   * @returns Array de nombres
   */
  getObserversNames(): string[] {
    return this.observers.map(o => o.getName());
  }
}