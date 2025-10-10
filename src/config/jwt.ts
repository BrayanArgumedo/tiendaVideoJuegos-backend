// src/config/jwt.ts

import jwt from 'jsonwebtoken';
import { JWTPayload } from '../features/usuarios/domain/user.types';

// ====================================
// CONFIGURACIÓN DESDE VARIABLES DE ENTORNO
// ====================================

// Obtenemos las variables del .env
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_ISSUER = process.env.JWT_ISSUER!;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE!;
const JWT_EXP_SECONDS = parseInt(process.env.JWT_EXP_SECONDS || '86400');

/**
 * Genera un token JWT con los datos del usuario
 * 
 * @param payload - Datos del usuario (id, nombre, correo, tipo_usuario)
 * @returns Token JWT como string
 * 
 * Equivalente en PHP:
 * $jwt = JWT::encode($payload, $secret_key, 'HS256');
 */
export function generateToken(payload: JWTPayload): string {
  // Obtenemos el timestamp actual en segundos (igual que en PHP)
  const issuedAt = Math.floor(Date.now() / 1000);
  
  // Calculamos cuándo expira (tiempo actual + 24 horas por defecto)
  const expiresAt = issuedAt + JWT_EXP_SECONDS;

  // Creamos el payload completo con los claims estándar de JWT
  const fullPayload = {
    // Claims estándar (igual que en PHP)
    iss: JWT_ISSUER,        // Issuer: quién emitió el token
    aud: JWT_AUDIENCE,      // Audience: para quién es el token
    iat: issuedAt,          // Issued At: cuándo se creó
    nbf: issuedAt,          // Not Before: no válido antes de este momento
    exp: expiresAt,         // Expiration: cuándo expira
    
    // Datos del usuario (igual que en PHP)
    data: {
      id: payload.id,
      nombre: payload.nombre,
      correo: payload.correo,
      tipo_usuario: payload.tipo_usuario
    }
  };

  // Generamos el token usando el algoritmo HS256
  // Esto es exactamente lo que hace JWT::encode() en PHP
  return jwt.sign(fullPayload, JWT_SECRET, { algorithm: 'HS256' });
}

/**
 * Verifica y decodifica un token JWT
 * 
 * @param token - Token JWT a verificar
 * @returns Payload del token si es válido
 * @throws Error si el token es inválido o expiró
 * 
 * Equivalente en PHP:
 * $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
 */
export function verifyToken(token: string): JWTPayload {
  try {
    // Verificamos el token con las mismas opciones que en PHP
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],           // Solo aceptamos HS256
      issuer: JWT_ISSUER,              // Verificamos el emisor
      audience: JWT_AUDIENCE,          // Verificamos la audiencia
    }) as any;

    // Extraemos los datos del usuario del claim 'data'
    // (igual estructura que en PHP: $decoded->data)
    return {
      id: decoded.data.id,
      nombre: decoded.data.nombre,
      correo: decoded.data.correo,
      tipo_usuario: decoded.data.tipo_usuario
    };
  } catch (error) {
    // Si el token es inválido, expiró, o fue manipulado
    // jwt.verify() lanza un error
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    }
    throw new Error('Error al verificar token');
  }
}

/**
 * Extrae el token del header Authorization
 * 
 * @param authHeader - Header completo "Bearer <token>"
 * @returns Solo el token, sin el prefijo "Bearer"
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  // Verificamos que el header exista y tenga el formato correcto
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Extraemos solo el token (después de "Bearer ")
  return authHeader.substring(7);
}