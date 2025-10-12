// src/features/productos/application/product.service.ts

import { v4 as uuidv4 } from 'uuid';
import pool from '../../../config/database';
import {
  CreateProductDTO,
  UpdateProductDTO,
  ProductsListResponse,
  ProductApiResponse,
  ProductResponse
} from '../domain/product.types';

export class ProductService {

  // ====================================
  // MÉTODO GETALL - Listar todos los productos
  // ====================================
  
  /**
   * Obtiene la lista completa de productos
   * Ruta pública (no requiere autenticación)
   * 
   * Frontend espera: { records: Product[] }
   */
  async getAll(): Promise<ProductsListResponse> {
    const connection = await pool.getConnection();

    try {
      // Obtenemos todos los productos ordenados por fecha (más recientes primero)
      const [products]: any = await connection.execute(
        `SELECT id, nombre, consola, categoria, precio, stock, descripcion, imagen_url, fecha_creacion 
         FROM productos 
         ORDER BY fecha_creacion DESC`
      );

      return {
        records: products
      };
    } finally {
      connection.release();
    }
  }

  // ====================================
  // MÉTODO GETBYID - Obtener un producto por ID
  // ====================================
  
  /**
   * Obtiene un producto específico por su ID
   * Ruta pública (no requiere autenticación)
   * 
   */
  async getById(id: string): Promise<ProductResponse> {
    const connection = await pool.getConnection();

    try {
      const [products]: any = await connection.execute(
        `SELECT id, nombre, consola, categoria, precio, stock, descripcion, imagen_url, fecha_creacion 
         FROM productos 
         WHERE id = ?`,
        [id]
      );

      // Verificar que el producto existe
      if (products.length === 0) {
        const error = new Error('Producto no encontrado.');
        (error as any).statusCode = 404;
        throw error;
      }

      return products[0];
    } finally {
      connection.release();
    }
  }

  // ====================================
  // MÉTODO CREATE - Crear un nuevo producto
  // ====================================
  
