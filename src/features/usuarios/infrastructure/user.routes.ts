// src/features/usuarios/infrastructure/user.routes.ts

import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { adminMiddleware } from '../../../middlewares/admin.middleware';

const router = Router();
const userController = new UserController();

// ====================================
// RUTAS PÚBLICAS (No requieren autenticación)
// ====================================

/**
 * POST /api/usuarios/registro
 * Registra un nuevo usuario
 */
router.post('/registro', (req, res) => userController.register(req, res));

/**
 * POST /api/usuarios/login
 * Autentica un usuario y devuelve token JWT
 */
router.post('/login', (req, res) => userController.login(req, res));

// ====================================
// RUTAS PROTEGIDAS (Requieren auth + admin)
// ====================================

/**
 * GET /api/usuarios
 * Lista todos los usuarios
 * Requiere: Token JWT + Rol admin
 */
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  userController.getAll(req, res);
});

/**
 * PUT /api/usuarios/:id
 * Actualiza un usuario específico
 * Requiere: Token JWT + Rol admin
 */
router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  userController.update(req, res);
});

/**
 * DELETE /api/usuarios/:id
 * Elimina un usuario específico
 * Requiere: Token JWT + Rol admin
 */
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  userController.delete(req, res);
});

export default router;