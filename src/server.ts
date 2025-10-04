// src/server.ts
import './dotenv.config'; // <-- 1. IMPORTA Y EJECUTA LA CONFIGURACIÓN PRIMERO

import app from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  });
};

startServer();