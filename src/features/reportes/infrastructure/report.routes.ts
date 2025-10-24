// src/features/reportes/infrastructure/report.routes.ts

import { Router } from 'express';
import { ReportController } from './report.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { adminMiddleware } from '../../../middlewares/admin.middleware';

/**
 * Report Routes - Rutas de reportes y PDFs
 * 
 * Define los endpoints para generar documentos PDF
 */

const router = Router();
const reportController = new ReportController();

// ====================================
// RUTAS DE FACTURAS (USUARIOS)
// ====================================

/**
 * GET /api/pedidos/:id/factura/pdf
 * Descargar factura de un pedido en PDF
 * Requiere: autenticación
 * Permisos: el usuario solo puede descargar facturas de sus propios pedidos
 */
router.get(
  '/pedidos/:id/factura/pdf',
  authMiddleware,
  reportController.generateInvoice
);

/**
 * GET /api/pedidos/:id/factura/preview
 * Ver factura en el navegador (sin descargar)
 * Requiere: autenticación
 * Útil para previsualizar antes de descargar
 */
router.get(
  '/pedidos/:id/factura/preview',
  authMiddleware,
  reportController.previewInvoice
);

// ====================================
// RUTAS DE REPORTES (ADMIN)
// ====================================

/**
 * GET /api/admin/reportes/ventas/pdf
 * Generar reporte de ventas en PDF
 * Requiere: autenticación + permisos de admin
 * 
 * Query params opcionales:
 * - fecha_inicio: YYYY-MM-DD (default: hace 1 mes)
 * - fecha_fin: YYYY-MM-DD (default: hoy)
 * 
 * Ejemplo: /api/admin/reportes/ventas/pdf?fecha_inicio=2025-01-01&fecha_fin=2025-01-31
 */
router.get(
  '/admin/reportes/ventas/pdf',
  authMiddleware,
  adminMiddleware,
  reportController.generateSalesReport
);

/**
 * GET /api/admin/reportes/inventario/pdf
 * Generar reporte de inventario en PDF
 * Requiere: autenticación + permisos de admin
 */
router.get(
  '/admin/reportes/inventario/pdf',
  authMiddleware,
  adminMiddleware,
  reportController.generateInventoryReport
);

export default router;