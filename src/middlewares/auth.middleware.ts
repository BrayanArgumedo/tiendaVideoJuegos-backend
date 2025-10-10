// src/middlewares/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../config/jwt';

/**
 * Middleware de Autenticación
 * 
 * Verifica que la petición incluya un token JWT válido.
 * Si es válido, adjunta los datos del usuario a req.user
 * Si no es válido, devuelve error 401
 * 
 * Equivalente en PHP:
 * - Leer header Authorization
 * - Verificar con JWT::decode()
 * - Si falla, devolver 401
 */

// Extendemos el tipo Request de Express para incluir 'user'
// Esto permite que TypeScript sepa que req.user existe
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        nombre: string;
        correo: string;
        tipo_usuario: 'admin' | 'comprador';
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Obtener el header Authorization
    // El frontend envía: "Authorization: Bearer eyJhbGci..."
    const authHeader = req.headers.authorization;

    // 2. Verificar que el header existe
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado. Debes iniciar sesión.'
      });
    }

    // 3. Extraer solo el token (sin el prefijo "Bearer ")
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Usa: Bearer <token>'
      });
    }

    // 4. Verificar que el token sea válido y no haya expirado
    // Si falla, verifyToken() lanza un error que capturamos en el catch
    const payload = verifyToken(token);

    // 5. Adjuntar los datos del usuario al objeto req
    // Ahora TODOS los middlewares y controllers siguientes
    // pueden acceder a req.user
    req.user = {
      id: payload.id,
      nombre: payload.nombre,
      correo: payload.correo,
      tipo_usuario: payload.tipo_usuario
    };

    // 6. Continuar al siguiente middleware o controller
    next();

  } catch (error: any) {
    // Si verifyToken() falla (token expirado, inválido, manipulado)
    return res.status(401).json({
      success: false,
      message: error.message || 'Token inválido o expirado.'
    });
  }
}