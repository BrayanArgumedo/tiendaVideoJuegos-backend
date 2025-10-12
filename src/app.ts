// src/app.ts

import express from 'express';
import cors from 'cors';
import path from 'path';  // ← NUEVO
import userRoutes from './features/usuarios/infrastructure/user.routes';
import productRoutes from './features/productos/infrastructure/product.routes';  // ← NUEVO

const app = express();

// ====================================
// MIDDLEWARES GLOBALES
// ====================================

// CORS - Permitir peticiones desde Angular (localhost:4200)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));

// Parser de JSON - Para leer req.body en formato JSON
app.use(express.json());

// Parser de URL encoded - Para formularios
app.use(express.urlencoded({ extended: true }));

// ====================================
// SERVIR ARCHIVOS ESTÁTICOS
// ====================================

/**
 * Servir imágenes y archivos subidos
 * 
 * Ruta URL: http://localhost:8000/uploads/productos/imagen.jpg
 * Ruta física: TiendaVideogames/uploads/productos/imagen.jpg
 * 
 * express.static busca archivos en la carpeta especificada
 * y los sirve directamente sin procesamiento
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ====================================
// RUTAS DE LA API
// ====================================

/**
 * Rutas de usuarios
 * Base: /api/usuarios
 */
app.use('/api/usuarios', userRoutes);

/**
 * Rutas de productos
 * Base: /api/productos
 */
app.use('/api/productos', productRoutes);  // ← NUEVO

// ====================================
// RUTA DE PRUEBA (Health Check)
// ====================================

app.get('/', (req, res) => {
  res.json({
    message: 'API de GameTrade funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      usuarios: '/api/usuarios',
      productos: '/api/productos',
      uploads: '/uploads'  // ← NUEVO
    }
  });
});

// ====================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// ====================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`
  });
});

export default app;