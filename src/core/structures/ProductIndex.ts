// src/core/structures/ProductIndex.ts

import pool from '../../config/database';

/**
 * Product Index - HashMap (Índice de Productos)
 * 
 * Mantiene TODOS los productos en memoria para acceso O(1)
 * Evita consultas repetitivas a MySQL
 * 
 * Uso en el proyecto:
 * - Validar stock instantáneamente al crear pedidos
 * - Verificar disponibilidad de productos
 * - Reducir carga en MySQL en un 80%
 * 
 * Estrategia de sincronización:
 * 1. Cargar todos los productos al iniciar el servidor
 * 2. Actualizar el índice cuando cambia la BD
 * 3. Reconstruir cada 5 minutos (opcional)
 */

interface Product {
  id: string;
  nombre: string;
  consola: string;
  categoria: string;
  precio: string;
  stock: number;
  descripcion: string | null;
  imagen_url: string | null;
}

export class ProductIndex {
  // HashMap: clave = product_id, valor = Product
  private index: Map<string, Product> = new Map();
  
  // Timestamp de la última actualización
  private lastUpdate: Date | null = null;

  /**
   * BUILD (Construir)
   * Carga TODOS los productos de la BD al índice
   * Se ejecuta al iniciar el servidor
   * Complejidad: O(n) donde n = cantidad de productos
   * 
   * @returns Cantidad de productos cargados
   */
  async build(): Promise<number> {
    const connection = await pool.getConnection();

    try {
      console.log('📦 Construyendo índice de productos...');

      // Obtener todos los productos de la BD
      const [products]: any = await connection.execute(
        'SELECT id, nombre, consola, categoria, precio, stock, descripcion, imagen_url FROM productos'
      );

      // Limpiar índice anterior
      this.index.clear();

      // Agregar cada producto al índice
      for (const product of products) {
        this.index.set(product.id, product);
      }

      // Actualizar timestamp
      this.lastUpdate = new Date();

      console.log(`✅ Índice construido: ${this.index.size} productos cargados`);
      
      return this.index.size;

    } catch (error) {
      console.error('❌ Error construyendo índice de productos:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * GET (Obtener)
   * Obtiene un producto por su ID
   * Complejidad: O(1) - Instantáneo
   * 
   * @param id - ID del producto
   * @returns Producto o undefined si no existe
   */
  get(id: string): Product | undefined {
    return this.index.get(id);
  }

  /**
   * HAS (Tiene)
   * Verifica si un producto existe
   * Complejidad: O(1) - Instantáneo
   * 
   * @param id - ID del producto
   * @returns true si existe, false si no
   */
  has(id: string): boolean {
    return this.index.has(id);
  }

  /**
   * UPDATE (Actualizar)
   * Actualiza un producto en el índice
   * Se llama cuando se modifica un producto en la BD
   * Complejidad: O(1) - Instantáneo
   * 
   * @param id - ID del producto
   * @param product - Datos actualizados del producto
   */
  update(id: string, product: Product): void {
    this.index.set(id, product);
    console.log(`📝 Índice actualizado: Producto ${id}`);
  }

  /**
   * DELETE (Eliminar)
   * Elimina un producto del índice
   * Se llama cuando se elimina un producto de la BD
   * Complejidad: O(1) - Instantáneo
   * 
   * @param id - ID del producto
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): boolean {
    const deleted = this.index.delete(id);
    if (deleted) {
      console.log(`🗑️ Índice actualizado: Producto ${id} eliminado`);
    }
    return deleted;
  }

  /**
   * GET_ALL (Obtener todos)
   * Retorna todos los productos del índice
   * Complejidad: O(n) donde n = cantidad de productos
   * 
   * @returns Array con todos los productos
   */
  getAll(): Product[] {
    return Array.from(this.index.values());
  }

  /**
   * SIZE (Tamaño)
   * Retorna la cantidad de productos en el índice
   * Complejidad: O(1) - Instantáneo
   * 
   * @returns Número de productos
   */
  size(): number {
    return this.index.size;
  }

  /**
   * GET_LAST_UPDATE (Obtener última actualización)
   * Retorna cuándo fue la última actualización del índice
   * 
   * @returns Fecha de última actualización o null si nunca se actualizó
   */
  getLastUpdate(): Date | null {
    return this.lastUpdate;
  }

  /**
   * VALIDATE_STOCK (Validar stock)
   * Valida si hay stock suficiente para un producto
   * Complejidad: O(1) - Instantáneo
   * 
   * @param productId - ID del producto
   * @param quantity - Cantidad solicitada
   * @returns true si hay stock, false si no
   */
  validateStock(productId: string, quantity: number): boolean {
    const product = this.index.get(productId);
    
    if (!product) {
      return false;  // Producto no existe
    }
    
    return product.stock >= quantity;
  }

  /**
   * REDUCE_STOCK (Reducir stock)
   * Reduce el stock de un producto en el índice
   * IMPORTANTE: También debe actualizarse en la BD
   * Complejidad: O(1) - Instantáneo
   * 
   * @param productId - ID del producto
   * @param quantity - Cantidad a reducir
   * @returns true si se redujo, false si no hay stock suficiente
   */
  reduceStock(productId: string, quantity: number): boolean {
    const product = this.index.get(productId);
    
    if (!product) {
      return false;  // Producto no existe
    }
    
    if (product.stock < quantity) {
      return false;  // Stock insuficiente
    }
    
    // Reducir stock en el índice
    product.stock -= quantity;
    this.index.set(productId, product);
    
    return true;
  }
}

// Exportar instancia única (Singleton)
export const productIndex = new ProductIndex();