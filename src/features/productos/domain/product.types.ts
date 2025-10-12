// src/features/productos/domain/product.types.ts

// ====================================
// ENUMS Y TIPOS
// ====================================

/**
 * Categorías permitidas para productos
 * Coincide con el ENUM de MySQL
 */
export type ProductCategory = 'Juego' | 'Consola' | 'Tarjeta' | 'Figura';

/**
 * Consolas/plataformas disponibles
 */
export type ProductConsole = 'PlayStation' | 'Xbox' | 'Nintendo' | 'PC';

// ====================================
// DTOs DE ENTRADA
// ====================================

/**
 * DTO para crear un nuevo producto
 */
export interface CreateProductDTO {
  nombre: string;
  consola: string;
  categoria: ProductCategory;
  precio: string | number;  // Puede venir como string o number
  stock: number;
  descripcion?: string;
  // imagen_url se agrega después con el upload
}

/**
 * DTO para actualizar un producto
 * Todos los campos son opcionales
 */
export interface UpdateProductDTO {
  nombre?: string;
  consola?: string;
  categoria?: ProductCategory;
  precio?: string | number;
  stock?: number;
  descripcion?: string;
  imagen_url?: string;
}

// ====================================
// DTOs DE SALIDA
// ====================================

/**
 * Estructura de un producto completo
 * Coincide con la tabla de MySQL
 */
export interface ProductResponse {
  id: string;
  nombre: string;
  consola: string;
  categoria: ProductCategory;
  precio: string;  // MySQL devuelve DECIMAL como string
  stock: number;
  descripcion: string | null;
  imagen_url: string | null;
  fecha_creacion: string;
}

/**
 * Respuesta al listar productos
 * Coincide con lo que espera el frontend Angular
 */
export interface ProductsListResponse {
  records: ProductResponse[];
}

/**
 * Respuesta genérica para operaciones CRUD
 */
export interface ProductApiResponse {
  success: boolean;
  message: string;
  id?: string;  // ID del producto creado
}

/**
 * Respuesta después de subir imagen
 */
export interface UploadImageResponse {
  success: boolean;
  message: string;
  url: string;  // URL de la imagen subida
}