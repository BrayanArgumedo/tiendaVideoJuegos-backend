// src/features/usuarios/domain/user.entity.ts

/**
 * Entidad de dominio: User
 * 
 * ¿Qué es una entidad?
 * - Representa un objeto del mundo real (en este caso, un usuario)
 * - Contiene la lógica de negocio relacionada con usuarios
 * - NO debe tener lógica de base de datos (eso va en el Repository)
 */
export class User {
  constructor(
    public readonly id: string,
    public nombre: string,
    public apellido: string,
    public correo: string,
    public passwordHash: string,
    public telefono: string | null = null,
    public direccion: string | null = null,
    public pais: string | null = null,
    public tipoUsuario: 'admin' | 'comprador' = 'comprador',
    public fechaCreacion: Date = new Date()
  ) {}

  // ====================================
  // MÉTODOS DE NEGOCIO
  // ====================================

  /**
   * Getter para obtener el nombre completo
   * @returns nombre y apellido concatenados
   */
  get nombreCompleto(): string {
    return `${this.nombre} ${this.apellido}`;
  }

  /**
   * Verifica si el usuario es administrador
   * @returns true si es admin, false si no
   */
  isAdmin(): boolean {
    return this.tipoUsuario === 'admin';
  }

  /**
   * Verifica si el usuario tiene toda la información completa
   * @returns true si tiene dirección, teléfono y país
   */
  hasCompleteProfile(): boolean {
    return !!(this.telefono && this.direccion && this.pais);
  }

  /**
   * Convierte la entidad a un objeto simple (para respuestas API)
   * IMPORTANTE: NO incluye el password_hash por seguridad
   */
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      correo: this.correo,
      telefono: this.telefono,
      direccion: this.direccion,
      pais: this.pais,
      tipo_usuario: this.tipoUsuario,
      fecha_creacion: this.fechaCreacion.toISOString()
    };
  }
}