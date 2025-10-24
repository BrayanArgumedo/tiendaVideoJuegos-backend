// src/core/structures/Queue.ts

/**
 * Cola (Queue) - Estructura FIFO (First In, First Out)
 * 
 * El primero en entrar es el primero en salir
 * Ejemplo: Fila del banco, cola de impresión
 * 
 * Uso en el proyecto:
 * - Procesar emails de confirmación de pedidos
 * - Enviar notificaciones asíncronas
 */

export class Queue<T> {
  // Array privado para almacenar los elementos
  private items: T[] = [];

  /**
   * ENQUEUE (Encolar)
   * Agrega un elemento al FINAL de la cola
   * Complejidad: O(1) - Constante
   * 
   * @param item - Elemento a agregar
   */
  enqueue(item: T): void {
    this.items.push(item);
  }

  /**
   * DEQUEUE (Desencolar)
   * Saca el elemento del INICIO de la cola
   * Complejidad: O(n) - Lineal (porque shift reorganiza el array)
   * 
   * @returns El primer elemento o undefined si está vacía
   */
  dequeue(): T | undefined {
    return this.items.shift();  // Remueve y retorna el primero
  }

  /**
   * PEEK (Espiar)
   * Ver el primer elemento SIN sacarlo
   * Complejidad: O(1) - Constante
   * 
   * @returns El primer elemento o undefined si está vacía
   */
  peek(): T | undefined {
    return this.items[0];
  }

  /**
   * SIZE (Tamaño)
   * Retorna la cantidad de elementos en la cola
   * Complejidad: O(1) - Constante
   * 
   * @returns Número de elementos
   */
  size(): number {
    return this.items.length;
  }

  /**
   * IS_EMPTY (Está vacía)
   * Verifica si la cola está vacía
   * Complejidad: O(1) - Constante
   * 
   * @returns true si está vacía, false si tiene elementos
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * CLEAR (Limpiar)
   * Elimina todos los elementos de la cola
   * Complejidad: O(1) - Constante
   */
  clear(): void {
    this.items = [];
  }

  /**
   * TO_ARRAY (A array)
   * Retorna una copia del contenido de la cola
   * Útil para debugging
   * 
   * @returns Array con los elementos
   */
  toArray(): T[] {
    return [...this.items];  // Copia del array
  }
}