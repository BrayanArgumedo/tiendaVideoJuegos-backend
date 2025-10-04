// src/app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import userRoutes from './features/usuarios/infrastructure/user.routes'; // <-- IMPORTA

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({ message: '¡La API está funcionando con TypeScript!' });
});

// Le decimos a la app que todas las rutas en 'userRoutes'
// comenzarán con '/api/usuarios'
app.use('/api/usuarios', userRoutes); // <-- USA LAS RUTAS

export default app;