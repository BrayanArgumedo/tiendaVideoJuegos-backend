// src/config/database.ts

import mysql from 'mysql2/promise';

// Usamos las variables de entorno que definimos en el fichero .env
const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// Creamos el pool de conexiones a la base de datos
const pool = mysql.createPool(config);

// Exportamos una función asíncrona para probar la conexión
export const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos exitosa');
    connection.release(); // Devolvemos la conexión al pool
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    // process.exit(1) detiene la aplicación si no se puede conectar a la BD.
    // Es una buena práctica para evitar que la app corra en un estado inconsistente.
    process.exit(1);
  }
};

// Exportamos el pool para poder usarlo en otras partes de la aplicación
export default pool;