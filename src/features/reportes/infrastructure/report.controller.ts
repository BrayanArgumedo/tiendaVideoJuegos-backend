// src/features/reportes/infrastructure/report.controller.ts

import { Request, Response } from 'express';
import { PDFService } from '../application/pdf.service';

/**
 * ReportController - Controlador de Reportes
 * 
 * Maneja las peticiones HTTP para generar PDFs
 * Delega la generación al PDFService
 * 
 * Responsabilidades:
 * - Validar parámetros
 * - Llamar al PDFService
 * - Enviar el PDF como respuesta
 */

export class ReportController {
  private pdfService: PDFService;

  constructor() {
    this.pdfService = new PDFService();
  }

  // ====================================
  // GENERAR FACTURA DE PEDIDO
  // ====================================

  /**
   * GET /api/pedidos/:id/factura/pdf
   * Generar y descargar factura de un pedido
   * 
   * @param req - Request con ID del pedido
   * @param res - Response con el PDF
   */
  generateInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const isAdmin = (req as any).user.tipo_usuario === 'admin';

      console.log(`📄 Generando factura para pedido: ${id}`);

      // Verificar que el pedido existe y el usuario tiene permiso
      // (similar a getById en OrderController)
      if (!isAdmin) {
        // Verificar que el pedido pertenece al usuario
        const connection = await require('../../../config/database').default.getConnection();
        
        try {
          const [rows]: any = await connection.execute(
            'SELECT usuario_id FROM pedidos WHERE id = ?',
            [id]
          );

          if (rows.length === 0) {
            res.status(404).json({
              success: false,
              message: 'Pedido no encontrado'
            });
            return;
          }

          if (rows[0].usuario_id !== userId) {
            res.status(403).json({
              success: false,
              message: 'No tienes permiso para ver este pedido'
            });
            return;
          }
        } finally {
          connection.release();
        }
      }

      // Generar PDF
      const pdfBuffer = await this.pdfService.generateInvoice(id);

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=factura-${id.substring(0, 8)}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Enviar el PDF
      res.send(pdfBuffer);

      console.log(`✅ Factura generada exitosamente: ${id}`);

    } catch (error: any) {
      console.error('❌ Error en generateInvoice:', error);

      if (error.message === 'Pedido no encontrado') {
        res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error al generar la factura'
      });
    }
  };

  // ====================================
  // GENERAR REPORTE DE VENTAS (ADMIN)
  // ====================================

  /**
   * GET /api/admin/reportes/ventas/pdf
   * Generar reporte de ventas en PDF
   * 
   * Query params:
   * - fecha_inicio: YYYY-MM-DD
   * - fecha_fin: YYYY-MM-DD
   * 
   * @param req - Request con fechas
   * @param res - Response con el PDF
   */
  generateSalesReport = async (req: Request, res: Response): Promise<void> => {
    try {
      // Obtener fechas de query params
      let fechaInicio: Date;
      let fechaFin: Date;

      if (req.query.fecha_inicio && req.query.fecha_fin) {
        fechaInicio = new Date(req.query.fecha_inicio as string);
        fechaFin = new Date(req.query.fecha_fin as string);
      } else {
        // Por defecto: último mes
        fechaFin = new Date();
        fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
      }

      // Validar fechas
      if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Fechas inválidas. Formato: YYYY-MM-DD'
        });
        return;
      }

      if (fechaInicio > fechaFin) {
        res.status(400).json({
          success: false,
          message: 'La fecha de inicio no puede ser mayor que la fecha de fin'
        });
        return;
      }

      console.log(`📊 Generando reporte de ventas: ${fechaInicio.toISOString().split('T')[0]} - ${fechaFin.toISOString().split('T')[0]}`);

      // Generar PDF
      const pdfBuffer = await this.pdfService.generateSalesReport(fechaInicio, fechaFin);

      // Configurar headers para descarga
      const filename = `reporte-ventas-${fechaInicio.toISOString().split('T')[0]}-${fechaFin.toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Enviar el PDF
      res.send(pdfBuffer);

      console.log(`✅ Reporte de ventas generado exitosamente`);

    } catch (error: any) {
      console.error('❌ Error en generateSalesReport:', error);

      res.status(500).json({
        success: false,
        message: 'Error al generar el reporte de ventas'
      });
    }
  };

  // ====================================
  // VER FACTURA EN EL NAVEGADOR (PREVIEW)
  // ====================================

  /**
   * GET /api/pedidos/:id/factura/preview
   * Ver factura en el navegador sin descargar
   * 
   * @param req - Request con ID del pedido
   * @param res - Response con el PDF para visualizar
   */
  previewInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const isAdmin = (req as any).user.tipo_usuario === 'admin';

      // Verificar permisos (igual que generateInvoice)
      if (!isAdmin) {
        const connection = await require('../../../config/database').default.getConnection();
        
        try {
          const [rows]: any = await connection.execute(
            'SELECT usuario_id FROM pedidos WHERE id = ?',
            [id]
          );

          if (rows.length === 0) {
            res.status(404).json({
              success: false,
              message: 'Pedido no encontrado'
            });
            return;
          }

          if (rows[0].usuario_id !== userId) {
            res.status(403).json({
              success: false,
              message: 'No tienes permiso para ver este pedido'
            });
            return;
          }
        } finally {
          connection.release();
        }
      }

      // Generar PDF
      const pdfBuffer = await this.pdfService.generateInvoice(id);

      // Configurar headers para visualización (inline en lugar de attachment)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Length', pdfBuffer.length);

      // Enviar el PDF
      res.send(pdfBuffer);

    } catch (error: any) {
      console.error('❌ Error en previewInvoice:', error);

      if (error.message === 'Pedido no encontrado') {
        res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error al generar la vista previa'
      });
    }
  };

   // ====================================
  // GENERAR REPORTE DE INVENTARIO (ADMIN)
  // ====================================

  /**
   * GET /api/admin/reportes/inventario/pdf
   * Generar reporte de inventario en PDF
   * 
   * @param req - Request
   * @param res - Response con el PDF
   */
  generateInventoryReport = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(`📦 Generando reporte de inventario`);

      // Generar PDF
      const pdfBuffer = await this.pdfService.generateInventoryReport();

      // Configurar headers para descarga
      const filename = `reporte-inventario-${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Enviar el PDF
      res.send(pdfBuffer);

      console.log(`✅ Reporte de inventario generado exitosamente`);

    } catch (error: any) {
      console.error('❌ Error en generateInventoryReport:', error);

      res.status(500).json({
        success: false,
        message: 'Error al generar el reporte de inventario'
      });
    }
  };

}