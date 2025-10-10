// src/features/usuarios/domain/user.types.ts

// ====================================
// DTOs DE ENTRADA (Lo que recibe el backend)
// ====================================

/**
 * DTO para el registro de un nuevo usuario
 * Todos los campos son obligatorios excepto los opcionales
 */
export interface RegisterUserDTO {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  telefono?: string;    // Opcional
  direccion?: string;   // Opcional
  pais?: string;        // Opcional
}

/**
 * DTO para el login
 * Solo necesitamos correo y contraseña
 */
export interface LoginUserDTO {
  correo: string;
  password: string;
}

/**
 * DTO para actualizar un usuario (admin)
 * Todos los campos son opcionales porque puede actualizar solo algunos
 */
export interface UpdateUserDTO {
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  pais?: string;
  tipo_usuario?: 'admin' | 'comprador';
}

// ====================================
// DTOs DE SALIDA (Lo que devuelve el backend)
// ====================================

/**
 * Respuesta después de registrar un usuario
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    correo: string;
  };
}

/**
 * Respuesta después del login
 * IMPORTANTE: Incluye el token JWT
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
}

/**
 * Respuesta genérica para operaciones CRUD
 */
export interface ApiResponse {
  success: boolean;
  message: string;
  id?: string;
}

/**
 * Estructura de un usuario completo (sin password)
 */
export interface UserResponse {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
  direccion: string | null;
  pais: string | null;
  tipo_usuario: 'admin' | 'comprador';
  fecha_creacion: string;
}

/**
 * Respuesta al listar usuarios
 */
export interface UsersListResponse {
  records: UserResponse[];
}

// ====================================
// TIPOS PARA JWT
// ====================================

/**
 * Payload que se incluirá en el JWT
 * Es lo que se desencripta del token
 */
export interface JWTPayload {
  id: string;
  nombre: string;
  correo: string;
  tipo_usuario: 'admin' | 'comprador';
}