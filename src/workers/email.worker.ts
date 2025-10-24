// src/workers/email.worker.ts

import { Queue } from '../core/structures/Queue';
import { EmailTask } from '../core/patterns/observer/EmailObserver';

/**
 * EmailWorker - Procesador de la cola de emails
 * 
 * Se ejecuta en segundo plano cada X segundos
 * Toma emails de la cola y los procesa uno por uno
 * 
 * En producción, aquí se conectaría con:
 * - SendGrid
 * - AWS SES
 * - Nodemailer
 * - etc.
 */

export class EmailWorker {
  private emailQueue: Queue<EmailTask>;
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;

  /**
   * Constructor
   * 
   * @param emailQueue - Instancia de la cola de emails
   * @param intervalMs - Intervalo de procesamiento en milisegundos (default: 5000ms = 5s)
   */
  constructor(emailQueue: Queue<EmailTask>, private intervalMs: number = 5000) {
    this.emailQueue = emailQueue;
  }

  /**
   * START
   * Inicia el worker para procesar la cola periódicamente
   */
  start(): void {
    console.log(`🤖 EmailWorker iniciado (intervalo: ${this.intervalMs}ms)`);

    this.intervalId = setInterval(() => {
      this.processQueue();
    }, this.intervalMs);
  }

  /**
   * STOP
   * Detiene el worker
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 EmailWorker detenido');
    }
  }

  /**
   * PROCESS_QUEUE
   * Procesa todos los emails pendientes en la cola
   */
  private async processQueue(): Promise<void> {
    // Evitar procesamiento concurrente
    if (this.isProcessing) {
      return;
    }

    // Si la cola está vacía, no hacer nada
    if (this.emailQueue.isEmpty()) {
      return;
    }

    this.isProcessing = true;

    try {
      console.log(`\n📬 Procesando cola de emails (${this.emailQueue.size()} pendientes)...`);

      // Procesar todos los emails en la cola
      while (!this.emailQueue.isEmpty()) {
        const emailTask = this.emailQueue.dequeue();
        
        if (emailTask) {
          await this.sendEmail(emailTask);
        }
      }

      console.log('✅ Cola de emails procesada completamente\n');

    } catch (error) {
      console.error('❌ Error procesando cola de emails:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * SEND_EMAIL
   * Envía un email (simulado por ahora)
   * 
   * En producción, aquí se conectaría con un servicio real de emails
   * 
   * @param task - Tarea de email
   */
  private async sendEmail(task: EmailTask): Promise<void> {
    console.log(`📧 Enviando email: ${task.type}`);
    console.log(`   Destinatario: ${task.userEmail}`);
    
    if (task.orderId) {
      console.log(`   Pedido: ${task.orderId}`);
    }

    // SIMULACIÓN: En producción aquí iría el código real de envío
    // Ejemplo con Nodemailer:
    /*
    await transporter.sendMail({
      from: '"GameTrade" <noreply@gametrade.com>',
      to: task.userEmail,
      subject: this.getEmailSubject(task.type),
      html: this.getEmailTemplate(task)
    });
    */

    // Simular delay de red (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`   ✅ Email enviado exitosamente a ${task.userEmail}`);
  }

  /**
   * GET_EMAIL_SUBJECT
   * Retorna el asunto según el tipo de email
   * 
   * @param type - Tipo de email
   * @returns Asunto del email
   */
  private getEmailSubject(type: EmailTask['type']): string {
    switch (type) {
      case 'order_confirmation':
        return '✅ Confirmación de tu pedido - GameTrade';
      case 'order_status_change':
        return '📦 Actualización de tu pedido - GameTrade';
      case 'welcome':
        return '👋 ¡Bienvenido a GameTrade!';
      default:
        return 'Notificación de GameTrade';
    }
  }

  /**
   * GET_QUEUE_SIZE
   * Retorna el tamaño actual de la cola
   * Útil para monitoreo
   * 
   * @returns Número de emails pendientes
   */
  getQueueSize(): number {
    return this.emailQueue.size();
  }

  /**
   * IS_RUNNING
   * Verifica si el worker está activo
   * 
   * @returns true si está corriendo, false si no
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}