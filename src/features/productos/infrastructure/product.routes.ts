// src/features/productos/infrastructure/product.routes.ts

import { Router } from 'express';
import { ProductController } from './product.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { adminMiddleware } from '../../../middlewares/admin.middleware';
import { uploadProductImage } from '../../../config/multer';  // ← NUEVO

const router = Router();
const productController = new ProductController();

// ====================================
// RUTAS PÚBLICAS (No requieren autenticación)
// ====================================

/**
 * GET /api/productos
 * Lista todos los productos disponibles
 * Acceso: Público (cualquier visitante puede ver)
 * 
 * Usado en:
 * - Página principal del catálogo
 * - Búsqueda de productos
 * - Filtros por categoría
 */
router.get('/', (req, res) => {
  productController.getAll(req, res);
});

/**
 * GET /api/productos/:id
 * Obtiene los detalles de un producto específico
 * Acceso: Público (cualquier visitante puede ver)
 * 
 * Usado en:
 * - Página de detalles del producto
 * - Vista previa del producto
 */
router.get('/:id', (req, res) => {
  productController.getById(req, res);
});

// ====================================
// RUTAS PROTEGIDAS (Requieren auth + admin)
// ====================================

/**
 * POST /api/productos
 * Crea un nuevo producto en el catálogo
 * Acceso: Solo administradores autenticados
 * 
 * Body esperado:
 * {
 *   "nombre": "The Legend of Zelda",
 *   "consola": "Nintendo Switch",
 *   "categoria": "Juego",
 *   "precio": 200000,
 *   "stock": 10,
 *   "descripcion": "Último juego de Zelda..."
 * }
 * 
 * Respuesta:
 * {
 *   "success": true,
 *   "message": "Producto creado exitosamente.",
 *   "id": "uuid-del-producto"  ← IMPORTANTE para subir imagen después
 * }
 */
router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  productController.create(req, res);
});

/**
 * PUT /api/productos/:id
 * Actualiza un producto existente
 * Acceso: Solo administradores autenticados
 * 
 * Body (todos los campos son opcionales):
 * {
 *   "nombre": "Nuevo nombre",
 *   "precio": 180000,
 *   "stock": 15
 * }
 */
router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  productController.update(req, res);
});

/**
 * DELETE /api/productos/:id
 * Elimina un producto del catálogo
 * Acceso: Solo administradores autenticados
 * 
 * NOTA: Si el producto está asociado a pedidos,
 * la BD impedirá la eliminación (foreign key constraint)
 */
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  productController.delete(req, res);
});

/**
 * POST /api/productos/:id/imagen
 * Sube la imagen de un producto
 * Acceso: Solo administradores autenticados
 * 
 * Content-Type: multipart/form-data
 * Body: FormData con campo "imagen"
 * 
 * Flujo:
 * 1. authMiddleware verifica token
 * 2. adminMiddleware verifica rol
 * 3. uploadProductImage.single('imagen') procesa el archivo
 * 4. productController.uploadImage guarda la URL en BD
 */
router.post(
  '/:id/imagen',
  authMiddleware,
  adminMiddleware,
  uploadProductImage.single('imagen'),  // ← NUEVO MIDDLEWARE
  (req, res) => {
    productController.uploadImage(req, res);
  }
);

export default router;