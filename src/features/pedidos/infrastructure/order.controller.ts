// src/features/pedidos/infrastructure/order.controller.ts

import { Request, Response } from 'express';
import { OrderService } from '../application/order.service';
import { 
  CreateOrderDTO, 
  UpdateOrderStatusDTO,
  OrderFilters 
} from '../domain/order.types';

/**
 * OrderController - Controlador de Pedidos
 * 
 * Maneja las peticiones HTTP relacionadas con pedidos
 * Delega la lógica de negocio al OrderService
 * 
 * Responsabilidades:
 * - Validar datos de entrada
 * - Extraer datos del request
 * - Llamar al service correspondiente
 * - Formatear respuestas HTTP
 */

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  // ====================================
  // CREAR PEDIDO
  // ====================================

  /**
   * POST /api/pedidos
   * Crear un nuevo pedido
   * 
   * @param req - Request con datos del pedido
   * @param res - Response
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      // Extraer datos del body
      const orderData: CreateOrderDTO = req.body;

      // Validar datos requeridos
      if (!orderData.productos || orderData.productos.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Debes incluir al menos un producto'
        });
        return;
      }

      if (!orderData.metodo_envio) {
        res.status(400).json({
          success: false,
          message: 'Debes especificar un método de envío'
        });
        return;
      }

      // ⬅️ COMENTADO: direccion_envio es opcional, el service usa valor por defecto
      // if (!orderData.direccion_envio || orderData.direccion_envio.trim() === '') {
      //   res.status(400).json({
      //     success: false,
      //     message: 'Debes especificar una dirección de envío'
      //   });
      //   return;
      // }

      // Obtener ID del usuario autenticado
      const userId = (req as any).user.id;

      // Crear pedido
      const result = await this.orderService.create(orderData, userId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);

    } catch (error: any) {
      console.error('❌ Error en OrderController.create:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // ====================================
  // OBTENER PEDIDOS DEL USUARIO
  // ====================================

  /**
   * GET /api/pedidos
   * Obtener todos los pedidos del usuario autenticado
   * 
   * @param req - Request
   * @param res - Response
   */
  getUserOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      // Obtener ID del usuario autenticado
      const userId = (req as any).user.id;

      // Obtener pedidos del usuario
      const result = await this.orderService.getUserOrders(userId);

      res.status(200).json(result);

    } catch (error: any) {
      console.error('❌ Error en OrderController.getUserOrders:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los pedidos'
      });
    }
  };

  // ====================================
  // OBTENER TODOS LOS PEDIDOS (ADMIN)
  // ====================================

  /**
   * GET /api/admin/pedidos
   * Obtener todos los pedidos (solo admin)
   * 
   * @param req - Request con query params opcionales
   * @param res - Response
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      // Extraer filtros de query params
      const filters: OrderFilters = {};

      if (req.query.estado) {
        filters.estado = req.query.estado as any;
      }

      if (req.query.metodo_envio) {
        filters.metodo_envio = req.query.metodo_envio as any;
      }

      if (req.query.fecha_desde) {
        filters.fecha_desde = new Date(req.query.fecha_desde as string);
      }

      if (req.query.fecha_hasta) {
        filters.fecha_hasta = new Date(req.query.fecha_hasta as string);
      }

      // Obtener todos los pedidos
      const result = await this.orderService.getAll(filters);

      res.status(200).json(result);

    } catch (error: any) {
      console.error('❌ Error en OrderController.getAll:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los pedidos'
      });
    }
  };

  // ====================================
  // OBTENER PEDIDO POR ID
  // ====================================

  /**
   * GET /api/pedidos/:id
   * Obtener un pedido específico
   * 
   * @param req - Request con ID del pedido
   * @param res - Response
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const isAdmin = (req as any).user.tipo_usuario === 'admin';

      // Obtener pedido
      const result = await this.orderService.getById(id, userId, isAdmin);

      res.status(200).json(result);

    } catch (error: any) {
      console.error('❌ Error en OrderController.getById:', error);

      // Manejar errores específicos
      if (error.message === 'Pedido no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error.message === 'No tienes permiso para ver este pedido') {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener el pedido'
      });
    }
  };

  // ====================================
  // ACTUALIZAR ESTADO DEL PEDIDO
  // ====================================

  /**
   * PUT /api/pedidos/:id/estado
   * Actualizar el estado de un pedido (solo admin)
   * 
   * @param req - Request con ID y nuevo estado
   * @param res - Response
   */
  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateOrderStatusDTO = req.body;
      const adminId = (req as any).user.id;

      // Validar que se envió el estado
      if (!data.estado) {
        res.status(400).json({
          success: false,
          message: 'Debes especificar el nuevo estado'
        });
        return;
      }

      // Validar que el estado sea válido
      const validStates = ['procesando', 'enviado', 'completado', 'cancelado'];
      if (!validStates.includes(data.estado)) {
        res.status(400).json({
          success: false,
          message: `Estado inválido. Estados válidos: ${validStates.join(', ')}`
        });
        return;
      }

      // Actualizar estado
      const result = await this.orderService.updateStatus(id, data, adminId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);

    } catch (error: any) {
      console.error('❌ Error en OrderController.updateStatus:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el estado del pedido'
      });
    }
  };

  // ====================================
  // OBTENER ESTADÍSTICAS (ADMIN)
  // ====================================

  /**
   * GET /api/admin/pedidos/estadisticas
   * Obtener estadísticas de pedidos (solo admin)
   * 
   * @param req - Request
   * @param res - Response
   */
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.orderService.getStats();

      res.status(200).json({
        success: true,
        estadisticas: stats
      });

    } catch (error: any) {
      console.error('❌ Error en OrderController.getStats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las estadísticas'
      });
    }
  };

  // ====================================
  // OBTENER HISTORIAL DE CAMBIOS
  // ====================================

  /**
   * GET /api/pedidos/:id/historial
   * Obtener historial de cambios de estado de un pedido
   * 
   * @param req - Request con ID del pedido
   * @param res - Response
   */
  getStatusHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const isAdmin = (req as any).user.tipo_usuario === 'admin';

      // Verificar que el pedido existe y el usuario tiene permiso
      await this.orderService.getById(id, userId, isAdmin);

      // Obtener historial del Stack
      const historial = this.orderService.getStatusHistory(id);

      res.status(200).json({
        success: true,
        historial
      });

    } catch (error: any) {
      console.error('❌ Error en OrderController.getStatusHistory:', error);

      if (error.message === 'Pedido no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error.message === 'No tienes permiso para ver este pedido') {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener el historial'
      });
    }
  };
}