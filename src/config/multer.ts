// src/config/multer.ts

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ====================================
// CONFIGURACIÓN DE ALMACENAMIENTO
// ====================================

/**
 * Configuración de dónde y cómo guardar los archivos
 */
const storage = multer.diskStorage({
  
  /**
   * Destino: Carpeta donde se guardarán los archivos
   * @param req - Request de Express
   * @param file - Archivo subido
   * @param cb - Callback con la ruta de destino
   */
  destination: (req, file, cb) => {
    // Guardar en: uploads/productos/
    cb(null, 'uploads/productos');
  },

  /**
   * Nombre del archivo: Genera un nombre único
   * Formato: uuid-timestamp.extensión
   * Ejemplo: a1b2c3d4-1704672000000.jpg
   * 
   * @param req - Request de Express
   * @param file - Archivo subido (contiene originalname, mimetype, etc)
   * @param cb - Callback con el nombre del archivo
   */
  filename: (req, file, cb) => {
    // Obtener la extensión del archivo original
    // Ejemplo: "zelda.jpg" → ".jpg"
    const ext = path.extname(file.originalname);
    
    // Generar nombre único: uuid-timestamp + extensión
    const uniqueName = `${uuidv4()}-${Date.now()}${ext}`;
    
    cb(null, uniqueName);
  }
});

// ====================================
// FILTRO DE ARCHIVOS (VALIDACIÓN)
// ====================================

/**
 * Filtra qué tipos de archivos se permiten
 * Solo acepta imágenes: jpg, jpeg, png, gif, webp
 * 
 * @param req - Request de Express
 * @param file - Archivo subido
 * @param cb - Callback con true (aceptar) o false (rechazar)
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  
  // Tipos MIME permitidos
  const allowedMimeTypes = [
    'image/jpeg',      // .jpg, .jpeg
    'image/png',       // .png
    'image/gif',       // .gif
    'image/webp'       // .webp
  ];

  // Verificar si el tipo de archivo está permitido
  if (allowedMimeTypes.includes(file.mimetype)) {
    // Aceptar el archivo
    cb(null, true);
  } else {
    // Rechazar el archivo
    cb(new Error('Solo se permiten imágenes (JPG, PNG, GIF, WEBP).'));
  }
};

// ====================================
// CONFIGURACIÓN FINAL DE MULTER
// ====================================

/**
 * Instancia de Multer con todas las configuraciones
 */
export const uploadProductImage = multer({
  storage: storage,              // Dónde y cómo guardar
  fileFilter: fileFilter,        // Qué tipos de archivo aceptar
  limits: {
    fileSize: 5 * 1024 * 1024    // Límite de tamaño: 5MB
  }
});

/**
 * Middleware listo para usar en las rutas
 * Uso: router.post('/ruta', uploadProductImage.single('imagen'), controller)
 * 
 * .single('imagen') significa:
 * - Solo un archivo por petición
 * - El campo del FormData debe llamarse 'imagen'
 */