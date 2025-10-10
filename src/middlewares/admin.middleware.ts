// src/middlewares/admin.middleware.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Autorización (Admin)
 * 
 * Verifica que el usuario autenticado sea administrador.
 * Este middleware DEBE usarse DESPUÉS de authMiddleware.
 * 
 * Equivalente en PHP:
 * if ($decoded->data->tipo_usuario !== 'admin') {
 *     http_response_code(403);
 *     exit();
 * }
 */

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Verificar que req.user existe
  // (esto significa que authMiddleware ya se ejecutó)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No estás autenticado. Debes iniciar sesión primero.'
    });
  }

  // 2. Verificar que el usuario sea admin
  if (req.user.tipo_usuario !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }

  // 3. Si es admin, continuar
  next();
}