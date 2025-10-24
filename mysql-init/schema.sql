-- mysql-init/schema.sql

-- sentencias DROP para asegurar una creacion limpia
DROP TABLE IF EXISTS `detalle_pedidos`;
DROP TABLE IF EXISTS `pedidos`;
DROP TABLE IF EXISTS `productos`;
DROP TABLE IF EXISTS `usuarios`;

-- Usar la base de datos creada desde el archivo .env
USE `videogames_db`;

-- Crear la tabla de usuarios
CREATE TABLE `usuarios` (
  `id` CHAR(36) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(20) DEFAULT NULL,
  `direccion` TEXT DEFAULT NULL,
  `pais` VARCHAR(100) DEFAULT NULL,
  `tipo_usuario` ENUM('admin', 'comprador') NOT NULL DEFAULT 'comprador',
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo_UNIQUE` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Crear la tabla de productos
CREATE TABLE `productos` (
  `id` CHAR(36) NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `consola` VARCHAR(100) DEFAULT NULL,
  `categoria` ENUM('Juego', 'Consola', 'Tarjeta', 'Figura') NOT NULL,
  `precio` DECIMAL(10,2) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `descripcion` TEXT DEFAULT NULL,
  `imagen_url` VARCHAR(255) DEFAULT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Crear la tabla de pedidos
CREATE TABLE `pedidos` (
  `id` CHAR(36) NOT NULL,
  `usuario_id` CHAR(36) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `costo_envio` DECIMAL(10,2) NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `estado` ENUM('procesando', 'enviado', 'completado', 'cancelado') NOT NULL DEFAULT 'procesando',
  `metodo_envio` VARCHAR(20) DEFAULT NULL,          -- ⬅️ AGREGAR ESTA LÍNEA
  `direccion_envio` TEXT DEFAULT NULL,              -- ⬅️ AGREGAR ESTA LÍNEA
  `fecha_pedido` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pedidos_usuarios_idx` (`usuario_id`),
  CONSTRAINT `fk_pedidos_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Crear la tabla de detalle de pedidos (el contenido de cada pedido)
CREATE TABLE `detalle_pedidos` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `pedido_id` CHAR(36) NOT NULL,
  `producto_id` CHAR(36) NOT NULL,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_pedidos_pedidos_idx` (`pedido_id`),
  KEY `fk_detalle_pedidos_productos_idx` (`producto_id`),
  CONSTRAINT `fk_detalle_pedidos_pedidos` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_pedidos_productos` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;