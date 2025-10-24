// src/features/pedidos/domain/order.entity.ts

import { 
  OrderData, 
  OrderStatus, 
  ShippingMethod, 
  OrderItemData,
  OrderStatusHistory 
} from './order.types';

/**
 * Order Entity - Entidad de Dominio
 * 
 * Representa un pedido con su lógica de negocio
 * Encapsula las reglas y comportamientos de un pedido
 * 
 * Patrón: Domain-Driven Design (DDD)
 */

export class Order {
  // Propiedades privadas (encapsulación)
  private _id: string;
  private _usuario_id: string;
  private _subtotal: number;
  private _costo_envio: number;
  private _total: number;
  private _estado: OrderStatus;
  private _metodo_envio: ShippingMethod;
  private _direccion_envio: string;
  private _fecha_pedido: Date;
  private _detalles: OrderItemData[];
  private _historial_estados: OrderStatusHistory[];

  /**
   * Constructor privado (usar factory methods)
   * 
   * @param data - Datos del pedido
   */
  private constructor(data: OrderData) {
    this._id = data.id;
    this._usuario_id = data.usuario_id;
    this._subtotal = data.subtotal;
    this._costo_envio = data.costo_envio;
    this._total = data.total;
    this._estado = data.estado;
    this._metodo_envio = data.metodo_envio;
    this._direccion_envio = data.direccion_envio;
    this._fecha_pedido = data.fecha_pedido;
    this._detalles = data.detalles || [];
    this._historial_estados = [{
      estado: data.estado,
      fecha: data.fecha_pedido
    }];
  }

  // ====================================
  // FACTORY METHODS
  // ====================================

  /**
   * Crear una instancia de Order desde datos de BD
   * 
   * @param data - Datos del pedido
   * @returns Instancia de Order
   */
  static fromDatabase(data: OrderData): Order {
    return new Order(data);
  }

  /**
   * Crear una nueva orden (para insertar en BD)
   * 
   * @param data - Datos iniciales
   * @returns Instancia de Order
   */
  static create(data: Partial<OrderData>): Order {
    const now = new Date();
    
    return new Order({
      id: data.id || '',
      usuario_id: data.usuario_id || '',
      subtotal: data.subtotal || 0,
      costo_envio: data.costo_envio || 0,
      total: data.total || 0,
      estado: OrderStatus.PROCESANDO,
      metodo_envio: data.metodo_envio || ShippingMethod.STANDARD,
      direccion_envio: data.direccion_envio || '',
      fecha_pedido: now,
      detalles: data.detalles || []
    });
  }

  // ====================================
  // GETTERS (acceso a propiedades)
  // ====================================

  get id(): string {
    return this._id;
  }

  get usuario_id(): string {
    return this._usuario_id;
  }

  get subtotal(): number {
    return this._subtotal;
  }

  get costo_envio(): number {
    return this._costo_envio;
  }

  get total(): number {
    return this._total;
  }

  get estado(): OrderStatus {
    return this._estado;
  }

  get metodo_envio(): ShippingMethod {
    return this._metodo_envio;
  }

  get direccion_envio(): string {
    return this._direccion_envio;
  }

  get fecha_pedido(): Date {
    return this._fecha_pedido;
  }

  get detalles(): OrderItemData[] {
    return [...this._detalles]; // Retornar copia para inmutabilidad
  }

  get historial_estados(): OrderStatusHistory[] {
    return [...this._historial_estados];
  }

  // ====================================
  // MÉTODOS DE NEGOCIO
  // ====================================

  /**
   * Cambiar el estado del pedido
   * Incluye validaciones de transiciones válidas
   * 
   * @param nuevoEstado - Nuevo estado
   * @param adminId - ID del admin que realiza el cambio (opcional)
   * @throws Error si la transición no es válida
   */
  cambiarEstado(nuevoEstado: OrderStatus, adminId?: string): void {
    // Validar transición de estados
    if (!this.esTransicionValida(this._estado, nuevoEstado)) {
      throw new Error(
        `No se puede cambiar de ${this._estado} a ${nuevoEstado}`
      );
    }

    // Registrar en historial
    this._historial_estados.push({
      estado: nuevoEstado,
      fecha: new Date(),
      usuario_admin: adminId
    });

    // Cambiar estado
    this._estado = nuevoEstado;
  }