  /**
   * Crea un nuevo producto en el sistema
   * Requiere autenticación + rol admin
   * 
   */
  async create(productData: CreateProductDTO): Promise<ProductApiResponse> {
    const { nombre, consola, categoria, precio, stock, descripcion } = productData;

    // Validación de campos obligatorios
    if (!nombre || !consola || !categoria || precio === undefined || stock === undefined) {
      const error = new Error('Faltan campos requeridos: nombre, consola, categoria, precio, stock.');
      (error as any).statusCode = 400;
      throw error;
    }

    // Validar que el precio sea un número positivo
    const precioNumber = typeof precio === 'string' ? parseFloat(precio) : precio;
    if (isNaN(precioNumber) || precioNumber < 0) {
      const error = new Error('El precio debe ser un número válido y positivo.');
      (error as any).statusCode = 400;
      throw error;
    }

    // Validar que el stock sea un número entero positivo
    if (!Number.isInteger(stock) || stock < 0) {
      const error = new Error('El stock debe ser un número entero positivo.');
      (error as any).statusCode = 400;
      throw error;
    }

    const connection = await pool.getConnection();

    try {
      const newProductId = uuidv4();

      // Insertar el nuevo producto
      // imagen_url será NULL inicialmente, se actualizará con el upload
      await connection.execute(
        `INSERT INTO productos (id, nombre, consola, categoria, precio, stock, descripcion, imagen_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
        [newProductId, nombre, consola, categoria, precioNumber, stock, descripcion || null]
      );

      return {
        success: true,
        message: 'Producto creado exitosamente.',
        id: newProductId  // Devolvemos el ID para que el frontend pueda subir la imagen
      };
    } finally {
      connection.release();
    }
  }

  // ====================================
  // MÉTODO UPDATE - Actualizar un producto
  // ====================================
  
  /**
   * Actualiza los datos de un producto existente
   * Requiere autenticación + rol admin
   * 
   */
  async update(id: string, updateData: UpdateProductDTO): Promise<ProductApiResponse> {
    const connection = await pool.getConnection();

    try {
      // Verificar que el producto existe
      const [products]: any = await connection.execute(
        'SELECT id FROM productos WHERE id = ?',
        [id]
      );

      if (products.length === 0) {
        const error = new Error('Producto no encontrado.');
        (error as any).statusCode = 404;
        throw error;
      }

      // Construir la query dinámicamente según los campos que vengan
      const allowedFields = ['nombre', 'consola', 'categoria', 'precio', 'stock', 'descripcion', 'imagen_url'];
      const updates: string[] = [];
      const values: any[] = [];

      for (const field of allowedFields) {
        if (updateData[field as keyof UpdateProductDTO] !== undefined) {
          updates.push(`${field} = ?`);
          
          // Si es precio, convertirlo a número
          if (field === 'precio') {
            const precio = updateData.precio;
            const precioNumber = typeof precio === 'string' ? parseFloat(precio) : precio;
            values.push(precioNumber);
          } else {
            values.push(updateData[field as keyof UpdateProductDTO]);
          }
        }
      }

      if (updates.length === 0) {
        const error = new Error('No hay campos para actualizar.');
        (error as any).statusCode = 400;
        throw error;
      }

      // Agregar el ID al final
      values.push(id);

      // Ejecutar la actualización
      await connection.execute(
        `UPDATE productos SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      return {
        success: true,
        message: 'Producto actualizado exitosamente.'
      };
    } finally {
      connection.release();
    }
  }

  // ====================================
  // MÉTODO DELETE - Eliminar un producto
  // ====================================
  
  /**
   * Elimina un producto del sistema
   * Requiere autenticación + rol admin
   * 
   * Equivalente en PHP: src/api/productos/manager.php?id=... (DELETE)
   * 
   * NOTA: Si el producto está en un pedido, MySQL impedirá la eliminación
   * por la foreign key con ON DELETE RESTRICT
   */
  async delete(id: string): Promise<ProductApiResponse> {
    const connection = await pool.getConnection();

    try {
      // Verificar que el producto existe
      const [products]: any = await connection.execute(
        'SELECT id FROM productos WHERE id = ?',
        [id]
      );

      if (products.length === 0) {
        const error = new Error('Producto no encontrado.');
        (error as any).statusCode = 404;
        throw error;
      }

      // Intentar eliminar el producto
      try {
        await connection.execute('DELETE FROM productos WHERE id = ?', [id]);
      } catch (dbError: any) {
        // Si hay una violación de foreign key (producto está en pedidos)
        if (dbError.code === 'ER_ROW_IS_REFERENCED_2') {
          const error = new Error('No se puede eliminar el producto porque está asociado a pedidos existentes.');
          (error as any).statusCode = 409; // Conflict
          throw error;
        }
        throw dbError;
      }

      return {
        success: true,
        message: 'Producto eliminado exitosamente.'
      };
    } finally {
      connection.release();
    }
  }

  // ====================================
  // MÉTODO UPDATEIMAGEURL - Actualizar solo la URL de la imagen
  // ====================================
  
  /**
   * Actualiza la URL de la imagen de un producto
   * Este método será usado después de subir la imagen con Multer
   * 
   */
  async updateImageUrl(id: string, imageUrl: string): Promise<ProductApiResponse> {
    const connection = await pool.getConnection();

    try {
      // Verificar que el producto existe
      const [products]: any = await connection.execute(
        'SELECT id FROM productos WHERE id = ?',
        [id]
      );

      if (products.length === 0) {
        const error = new Error('Producto no encontrado.');
        (error as any).statusCode = 404;
        throw error;
      }

      // Actualizar solo la imagen_url
      await connection.execute(
        'UPDATE productos SET imagen_url = ? WHERE id = ?',
        [imageUrl, id]
      );

      return {
        success: true,
        message: 'Imagen actualizada exitosamente.'
      };
    } finally {
      connection.release();
    }
  }
}