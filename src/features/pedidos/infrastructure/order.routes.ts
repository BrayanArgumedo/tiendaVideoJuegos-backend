// src/features/pedidos/infrastructure/order.routes.ts

import { Router } from 'express';
import { OrderController } from './order.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { adminMiddleware } from '../../../middlewares/admin.middleware';

/**
 * Order Routes - Rutas del módulo de pedidos
 * 
 * Define todos los endpoints REST relacionados con pedidos
 * Aplica middlewares de autenticación y autorización
 * 
 * IMPORTANTE: El orden de las rutas importa
 * - Las rutas específicas (como /admin/all) deben ir ANTES
 * - Las rutas con parámetros (como /:id) deben ir DESPUÉS
 * - Esto evita que Express confunda "admin" con un ID
 */

const router = Router();
const orderController = new OrderController();

// ====================================
// RUTAS DE ADMINISTRADOR (PRIMERO)
// ====================================
// Estas rutas van primero porque son más específicas

/**
 * GET /api/pedidos/admin/all
 * Obtener todos los pedidos del sistema
 * Requiere: autenticación + permisos de admin
 * 
 * Query params opcionales:
 * - estado: procesando | enviado | completado | cancelado
 * - metodo_envio: standard | express | pickup
 * - fecha_desde: YYYY-MM-DD
 * - fecha_hasta: YYYY-MM-DD
 * 
 * Ejemplo: GET /api/pedidos/admin/all?estado=procesando
 */
router.get(
  '/admin/all',
  authMiddleware,
  adminMiddleware,
  orderController.getAll
);

/**
 * GET /api/pedidos/admin/estadisticas
 * Obtener estadísticas de pedidos
 * Requiere: autenticación + permisos de admin
 * 
 * Respuesta incluye:
 * - Total de pedidos
 * - Total de ventas
 * - Pedidos por estado
 * - Producto más vendido
 */
router.get(
  '/admin/estadisticas',
  authMiddleware,
  adminMiddleware,
  orderController.getStats
);

// ====================================
// RUTAS PÚBLICAS (requieren autenticación)
// ====================================

/**
 * POST /api/pedidos
 * Crear un nuevo pedido
 * Requiere: autenticación
 * 
 * Body (JSON):
 * {
 *   "productos": [
 *     { "producto_id": "uuid", "cantidad": 2 }
 *   ],
 *   "metodo_envio": "standard" | "express" | "pickup",
 *   "direccion_envio": "Calle 123 #45-67"
 * }
 * 
 * Flujo interno:
 * 1. Valida stock (ProductIndex - HashMap)
 * 2. Calcula subtotal
 * 3. Aplica descuentos (Recursividad)
 * 4. Calcula envío (Strategy Pattern)
 * 5. Crea pedido (Transacción BD)
 * 6. Notifica observers (Observer Pattern)
 *    - EmailObserver → Queue
 *    - InventoryObserver → Reduce stock
 * 7. EmailWorker procesa en segundo plano (Queue)
 */
router.post(
  '/',
  authMiddleware,
  orderController.create
);

/**
 * GET /api/pedidos
 * Obtener todos los pedidos del usuario autenticado
 * Requiere: autenticación
 * 
 * Usa: LRU Cache para pedidos consultados frecuentemente
 * 
 * Respuesta:
 * {
 *   "success": true,
 *   "records": [...],
 *   "total": 5
 * }
 */
router.get(
  '/',
  authMiddleware,
  orderController.getUserOrders
);

/**
 * GET /api/pedidos/:id
 * Obtener un pedido específico con sus detalles
 * Requiere: autenticación
 * 
 * Permisos:
 * - Usuario: solo puede ver sus propios pedidos
 * - Admin: puede ver cualquier pedido
 * 
 * Usa: LRU Cache + HashMap (ProductIndex)
 * 
 * Respuesta incluye:
 * - Datos del pedido
 * - Datos del usuario
 * - Detalles de productos con imágenes
 */
router.get(
  '/:id',
  authMiddleware,
  orderController.getById
);

/**
 * GET /api/pedidos/:id/historial
 * Obtener historial de cambios de estado de un pedido
 * Requiere: autenticación
 * 
 * Usa: Stack (estructura de datos LIFO)
 * 
 * Respuesta:
 * {
 *   "success": true,
 *   "historial": [
 *     { "estado": "procesando", "fecha": "...", "admin_id": null },
 *     { "estado": "enviado", "fecha": "...", "admin_id": "uuid" }
 *   ]
 * }
 */
router.get(
  '/:id/historial',
  authMiddleware,
  orderController.getStatusHistory
);

/**
 * PUT /api/pedidos/:id/estado
 * Actualizar el estado de un pedido
 * Requiere: autenticación + permisos de admin
 * 
 * Body (JSON):
 * {
 *   "estado": "procesando" | "enviado" | "completado" | "cancelado"
 * }
 * 
 * Validaciones de transiciones:
 * - procesando → enviado, cancelado
 * - enviado → completado, cancelado
 * - completado → [ninguno] (estado final)
 * - cancelado → [ninguno] (estado final)
 * 
 * Usa: Stack para registrar cambio en historial
 * Invalida: Caché del pedido
 */
router.put(
  '/:id/estado',
  authMiddleware,
  adminMiddleware,
  orderController.updateStatus
);

export default router;