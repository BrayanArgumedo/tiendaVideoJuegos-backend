// src/app.ts

import express from 'express';
import cors from 'cors';
import path from 'path';
import userRoutes from './features/usuarios/infrastructure/user.routes';
import productRoutes from './features/productos/infrastructure/product.routes';
import orderRoutes from './features/pedidos/infrastructure/order.routes';
import reportRoutes from './features/reportes/infrastructure/report.routes';  

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
app.use('/api/productos', productRoutes);

/**
 * Rutas de pedidos
 * Base: /api/pedidos
 */
app.use('/api/pedidos', orderRoutes);  

/**
 * Rutas de reportes
 * Base: /api
 */
app.use('/api', reportRoutes);  


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
      pedidos: '/api/pedidos',      
      reportes: '/api/pedidos/:id/factura/pdf', 
      uploads: '/uploads'
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