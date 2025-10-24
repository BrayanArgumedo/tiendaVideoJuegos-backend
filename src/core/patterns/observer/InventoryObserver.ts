// src/core/patterns/observer/InventoryObserver.ts

import { IObserver } from './IObserver';
import pool from '../../../config/database';
import { productIndex } from '../../structures/ProductIndex';

/**
 * InventoryObserver - Observer para actualización de inventario
 * 
 * Cuando se crea un pedido, reduce el stock de los productos automáticamente
 * Actualiza tanto la BD como el índice en memoria
 */

export class InventoryObserver implements IObserver {
  /**
   * UPDATE
   * Llamado cuando se crea un pedido
   * Reduce el stock de cada producto en el pedido
   * 
   * @param data - Datos del pedido creado
   */
  async update(data: any): Promise<void> {
    const { orderId, productos } = data;

    console.log(`📦 Actualizando inventario para pedido ${orderId}`);

    const connection = await pool.getConnection();

    try {
      // Reducir stock de cada producto
      for (const item of productos) {
        const { producto_id, cantidad } = item;

        // 1. Actualizar stock en la BD
        await connection.execute(
          'UPDATE productos SET stock = stock - ? WHERE id = ?',
          [cantidad, producto_id]
        );

        // 2. Actualizar stock en el índice (memoria)
        const product = productIndex.get(producto_id);
        if (product) {
          product.stock -= cantidad;
          productIndex.update(producto_id, product);
        }

        console.log(`   ✅ Stock reducido: Producto ${producto_id} (-${cantidad})`);
      }

      console.log(`📦 Inventario actualizado exitosamente`);

    } catch (error) {
      console.error('❌ Error actualizando inventario:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Nombre del observer
   */
  getName(): string {
    return 'InventoryObserver';
  }
}