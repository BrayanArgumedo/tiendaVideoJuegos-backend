// src/features/usuarios/application/user.service.ts

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import pool from '../../../config/database';
import { generateToken } from '../../../config/jwt';
import { 
  RegisterUserDTO, 
  LoginUserDTO, 
  LoginResponse 
} from '../domain/user.types';

export class UserService {
  
  // ====================================
  // MÉTODO REGISTER (Ya existente, sin cambios)
  // ====================================
  async register(userData: RegisterUserDTO): Promise<any> {
    const { nombre, apellido, correo, password, telefono, direccion, pais } = userData;

    // Validación de campos obligatorios
    if (!nombre || !apellido || !correo || !password) {
      const error = new Error('Faltan campos requeridos.');
      (error as any).statusCode = 400;
      throw error;
    }

    const connection = await pool.getConnection();

    try {
      // Verificar si el correo ya existe
      const [existingUser]: any = await connection.execute(
        'SELECT id FROM usuarios WHERE correo = ?',
        [correo]
      );

      if (existingUser.length > 0) {
        const error = new Error('El correo electrónico ya está registrado.');
        (error as any).statusCode = 409;
        throw error;
      }

      // Encriptar password y crear usuario
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const newUserId = uuidv4();

      await connection.execute(
        `INSERT INTO usuarios (id, nombre, apellido, correo, password_hash, telefono, direccion, pais, tipo_usuario)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'comprador')`,
        [newUserId, nombre, apellido, correo, passwordHash, telefono || null, direccion || null, pais || null]
      );

      return { 
        success: true,
        message: 'Usuario registrado exitosamente',
        user: { id: newUserId, correo } 
      };
    } finally {
      connection.release();
    }
  }

  // ====================================
  // MÉTODO LOGIN (NUEVO)
  // ====================================
  
  /**
   * Autentica un usuario y genera un token JWT
   * 
   * @param credentials - Correo y password del usuario
   * @returns Objeto con success, message y token
   * 
   * Equivalente en PHP: src/api/usuarios/login.php
   */
  async login(credentials: LoginUserDTO): Promise<LoginResponse> {
    const { correo, password } = credentials;

    // 1. Validar que vengan los datos necesarios
    if (!correo || !password) {
      const error = new Error('Correo y contraseña son requeridos.');
      (error as any).statusCode = 400;
      throw error;
    }

    const connection = await pool.getConnection();

    try {
      // 2. Buscar el usuario por correo
      // Equivalente en PHP: $usuario->findByEmail($data->correo)
      const [users]: any = await connection.execute(
        'SELECT id, nombre, apellido, correo, password_hash, tipo_usuario FROM usuarios WHERE correo = ?',
        [correo]
      );

      // 3. Verificar que el usuario existe
      if (users.length === 0) {
        const error = new Error('Credenciales incorrectas.');
        (error as any).statusCode = 401; // Unauthorized
        throw error;
      }

      const user = users[0];

      // 4. Comparar el password con el hash almacenado
      // Equivalente en PHP: password_verify($data->password, $usuario->password_hash)
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        const error = new Error('Credenciales incorrectas.');
        (error as any).statusCode = 401;
        throw error;
      }

      // 5. Generar el token JWT con los datos del usuario
      // Equivalente en PHP: JWT::encode($payload, $secret_key, 'HS256')
      const token = generateToken({
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        tipo_usuario: user.tipo_usuario
      });

      // 6. Devolver respuesta exitosa con el token
      return {
        success: true,
        message: 'Inicio de sesión exitoso.',
        token
      };

    } finally {
      connection.release();
    }
  }

  // ====================================
  // MÉTODO GETALL - Listar todos los usuarios (ADMIN)
  // ====================================
  
  /**
   * Obtiene la lista completa de usuarios
   * Solo para administradores
   * 
   * Equivalente en PHP: src/api/usuarios/collection.php (GET)
   */
  async getAll(): Promise<any> {
    const connection = await pool.getConnection();

    try {
      // Seleccionamos todos los campos EXCEPTO password_hash por seguridad
      const [users]: any = await connection.execute(
        `SELECT id, nombre, apellido, correo, telefono, direccion, pais, tipo_usuario, fecha_creacion 
         FROM usuarios 
         ORDER BY fecha_creacion DESC`
      );

      return {
        records: users
      };
    } finally {
      connection.release();
    }
  }

  // ====================================
  // MÉTODO UPDATE - Actualizar usuario (ADMIN)
  // ====================================
  
  /**
   * Actualiza los datos de un usuario
   * Solo para administradores
   * 
   * Equivalente en PHP: src/api/usuarios/manager.php (PUT)
   */
  async update(id: string, updateData: any): Promise<any> {
    const connection = await pool.getConnection();

    try {
      // Verificar que el usuario existe
      const [users]: any = await connection.execute(
        'SELECT id FROM usuarios WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        const error = new Error('Usuario no encontrado.');
        (error as any).statusCode = 404;
        throw error;
      }

      // Construir la query dinámicamente según los campos que vengan
      const allowedFields = ['nombre', 'apellido', 'correo', 'telefono', 'direccion', 'pais', 'tipo_usuario'];
      const updates: string[] = [];
      const values: any[] = [];

      // Solo actualizar los campos que vengan en updateData
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      }

      if (updates.length === 0) {
        const error = new Error('No hay campos para actualizar.');
        (error as any).statusCode = 400;
        throw error;
      }

      // Agregar el ID al final de los valores
      values.push(id);

      // Ejecutar la actualización
      await connection.execute(
        `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      return {
        success: true,
        message: 'Usuario actualizado exitosamente.'
      };
    } finally {
      connection.release();
    }
  }

  // ====================================
  // MÉTODO DELETE - Eliminar usuario (ADMIN)
  // ====================================
  
  /**
   * Elimina un usuario del sistema
   * Solo para administradores
   * 
   * Equivalente en PHP: src/api/usuarios/manager.php (DELETE)
   */
  async delete(id: string): Promise<any> {
    const connection = await pool.getConnection();

    try {
      // Verificar que el usuario existe
      const [users]: any = await connection.execute(
        'SELECT id FROM usuarios WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        const error = new Error('Usuario no encontrado.');
        (error as any).statusCode = 404;
        throw error;
      }

      // Eliminar el usuario
      await connection.execute('DELETE FROM usuarios WHERE id = ?', [id]);

      return {
        success: true,
        message: 'Usuario eliminado exitosamente.'
      };
    } finally {
      connection.release();
    }
  }
  
}