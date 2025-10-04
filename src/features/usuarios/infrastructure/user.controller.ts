import { Request, Response } from 'express';
import { UserService } from '../application/user.service';

const userService = new UserService();

export class UserController {
  async register(req: Request, res: Response) {
    try {
      const newUser = await userService.register(req.body);
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: newUser,
      });
    } catch (error: any) {
      // Usamos el statusCode que definimos en el servicio, o 500 por defecto
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  }
}