  /**
   * Validar si una transición de estado es válida
   * 
   * Reglas:
   * - procesando → enviado, cancelado
   * - enviado → completado, cancelado
   * - completado → [ninguno] (estado final)
   * - cancelado → [ninguno] (estado final)
   * 
   * @param estadoActual - Estado actual
   * @param nuevoEstado - Nuevo estado propuesto
   * @returns true si es válida, false si no
   */
  private esTransicionValida(
    estadoActual: OrderStatus,
    nuevoEstado: OrderStatus
  ): boolean {
    const transicionesValidas: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PROCESANDO]: [OrderStatus.ENVIADO, OrderStatus.CANCELADO],
      [OrderStatus.ENVIADO]: [OrderStatus.COMPLETADO, OrderStatus.CANCELADO],
      [OrderStatus.COMPLETADO]: [], // Estado final
      [OrderStatus.CANCELADO]: []   // Estado final
    };

    return transicionesValidas[estadoActual].includes(nuevoEstado);
  }

  /**
   * Verificar si el pedido puede ser cancelado
   * 
   * @returns true si puede cancelarse, false si no
   */
  puedeCancelarse(): boolean {
    return this._estado === OrderStatus.PROCESANDO || 
           this._estado === OrderStatus.ENVIADO;
  }

  /**
   * Verificar si el pedido está en estado final
   * 
   * @returns true si está completado o cancelado
   */
  estaFinalizado(): boolean {
    return this._estado === OrderStatus.COMPLETADO || 
           this._estado === OrderStatus.CANCELADO;
  }

  /**
   * Calcular el total de productos en el pedido
   * 
   * @returns Cantidad total de productos
   */
  getTotalProductos(): number {
    return this._detalles.reduce((sum, item) => sum + item.cantidad, 0);
  }

  /**
   * Agregar detalle de producto al pedido
   * 
   * @param detalle - Detalle del producto
   */
  agregarDetalle(detalle: OrderItemData): void {
    this._detalles.push(detalle);
  }

  /**
   * Obtener el último cambio de estado
   * 
   * @returns Último cambio de estado
   */
  getUltimoCambioEstado(): OrderStatusHistory | undefined {
    return this._historial_estados[this._historial_estados.length - 1];
  }

  // ====================================
  // CONVERSIÓN A OBJETOS SIMPLES
  // ====================================

  /**
   * Convertir a objeto simple (para guardar en BD)
   * 
   * @returns Objeto con los datos del pedido
   */
  toDatabase(): OrderData {
    return {
      id: this._id,
      usuario_id: this._usuario_id,
      subtotal: this._subtotal,
      costo_envio: this._costo_envio,
      total: this._total,
      estado: this._estado,
      metodo_envio: this._metodo_envio,
      direccion_envio: this._direccion_envio,
      fecha_pedido: this._fecha_pedido,
      detalles: this._detalles
    };
  }

  /**
   * Convertir a objeto JSON (para respuestas API)
   * 
   * @returns Objeto JSON serializable
   */
  toJSON(): OrderData {
    return {
      id: this._id,
      usuario_id: this._usuario_id,
      subtotal: this._subtotal,
      costo_envio: this._costo_envio,
      total: this._total,
      estado: this._estado,
      metodo_envio: this._metodo_envio,
      direccion_envio: this._direccion_envio,
      fecha_pedido: this._fecha_pedido,
      detalles: this._detalles
    };
  }

  // ====================================
  // MÉTODOS DE VALIDACIÓN
  // ====================================

  /**
   * Validar que el pedido tiene todos los datos requeridos
   * 
   * @throws Error si falta algún dato requerido
   */
  validar(): void {
    if (!this._id) {
      throw new Error('El pedido debe tener un ID');
    }

    if (!this._usuario_id) {
      throw new Error('El pedido debe tener un usuario asociado');
    }

    if (this._subtotal <= 0) {
      throw new Error('El subtotal debe ser mayor a 0');
    }

    if (this._total <= 0) {
      throw new Error('El total debe ser mayor a 0');
    }

    if (!this._direccion_envio || this._direccion_envio.trim() === '') {
      throw new Error('El pedido debe tener una dirección de envío');
    }

    if (this._detalles.length === 0) {
      throw new Error('El pedido debe tener al menos un producto');
    }
  }
}