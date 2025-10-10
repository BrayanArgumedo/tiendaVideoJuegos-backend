-- mysql-init/clean.sql
USE `videogames_db`;

-- Deshabilitar temporalmente las foreign keys
SET FOREIGN_KEY_CHECKS = 0;

-- Vaciar todas las tablas (pero mantener la estructura)
TRUNCATE TABLE `detalle_pedidos`;
TRUNCATE TABLE `pedidos`;
TRUNCATE TABLE `productos`;
TRUNCATE TABLE `usuarios`;

-- Rehabilitar las foreign keys
SET FOREIGN_KEY_CHECKS = 1;