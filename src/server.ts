// src/server.ts (VERSIÓN LIMPIA PARA PRODUCCIÓN)
import './dotenv.config';
import app from './app';
import { connectDB } from './config/database';
import { productIndex } from './core/structures/ProductIndex';
import { Queue } from './core/structures/Queue';
import { EmailTask } from './core/patterns/observer/EmailObserver';
import { EmailWorker } from './workers/email.worker';

const PORT = parseInt(process.env.PORT || '3000', 10);

const startServer = async () => {
  console.log('🔧 Iniciando servidor...');
  console.log('📍 Puerto:', PORT);
  console.log('🔌 DB Host:', process.env.DB_HOST || 'NO DEFINIDO');
  console.log('👤 DB User:', process.env.DB_USER || 'NO DEFINIDO');
  console.log('🔑 DB Password:', process.env.DB_PASSWORD ? '***DEFINIDO***' : 'NO DEFINIDO');
  console.log('💾 DB Database:', process.env.DB_DATABASE || 'NO DEFINIDO');

  console.log('🔄 Conectando a la base de datos...');
  await connectDB();
  
  // Construir índice de productos
  await productIndex.build();
  console.log('📦 Índice de productos construido');
  
  // Inicializar cola de emails
  const emailQueue = new Queue<EmailTask>();
  
  // Iniciar worker de emails
  const emailWorker = new EmailWorker(emailQueue, 5000);
  emailWorker.start();
  
  // Guardar instancias globales para uso en la aplicación
  (global as any).emailQueue = emailQueue;
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
};

startServer();