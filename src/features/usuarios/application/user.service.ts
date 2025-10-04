//src/features/usuarios/application/user.service.ts

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import pool from '../../../config/database';

export class UserService {
  async register(userData: any): Promise<any> {
    const { nombre, apellido, correo, password, telefono, direccion, pais } = userData;

    if (!nombre || !apellido || !correo || !password) {
      // Usamos 'throw' para lanzar un error que el controlador atrapará
      const error = new Error('Faltan campos requeridos.');
      (error as any).statusCode = 400; // Asignamos un código de estado
      throw error;
    }

    const connection = await pool.getConnection();

    try {
      const [existingUser]: any = await connection.execute(
        'SELECT id FROM usuarios WHERE correo = ?',
        [correo]
      );

      if (existingUser.length > 0) {
        const error = new Error('El correo electrónico ya está registrado.');
        (error as any).statusCode = 409; // 409 Conflict
        throw error;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const newUserId = uuidv4();

      await connection.execute(
        `INSERT INTO usuarios (id, nombre, apellido, correo, password_hash, telefono, direccion, pais, tipo_usuario)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'comprador')`,
        [newUserId, nombre, apellido, correo, passwordHash, telefono || null, direccion || null, pais || null]
      );

      return { id: newUserId, correo };
    } finally {
      connection.release();
    }
  }
}