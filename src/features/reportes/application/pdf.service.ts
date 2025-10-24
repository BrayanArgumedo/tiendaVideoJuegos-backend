// src/features/reportes/application/pdf.service.ts

import PDFDocument from 'pdfkit';
import pool from '../../../config/database';
import { OrderData } from '../../pedidos/domain/order.types';

/**
 * PDFService - Servicio de generación de PDFs
 * 
 * Genera documentos PDF profesionales para:
 * - Facturas de pedidos
 * - Reportes de ventas
 * - Reportes de inventario
 * 
 * Usa: PDFKit (ligera y poderosa librería de PDFs)
 */

export class PDFService {
  /**
   * GENERAR FACTURA DE PEDIDO
   * 
   * Genera un PDF con la factura completa de un pedido
   * Incluye: datos del cliente, productos, descuentos, totales
   * 
   * @param orderId - ID del pedido
   * @returns Buffer del PDF generado
   */
  async generateInvoice(orderId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Obtener datos completos del pedido
        const order = await this.getOrderForInvoice(orderId);

        if (!order) {
          throw new Error('Pedido no encontrado');
        }

        // Crear documento PDF
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        // Array para almacenar los chunks del PDF
        const buffers: Buffer[] = [];

        // Capturar los datos del PDF
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // ====================================
        // HEADER - Encabezado
        // ====================================
        this.generateHeader(doc);

        // ====================================
        // INFORMACIÓN DEL PEDIDO
        // ====================================
        this.generateOrderInfo(doc, order);

        // ====================================
        // INFORMACIÓN DEL CLIENTE
        // ====================================
        this.generateCustomerInfo(doc, order);

        // ====================================
        // TABLA DE PRODUCTOS
        // ====================================
        this.generateProductsTable(doc, order);

        // ====================================
        // TOTALES
        // ====================================
        this.generateTotals(doc, order);

        // ====================================
        // FOOTER - Pie de página
        // ====================================
        this.generateFooter(doc);

        // Finalizar el documento
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * GENERAR REPORTE DE VENTAS
   * 
   * Genera un PDF con el reporte de ventas en un rango de fechas
   * 
   * @param fechaInicio - Fecha de inicio
   * @param fechaFin - Fecha de fin
   * @returns Buffer del PDF generado
   */
  async generateSalesReport(fechaInicio: Date, fechaFin: Date): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Obtener datos de ventas
        const salesData = await this.getSalesData(fechaInicio, fechaFin);

        // Crear documento PDF
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // ====================================
        // HEADER DEL REPORTE
        // ====================================
        this.generateReportHeader(doc, 'REPORTE DE VENTAS');

        // ====================================
        // RANGO DE FECHAS
        // ====================================
        doc.fontSize(12)
           .text(`Período: ${this.formatDate(fechaInicio)} - ${this.formatDate(fechaFin)}`, 50, 150);

        doc.moveDown();

        // ====================================
        // RESUMEN DE VENTAS
        // ====================================
        this.generateSalesSummary(doc, salesData);

        // ====================================
        // TABLA DE VENTAS
        // ====================================
        this.generateSalesTable(doc, salesData.orders);

        // ====================================
        // FOOTER
        // ====================================
        this.generateFooter(doc);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  // ====================================
  // MÉTODOS AUXILIARES - FACTURA
  // ====================================

  /**
   * Generar encabezado del PDF
   */
  private generateHeader(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(20)
      .text('GAMETRADE', 50, 50, { align: 'left' })
      .fontSize(10)
      .text('Tienda de Videojuegos', 50, 75)
      .text('Montería, Córdoba - Colombia', 50, 90)
      .text('Tel: +57 300 123 4567', 50, 105)
      .text('Email: info@gametrade.com', 50, 120);

    // Título FACTURA en el lado derecho
    doc
      .fontSize(25)
      .text('FACTURA', 350, 50, { align: 'right' });

    // Línea separadora
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, 150)
      .lineTo(550, 150)
      .stroke();
  }

  /**
   * Generar información del pedido
   */
  private generateOrderInfo(doc: PDFKit.PDFDocument, order: any): void {
    const y = 170;

    doc
      .fontSize(10)
      .text(`Factura No: ${order.id.substring(0, 8).toUpperCase()}`, 350, y, { align: 'right' })
      .text(`Fecha: ${this.formatDate(order.fecha_pedido)}`, 350, y + 15, { align: 'right' })
      .text(`Estado: ${this.formatStatus(order.estado)}`, 350, y + 30, { align: 'right' });
  }

