// src/core/structures/Stack.ts

/**
 * Pila (Stack) - Estructura LIFO (Last In, First Out)
 * 
 * El último en entrar es el primero en salir
 * Ejemplo: Pila de platos, historial del navegador (back/forward)
 * 
 * Uso en el proyecto:
 * - Historial de estados del pedido (procesando → enviado → completado)
 * - Posibilidad de "deshacer" cambios de estado
 * - Auditoría de cambios
 */

export class Stack<T> {
  // Array privado para almacenar los elementos
  private items: T[] = [];

  /**
   * PUSH (Apilar)
   * Agrega un elemento al TOPE de la pila
   * Complejidad: O(1) - Constante
   * 
   * @param item - Elemento a agregar
   */
  push(item: T): void {
    this.items.push(item);
  }

  /**
   * POP (Desapilar)
   * Saca el elemento del TOPE de la pila
   * Complejidad: O(1) - Constante
   * 
   * @returns El último elemento o undefined si está vacía
   */
  pop(): T | undefined {
    return this.items.pop();
  }

  /**
   * PEEK (Espiar)
   * Ver el elemento del TOPE SIN sacarlo
   * Complejidad: O(1) - Constante
   * 
   * @returns El último elemento o undefined si está vacía
   */
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  /**
   * SIZE (Tamaño)
   * Retorna la cantidad de elementos en la pila
   * Complejidad: O(1) - Constante
   * 
   * @returns Número de elementos
   */
  size(): number {
    return this.items.length;
  }

  /**
   * IS_EMPTY (Está vacía)
   * Verifica si la pila está vacía
   * Complejidad: O(1) - Constante
   * 
   * @returns true si está vacía, false si tiene elementos
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * CLEAR (Limpiar)
   * Elimina todos los elementos de la pila
   * Complejidad: O(1) - Constante
   */
  clear(): void {
    this.items = [];
  }

  /**
   * TO_ARRAY (A array)
   * Retorna una copia del contenido de la pila
   * El orden es del fondo al tope: [primero, ..., último]
   * 
   * @returns Array con los elementos
   */
  toArray(): T[] {
    return [...this.items];
  }

  /**
   * GET_HISTORY (Obtener historial)
   * Alias de toArray() para casos de uso como historial
   * 
   * @returns Array con el historial completo
   */
  getHistory(): T[] {
    return this.toArray();
  }
}