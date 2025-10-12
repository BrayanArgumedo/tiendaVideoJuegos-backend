// src/features/productos/infrastructure/product.controller.ts

import { Request, Response } from 'express';
import { ProductService } from '../application/product.service';

const productService = new ProductService();

export class ProductController {

  // ====================================
  // MÉTODO GETALL - Listar todos los productos
  // ====================================
  
  /**
   * GET /api/productos
   * Retorna la lista completa de productos
   * Ruta pública (no requiere autenticación)
   */
  async getAll(req: Request, res: Response) {
    try {
      const result = await productService.getAll();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ====================================
  // MÉTODO GETBYID - Obtener un producto específico
  // ====================================
  
  /**
   * GET /api/productos/:id
   * Retorna un producto específico por su ID
   * Ruta pública (no requiere autenticación)
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productService.getById(id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ====================================
  // MÉTODO CREATE - Crear un nuevo producto
  // ====================================
  
  /**
   * POST /api/productos
   * Crea un nuevo producto
   * Requiere: Token JWT + Rol admin
   */
  async create(req: Request, res: Response) {
    try {
      const result = await productService.create(req.body);
      
      // Status 201 = Created (recurso creado exitosamente)
      res.status(201).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ====================================
  // MÉTODO UPDATE - Actualizar un producto
  // ====================================
  
  /**
   * PUT /api/productos/:id
   * Actualiza un producto existente
   * Requiere: Token JWT + Rol admin
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productService.update(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ====================================
  // MÉTODO DELETE - Eliminar un producto
  // ====================================
  
  /**
   * DELETE /api/productos/:id
   * Elimina un producto del sistema
   * Requiere: Token JWT + Rol admin
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productService.delete(id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ====================================
  // MÉTODO UPLOADIMAGE - Subir imagen del producto
  // ====================================
  
  /**
   * POST /api/productos/:id/imagen
   * Sube la imagen de un producto
   * Requiere: Token JWT + Rol admin
   * 
   * NOTA: Este método se completará en la siguiente sesión
   * cuando configuremos Multer
   */
  async uploadImage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Verificar que se subió un archivo
      // @ts-ignore - Multer agregará req.file
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ninguna imagen.'
        });
      }

      // @ts-ignore
      const imageUrl = `/uploads/productos/${req.file.filename}`;
      
      // Actualizar la URL de la imagen en la BD
      await productService.updateImageUrl(id, imageUrl);

      res.status(200).json({
        success: true,
        message: 'Imagen subida exitosamente.',
        url: imageUrl
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }
}