  /**
   * Generar información del cliente
   */
  private generateCustomerInfo(doc: PDFKit.PDFDocument, order: any): void {
    const y = 170;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('CLIENTE:', 50, y);

    doc
      .font('Helvetica')
      .text(`${order.usuario.nombre} ${order.usuario.apellido}`, 50, y + 15)
      .text(`Email: ${order.usuario.correo}`, 50, y + 30)
      .text(`Teléfono: ${order.usuario.telefono}`, 50, y + 45)
      .text(`Dirección de envío: ${order.direccion_envio}`, 50, y + 60);
  }

  /**
   * Generar tabla de productos
   */
  private generateProductsTable(doc: PDFKit.PDFDocument, order: any): void {
    const tableTop = 300;
    const itemCodeX = 50;
    const descriptionX = 150;
    const quantityX = 350;
    const priceX = 420;
    const amountX = 500;

    // Headers de la tabla
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('PRODUCTO', descriptionX, tableTop)
      .text('CANT.', quantityX, tableTop)
      .text('PRECIO', priceX, tableTop)
      .text('TOTAL', amountX, tableTop);

    // Línea debajo de los headers
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Items
    let y = tableTop + 30;

    doc.font('Helvetica');

    for (const item of order.detalles) {
      const total = item.cantidad * item.precio_unitario;

      doc
        .fontSize(10)
        .text(item.producto.nombre, descriptionX, y, { width: 180 })
        .text(item.cantidad.toString(), quantityX, y)
        .text(`$${this.formatCurrency(item.precio_unitario)}`, priceX, y)
        .text(`$${this.formatCurrency(total)}`, amountX, y);

      y += 30;
    }
  }

  /**
   * Generar totales
   */
  private generateTotals(doc: PDFKit.PDFDocument, order: any): void {
    const y = 500;

    // Línea separadora
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(350, y)
      .lineTo(550, y)
      .stroke();

    // Subtotal
    doc
      .fontSize(10)
      .text('Subtotal:', 350, y + 10)
      .text(`$${this.formatCurrency(order.subtotal)}`, 480, y + 10, { align: 'right' });

    // Descuentos (si existen)
    if (order.total_descuentos && order.total_descuentos > 0) {
      doc
        .fillColor('#ff0000')
        .text('Descuentos:', 350, y + 25)
        .text(`-$${this.formatCurrency(order.total_descuentos)}`, 480, y + 25, { align: 'right' })
        .fillColor('#000000');
    }

    // Envío
    doc
      .text('Envío:', 350, y + 40)
      .text(`$${this.formatCurrency(order.costo_envio)}`, 480, y + 40, { align: 'right' });

    // Línea antes del total
    doc
      .strokeColor('#000000')
      .lineWidth(2)
      .moveTo(350, y + 60)
      .lineTo(550, y + 60)
      .stroke();

    // Total
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TOTAL:', 350, y + 70)
      .text(`$${this.formatCurrency(order.total)}`, 480, y + 70, { align: 'right' });
  }

  /**
   * Generar footer
   */
  private generateFooter(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(8)
      .fillColor('#666666')
      .text(
        'Gracias por su compra. Para cualquier consulta, contáctenos a info@gametrade.com',
        50,
        730,
        { align: 'center', width: 500 }
      );
  }

  // ====================================
  // MÉTODOS AUXILIARES - REPORTE DE VENTAS
  // ====================================

