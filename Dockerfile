# Dockerfile (versión para desarrollo)

# 1. Usa una imagen de Node que ya incluye todas las herramientas necesarias.
FROM node:18

# 2. Establece el directorio de trabajo dentro del contenedor.
WORKDIR /app

# 3. Copia los archivos de dependencias.
COPY package*.json ./

# 4. Instala TODAS las dependencias (incluyendo las de desarrollo como nodemon y ts-node).
RUN npm install

# 5. Copia el resto de tu código.
COPY . .

# 6. Expone el puerto que usa tu servidor Express.
EXPOSE 8000

# NOTA: El comando para iniciar la aplicación lo pondremos en docker-compose.yml
# para tener más control.