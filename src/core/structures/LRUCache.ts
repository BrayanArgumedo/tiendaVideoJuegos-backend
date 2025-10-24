// src/core/structures/LRUCache.ts

/**
 * LRU Cache (Least Recently Used Cache)
 * Caché con política de desalojo: elimina lo menos usado recientemente
 * 
 * Ejemplo:
 * Caché con capacidad 3:
 * - Agregar A → [A]
 * - Agregar B → [A, B]
 * - Agregar C → [A, B, C]  ← LLENO
 * - Agregar D → [B, C, D]  ← A fue eliminado (más antiguo)
 * - Acceder B → [C, D, B]  ← B se mueve al final (más reciente)
 * 
 * Uso en el proyecto:
 * - Cachear productos más consultados
 * - Cachear pedidos frecuentes
 * - Reducir carga en MySQL
 */

export class LRUCache<K, V> {
  // Map mantiene el orden de inserción (ES6+)
  private cache: Map<K, V>;
  private capacity: number;

  /**
   * Constructor
   * 
   * @param capacity - Cantidad máxima de elementos
   */
  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('La capacidad debe ser mayor a 0');
    }
    
    this.cache = new Map();
    this.capacity = capacity;
  }

  /**
   * GET (Obtener)
   * Obtiene un valor por su clave
   * Si existe, lo mueve al final (marcándolo como "usado recientemente")
   * Complejidad: O(1) - Constante
   * 
   * @param key - Clave a buscar
   * @returns Valor asociado o undefined si no existe
   */
  get(key: K): V | undefined {
    // Verificar si la clave existe
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Obtener el valor
    const value = this.cache.get(key)!;

    // IMPORTANTE: Mover al final (marcarlo como reciente)
    // 1. Eliminar de su posición actual
    this.cache.delete(key);
    
    // 2. Re-insertar al final
    this.cache.set(key, value);

    return value;
  }

   /**
   * SET (Establecer)
   * Agrega o actualiza un valor en el caché
   * Si está lleno, elimina el elemento más antiguo
   * Complejidad: O(1) - Constante
   * 
   * @param key - Clave del elemento
   * @param value - Valor a almacenar
   */
  set(key: K, value: V): void {
    // Si la clave ya existe, eliminarla primero
    // (para re-insertarla al final)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Si está lleno, eliminar el más antiguo (el primero)
    if (this.cache.size >= this.capacity) {
      // Map.keys().next().value obtiene la primera clave
      const oldestKey = this.cache.keys().next().value;
      
      // Verificar que oldestKey no sea undefined (por seguridad)
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        
        // Log opcional para debugging
        // console.log(`🗑️ LRU Cache: Eliminado ${oldestKey} (más antiguo)`);
      }
    }

    // Agregar al final (más reciente)
    this.cache.set(key, value);
  }

  /**
   * HAS (Tiene)
   * Verifica si una clave existe sin afectar el orden
   * Complejidad: O(1) - Constante
   * 
   * @param key - Clave a verificar
   * @returns true si existe, false si no
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * DELETE (Eliminar)
   * Elimina un elemento específico
   * Complejidad: O(1) - Constante
   * 
   * @param key - Clave a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * CLEAR (Limpiar)
   * Elimina todos los elementos
   * Complejidad: O(1) - Constante
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * SIZE (Tamaño)
   * Retorna la cantidad de elementos actuales
   * Complejidad: O(1) - Constante
   * 
   * @returns Número de elementos
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * GET_CAPACITY (Obtener capacidad)
   * Retorna la capacidad máxima
   * 
   * @returns Capacidad máxima
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * GET_KEYS (Obtener claves)
   * Retorna todas las claves en orden (más antiguo → más reciente)
   * Útil para debugging
   * 
   * @returns Array de claves
   */
  getKeys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * TO_OBJECT (A objeto)
   * Retorna el contenido como objeto simple
   * Útil para logging y debugging
   * 
   * @returns Objeto con todas las entradas
   */
  toObject(): Record<string, V> {
    const obj: any = {};
    this.cache.forEach((value, key) => {
      obj[String(key)] = value;
    });
    return obj;
  }
}