  /**
   * Generar header de reporte
   */
  private generateReportHeader(doc: PDFKit.PDFDocument, title: string): void {
    doc
      .fontSize(20)
      .text('GAMETRADE', 50, 50)
      .fontSize(16)
      .text(title, 50, 80);

    // Línea separadora
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, 120)
      .lineTo(550, 120)
      .stroke();
  }

  /**
   * Generar resumen de ventas
   */
  private generateSalesSummary(doc: PDFKit.PDFDocument, salesData: any): void {
    const y = 180;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('RESUMEN', 50, y);

    doc
      .font('Helvetica')
      .fontSize(10)
      .text(`Total de pedidos: ${salesData.totalOrders}`, 50, y + 25)
      .text(`Total de ventas: $${this.formatCurrency(salesData.totalSales)}`, 50, y + 40)
      .text(`Ticket promedio: $${this.formatCurrency(salesData.averageTicket)}`, 50, y + 55);
  }

  /**
   * Generar tabla de ventas
   */
  private generateSalesTable(doc: PDFKit.PDFDocument, orders: any[]): void {
    const tableTop = 280;
    const dateX = 50;
    const customerX = 150;
    const statusX = 300;
    const totalX = 450;

    // Headers
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('FECHA', dateX, tableTop)
      .text('CLIENTE', customerX, tableTop)
      .text('ESTADO', statusX, tableTop)
      .text('TOTAL', totalX, tableTop);

    // Línea
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Items
    let y = tableTop + 30;
    doc.font('Helvetica');

    for (const order of orders) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc
        .fontSize(9)
        .text(this.formatDate(order.fecha_pedido), dateX, y)
        .text(`${order.usuario.nombre} ${order.usuario.apellido}`, customerX, y, { width: 130 })
        .text(this.formatStatus(order.estado), statusX, y)
        .text(`$${this.formatCurrency(order.total)}`, totalX, y);

      y += 25;
    }
  }

  // ====================================
  // MÉTODOS DE CONSULTA A LA BD
  // ====================================

  /**
   * Obtener datos completos del pedido para factura
   */
  private async getOrderForInvoice(orderId: string): Promise<any> {
    const connection = await pool.getConnection();

    try {
      // Obtener pedido
      const [orderRows]: any = await connection.execute(
        `SELECT 
          p.*,
          u.nombre,
          u.apellido,
          u.correo,
          u.telefono
        FROM pedidos p
        INNER JOIN usuarios u ON p.usuario_id = u.id
        WHERE p.id = ?`,
        [orderId]
      );

      if (orderRows.length === 0) {
        return null;
      }

      const order = orderRows[0];

      // Obtener detalles
      const [detailRows]: any = await connection.execute(
        `SELECT
          d.*,
          pr.nombre,
          pr.consola
        FROM detalle_pedidos d
        INNER JOIN productos pr ON d.producto_id = pr.id
        WHERE d.pedido_id = ?`,
        [orderId]
      );

      return {
        id: order.id,
        usuario_id: order.usuario_id,
        subtotal: parseFloat(order.subtotal),
        costo_envio: parseFloat(order.costo_envio),
        total: parseFloat(order.total),
        total_descuentos: parseFloat(order.subtotal) + parseFloat(order.costo_envio) - parseFloat(order.total),
        estado: order.estado,
        metodo_envio: order.metodo_envio,
        direccion_envio: order.direccion_envio,
        fecha_pedido: order.fecha_pedido,
        usuario: {
          nombre: order.nombre,
          apellido: order.apellido,
          correo: order.correo,
          telefono: order.telefono
        },
        detalles: detailRows.map((d: any) => ({
          cantidad: d.cantidad,
          precio_unitario: parseFloat(d.precio_unitario),
          producto: {
            nombre: d.nombre,
            consola: d.consola
          }
        }))
      };

    } finally {
      connection.release();
    }
  }

  /**
   * Obtener datos de ventas para reporte
   */
  private async getSalesData(fechaInicio: Date, fechaFin: Date): Promise<any> {
    const connection = await pool.getConnection();

    try {
      // Obtener pedidos del período
      const [orders]: any = await connection.execute(
        `SELECT 
          p.*,
          u.nombre,
          u.apellido
        FROM pedidos p
        INNER JOIN usuarios u ON p.usuario_id = u.id
        WHERE p.fecha_pedido BETWEEN ? AND ?
        AND p.estado != 'cancelado'
        ORDER BY p.fecha_pedido DESC`,
        [fechaInicio, fechaFin]
      );

      // Calcular totales
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total), 0);
      const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

      return {
        totalOrders,
        totalSales,
        averageTicket,
        orders: orders.map((o: any) => ({
          fecha_pedido: o.fecha_pedido,
          estado: o.estado,
          total: parseFloat(o.total),
          usuario: {
            nombre: o.nombre,
            apellido: o.apellido
          }
        }))
      };

    } finally {
      connection.release();
    }
  }

  // ====================================
  // UTILIDADES DE FORMATO
  // ====================================

  /**
   * Formatear moneda
   */
  private formatCurrency(amount: number): string {
    return amount.toLocaleString('es-CO', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  /**
   * Formatear fecha
   */
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formatear estado
   */
  private formatStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'procesando': 'PROCESANDO',
      'enviado': 'ENVIADO',
      'completado': 'COMPLETADO',
      'cancelado': 'CANCELADO'
    };

    return statusMap[status] || status.toUpperCase();
  }
  
    /**
   * GENERAR REPORTE DE INVENTARIO
   * 
   * Genera un PDF con el listado completo de productos
   * 
   * @returns Buffer del PDF generado
   */
  async generateInventoryReport(): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Obtener datos de productos
        const inventoryData = await this.getInventoryData();

        // Crear documento PDF
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // ====================================
        // HEADER DEL REPORTE
        // ====================================
        this.generateReportHeader(doc, 'REPORTE DE INVENTARIO DE PRODUCTOS');

        // Fecha de generación
        doc.fontSize(10)
           .text(`Fecha de generación: ${this.formatDate(new Date())}`, 50, 130);

        doc.moveDown();

        // ====================================
        // RESUMEN
        // ====================================
        this.generateInventorySummary(doc, inventoryData);

        // ====================================
        // TABLA DE PRODUCTOS
        // ====================================
        this.generateInventoryTable(doc, inventoryData.products);

        // ====================================
        // FOOTER
        // ====================================
        this.generateFooter(doc);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  // ====================================
  // MÉTODOS AUXILIARES - REPORTE DE INVENTARIO
  // ====================================

  /**
   * Obtener datos de inventario
   */
  private async getInventoryData(): Promise<any> {
    const connection = await pool.getConnection();

    try {
      // Obtener todos los productos
      const [products]: any = await connection.execute(
        `SELECT 
          id,
          nombre,
          consola,
          categoria,
          precio,
          stock
        FROM productos
        ORDER BY nombre ASC`
      );

      // Calcular totales
      const totalProducts = products.length;
      const totalValue = products.reduce((sum: number, p: any) => 
        sum + (parseFloat(p.precio) * p.stock), 0
      );
      const lowStockProducts = products.filter((p: any) => p.stock < 5).length;

      return {
        totalProducts,
        totalValue,
        lowStockProducts,
        products: products.map((p: any) => ({
          nombre: p.nombre,
          consola: p.consola,
          categoria: p.categoria,
          precio: parseFloat(p.precio),
          stock: p.stock
        }))
      };

    } finally {
      connection.release();
    }
  }

  /**
   * Generar resumen de inventario
   */
  private generateInventorySummary(doc: PDFKit.PDFDocument, data: any): void {
    const y = 160;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('RESUMEN', 50, y);

    doc
      .font('Helvetica')
      .fontSize(10)
      .text(`Total de productos: ${data.totalProducts}`, 50, y + 25)
      .text(`Valor total del inventario: $${this.formatCurrency(data.totalValue)}`, 50, y + 40)
      .text(`Productos con stock bajo (<5): ${data.lowStockProducts}`, 50, y + 55);
  }

  /**
   * Generar tabla de inventario
   */
  private generateInventoryTable(doc: PDFKit.PDFDocument, products: any[]): void {
    const tableTop = 260;
    const nameX = 50;
    const categoryX = 200;
    const consoleX = 300;
    const priceX = 420;
    const stockX = 500;

    // Headers
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('NOMBRE DEL PRODUCTO', nameX, tableTop)
      .text('CATEGORÍA', categoryX, tableTop)
      .text('CONSOLA', consoleX, tableTop)
      .text('PRECIO UNIT.', priceX, tableTop)
      .text('STOCK', stockX, tableTop);

    // Línea
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Items
    let y = tableTop + 30;
    doc.font('Helvetica');

    for (const product of products) {
      // Si llegamos al final de la página, crear nueva
      if (y > 720) {
        doc.addPage();
        y = 50;
        
        // Repetir headers en nueva página
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('NOMBRE DEL PRODUCTO', nameX, y)
          .text('CATEGORÍA', categoryX, y)
          .text('CONSOLA', consoleX, y)
          .text('PRECIO UNIT.', priceX, y)
          .text('STOCK', stockX, y);
        
        doc
          .strokeColor('#aaaaaa')
          .lineWidth(1)
          .moveTo(50, y + 15)
          .lineTo(550, y + 15)
          .stroke();
        
        y += 30;
        doc.font('Helvetica');
      }

      doc
        .fontSize(9)
        .text(product.nombre, nameX, y, { width: 140 })
        .text(product.categoria, categoryX, y, { width: 90 })
        .text(product.consola, consoleX, y, { width: 110 })
        .text(`$${this.formatCurrency(product.precio)}`, priceX, y)
        .text(product.stock.toString(), stockX, y);

      y += 25;
    }
  }

}