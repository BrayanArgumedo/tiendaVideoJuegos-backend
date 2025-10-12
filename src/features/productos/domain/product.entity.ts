// src/features/productos/domain/product.entity.ts

import { ProductCategory } from './product.types';

/**
 * Entidad de dominio: Product
 * 
 * Representa un producto en el sistema con su lógica de negocio
 */
export class Product {
  constructor(
    public readonly id: string,
    public nombre: string,
    public consola: string,
    public categoria: ProductCategory,
    public precio: number,
    public stock: number,
    public descripcion: string | null = null,
    public imagenUrl: string | null = null,
    public fechaCreacion: Date = new Date()
  ) {}

  // ====================================
  // MÉTODOS DE NEGOCIO
  // ====================================

  /**
   * Verifica si el producto está disponible (tiene stock)
   */
  isAvailable(): boolean {
    return this.stock > 0;
  }

  /**
   * Verifica si el stock está bajo (menos de 10 unidades)
   */
  hasLowStock(): boolean {
    return this.stock < 10 && this.stock > 0;
  }

  /**
   * Verifica si el producto está agotado
   */
  isOutOfStock(): boolean {
    return this.stock === 0;
  }

  /**
   * Reduce el stock después de una venta
   * @param cantidad - Cantidad vendida
   */
  reduceStock(cantidad: number): void {
    if (cantidad > this.stock) {
      throw new Error('Stock insuficiente');
    }
    this.stock -= cantidad;
  }

  /**
   * Aumenta el stock (reabastecimiento)
   * @param cantidad - Cantidad a agregar
   */
  increaseStock(cantidad: number): void {
    this.stock += cantidad;
  }

  /**
   * Obtiene el precio formateado
   */
  getFormattedPrice(): string {
    return `$${this.precio.toFixed(2)}`;
  }

  /**
   * Convierte la entidad a objeto JSON para respuestas API
   */
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      consola: this.consola,
      categoria: this.categoria,
      precio: this.precio.toString(),  // Convertir a string como MySQL
      stock: this.stock,
      descripcion: this.descripcion,
      imagen_url: this.imagenUrl,
      fecha_creacion: this.fechaCreacion.toISOString()
    };
  }
}