# Dockerfile (versión para producción en Railway)

# 1. Usa una imagen de Node que ya incluye todas las herramientas necesarias.
FROM node:18

# 2. Establece el directorio de trabajo dentro del contenedor.
WORKDIR /app

# 3. Copia los archivos de dependencias.
COPY package*.json ./

# 4. Instala TODAS las dependencias (incluyendo las de desarrollo para compilar TypeScript).
RUN npm install

# 5. Copia el resto de tu código.
COPY . .

# 6. Compila TypeScript a JavaScript
RUN npm run build

# 7. Expone el puerto que Railway asignará automáticamente.
EXPOSE 8000

# 8. Comando para iniciar la aplicación en producción
CMD ["npm", "start"]