// src/core/patterns/observer/EmailObserver.ts

import { IObserver } from './IObserver';
import { Queue } from '../../structures/Queue';

/**
 * EmailTask - Tarea de email para la cola
 */
export interface EmailTask {
  type: 'order_confirmation' | 'order_status_change' | 'welcome';
  orderId?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  additionalData?: any;
}

/**
 * EmailObserver - Observer para notificaciones por email
 * 
 * Cuando se crea un pedido, agrega una tarea de email a la cola
 * El email se procesa ASÍNCRONAMENTE en segundo plano
 * El usuario NO espera a que se envíe el email
 */

export class EmailObserver implements IObserver {
  // Cola compartida de emails (singleton)
  private emailQueue: Queue<EmailTask>;

  /**
   * Constructor
   * 
   * @param emailQueue - Instancia de la cola de emails
   */
  constructor(emailQueue: Queue<EmailTask>) {
    this.emailQueue = emailQueue;
  }

  /**
   * UPDATE
   * Llamado cuando se crea un pedido
   * Agrega el email a la cola para procesamiento posterior
   * 
   * @param data - Datos del pedido creado
   */
  async update(data: any): Promise<void> {
    const { orderId, userId, userEmail, userName, total } = data;

    // Crear tarea de email
    const emailTask: EmailTask = {
      type: 'order_confirmation',
      orderId,
      userId,
      userEmail,
      userName,
      additionalData: {
        total,
        timestamp: new Date().toISOString()
      }
    };

    // Agregar a la cola (NO bloqueante - instantáneo)
    this.emailQueue.enqueue(emailTask);

    console.log(`📧 Email agregado a la cola para ${userEmail}`);
    console.log(`   Cola actual: ${this.emailQueue.size()} email(s) pendientes`);
  }

  /**
   * Nombre del observer
   */
  getName(): string {
    return 'EmailObserver';
  }
}