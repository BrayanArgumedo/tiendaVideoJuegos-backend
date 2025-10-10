// src/features/usuarios/infrastructure/user.controller.ts

import { Request, Response } from 'express';
import { UserService } from '../application/user.service';

const userService = new UserService();

export class UserController {
  
  // ====================================
  // MÉTODO REGISTER (Ya existente, sin cambios)
  // ====================================
  async register(req: Request, res: Response) {
    try {
      const result = await userService.register(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        success: false,
        message: error.message 
      });
    }
  }

  // ====================================
  // MÉTODO LOGIN (NUEVO)
  // ====================================
  
  /**
   * Controlador para el endpoint de login
   * Recibe correo y password, devuelve token JWT
   * 
   * Equivalente en PHP: src/api/usuarios/login.php
   */
  async login(req: Request, res: Response) {
    try {
      // Llamamos al servicio que hace toda la lógica
      const result = await userService.login(req.body);
      
      // Si llegamos aquí, el login fue exitoso
      res.status(200).json(result);
      
    } catch (error: any) {
      // Capturamos cualquier error (credenciales incorrectas, etc)
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        success: false,
        message: error.message 
      });
    }
  }

  // ====================================
  // MÉTODOS CRUD PARA ADMIN
  // ====================================

  /**
   * Lista todos los usuarios (solo admin)
   */
  async getAll(req: Request, res: Response) {
    try {
      const result = await userService.getAll();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        success: false,
        message: error.message 
      });
    }
  }

  /**
   * Actualiza un usuario (solo admin)
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await userService.update(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        success: false,
        message: error.message 
      });
    }
  }

  /**
   * Elimina un usuario (solo admin)
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await userService.delete(id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        success: false,
        message: error.message 
      });
    }
  }

}