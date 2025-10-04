import { Router } from 'express';
import { UserController } from './user.controller';

const router = Router();
const userController = new UserController();

// La ruta POST /registro que llama al método register del controlador
router.post('/registro', userController.register);

export default router;