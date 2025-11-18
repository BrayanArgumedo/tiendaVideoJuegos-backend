# 🚂 Guía de Deployment en Railway

Esta guía te ayudará a desplegar tu backend de tienda de videojuegos en Railway paso a paso.

## 📋 Pre-requisitos

- [ ] Cuenta en Railway (https://railway.app)
- [ ] Cuenta en GitHub (para conectar el repositorio)
- [ ] Tu código debe estar en un repositorio de GitHub
- [ ] Cuenta en PlanetScale (opcional, para MySQL gratis) o usar MySQL de Railway

---

## 🎯 Opción 1: Railway con MySQL de Railway (Recomendado para empezar)

### Paso 1: Crear proyecto en Railway

1. Ve a https://railway.app
2. Haz clic en **"Start a New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway para acceder a tu GitHub
5. Selecciona el repositorio `tiendaVideoJuegos-backend`
6. Railway detectará automáticamente que es un proyecto Node.js

### Paso 2: Agregar base de datos MySQL

1. En tu proyecto de Railway, haz clic en **"New"** → **"Database"** → **"Add MySQL"**
2. Railway creará automáticamente una base de datos MySQL
3. Espera a que se provisione (toma ~30 segundos)

### Paso 3: Configurar variables de entorno del backend

1. Haz clic en el servicio de tu **backend** (el que dice Node.js)
2. Ve a la pestaña **"Variables"**
3. Haz clic en **"+ New Variable"** y agrega las siguientes:

```bash
# Puerto (Railway lo asigna automáticamente, pero puedes dejarlo)
PORT=${{RAILWAY_PORT}}

# Variables de JWT
JWT_SECRET=copia_aqui_un_secreto_muy_largo_y_seguro_generado
JWT_ISSUER=gametrade.com
JWT_AUDIENCE=gametrade-app
JWT_EXP_SECONDS=86400

# URL del frontend (actualiza cuando tengas tu frontend desplegado)
FRONTEND_URL=http://localhost:4200
```

### Paso 4: Conectar el backend a MySQL

Railway crea variables de referencia automáticas. Necesitas configurar:

1. En la pestaña **"Variables"** del backend, agrega:

```bash
# Conectar a la base de datos MySQL de Railway
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_DATABASE=${{MySQL.MYSQL_DATABASE}}
```

**Nota:** Railway usa el formato `${{SERVICE.VARIABLE}}` para referenciar variables de otros servicios.

### Paso 5: Inicializar el schema de la base de datos

Railway no ejecuta automáticamente tu `schema.sql`. Tienes dos opciones:

**Opción A: Desde Railway CLI (Recomendado)**

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Link a tu proyecto
railway link

# 4. Conectarte a MySQL y ejecutar el schema
railway connect MySQL

# Dentro de MySQL:
mysql> source /ruta/a/tu/proyecto/mysql-init/schema.sql;
mysql> exit;
```

**Opción B: Desde el Dashboard de Railway**

1. Ve al servicio **MySQL**
2. Haz clic en **"Data"** → **"Query"**
3. Copia y pega el contenido de `mysql-init/schema.sql`
4. Haz clic en **"Execute"**

### Paso 6: Generar un JWT_SECRET seguro

Desde tu terminal local:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia el resultado y actualiza la variable `JWT_SECRET` en Railway.

### Paso 7: Deploy

1. Railway hace deploy automáticamente al detectar cambios en GitHub
2. Espera a que termine el build (puedes ver los logs en tiempo real)
3. Una vez completado, verás el botón **"View Logs"** y **"View Deployment"**

### Paso 8: Obtener la URL de tu API

1. En el dashboard de tu backend, ve a **"Settings"**
2. Bajo **"Domains"**, haz clic en **"Generate Domain"**
3. Railway te dará una URL como: `https://tu-proyecto.up.railway.app`
4. **¡Guarda esta URL!** Es tu API en producción

### Paso 9: Verificar que funciona

Prueba tu API:

```bash
curl https://tu-proyecto.up.railway.app/
```

Deberías ver la respuesta JSON con el mensaje de bienvenida.

---

## 🎯 Opción 2: Railway con PlanetScale (MySQL gratis más generoso)

PlanetScale ofrece 5GB gratis vs Railway que consume tu crédito mensual.

### Paso 1: Crear base de datos en PlanetScale

1. Ve a https://planetscale.com y crea una cuenta
2. Haz clic en **"Create database"**
3. Nombre: `videogames-db`
4. Región: Selecciona la más cercana a tu ubicación
5. Haz clic en **"Create database"**

### Paso 2: Obtener credenciales de conexión

1. En tu BD de PlanetScale, ve a **"Connect"**
2. Selecciona **"Node.js"**
3. Copia las credenciales que se muestran:
   - Host
   - Username
   - Password
   - Database name

### Paso 3: Ejecutar el schema en PlanetScale

**Opción A: Desde PlanetScale CLI**

```bash
# Instalar PlanetScale CLI
brew install planetscale/tap/pscale

# Login
pscale auth login

# Conectarte a tu BD
pscale shell videogames-db main

# Ejecutar el schema (copia y pega el contenido de mysql-init/schema.sql)
```

**Opción B: Desde la consola web**

1. En PlanetScale, ve a **"Console"**
2. Copia y pega el contenido de `mysql-init/schema.sql`
3. Ejecuta

### Paso 4: Configurar Railway con PlanetScale

1. Crea tu proyecto en Railway (solo el backend, sin MySQL)
2. En la pestaña **"Variables"**, agrega las credenciales de PlanetScale:

```bash
DB_HOST=tu-host.aws.connect.psdb.cloud
DB_USER=tu_username
DB_PASSWORD=tu_password
DB_DATABASE=videogames-db

# Resto de variables
PORT=${{RAILWAY_PORT}}
JWT_SECRET=tu_secreto_generado
JWT_ISSUER=gametrade.com
JWT_AUDIENCE=gametrade-app
JWT_EXP_SECONDS=86400
FRONTEND_URL=http://localhost:4200
```

---

## 🖼️ Solución para el sistema de uploads (IMPORTANTE)

Railway **NO tiene sistema de archivos persistente**. Los archivos en `/uploads` se borran cuando el servicio se reinicia.

### Opción recomendada: Cloudinary

Cloudinary ofrece 25GB gratis de almacenamiento de imágenes.

#### Configuración de Cloudinary:

1. Crea cuenta en https://cloudinary.com
2. Obtén tus credenciales del dashboard:
   - Cloud Name
   - API Key
   - API Secret

3. Agrega a las variables de Railway:

```bash
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

**Nota:** Necesitarás modificar el código para usar Cloudinary en lugar de Multer local. Puedo ayudarte con esto si lo necesitas.

---

## 📊 Monitoreo y Logs

### Ver logs en tiempo real:

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login y link
railway login
railway link

# Ver logs
railway logs
```

### Desde el dashboard:

1. Ve a tu servicio
2. Haz clic en **"Deployments"**
3. Selecciona el deployment activo
4. Verás los logs en tiempo real

---

## 💰 Límites del tier gratuito

Railway te da **$5 de crédito mensual gratis**, que equivale aproximadamente a:

- **~500 horas** de uso de backend pequeño
- **+500 horas** de uso de MySQL pequeño
- **5GB** de egress (tráfico saliente)

**Consejos para no gastar el crédito:**

1. **Usa PlanetScale en lugar de MySQL de Railway** (ahorra ~$3/mes)
2. **Escala a 0** cuando no estés usando (en Settings → Sleep)
3. **Monitorea el uso** desde el dashboard

---

## 🔄 Actualizar el código

Railway hace deploy automático cuando haces push a GitHub:

```bash
git add .
git commit -m "fix: corrección en endpoint de productos"
git push origin main
```

Railway detectará el cambio y hará redeploy automáticamente.

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"

- Verifica que las variables `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` estén correctas
- Si usas MySQL de Railway, asegúrate de usar las referencias `${{MySQL.VARIABLE}}`
- Revisa los logs para ver el error específico

### Error: "Port already in use"

- No especifiques `PORT` manualmente, usa `${{RAILWAY_PORT}}`
- Railway asigna el puerto automáticamente

### El build falla con "TypeScript errors"

- Asegúrate de que `npm run build` funcione localmente
- Verifica que todas las dependencias estén en `dependencies` (no en `devDependencies`)

### Los archivos subidos desaparecen

- Railway no tiene persistencia de archivos
- Debes usar Cloudinary u otro servicio de almacenamiento externo

---

## ✅ Checklist final

- [ ] Código en GitHub
- [ ] Proyecto creado en Railway
- [ ] Base de datos MySQL configurada (Railway o PlanetScale)
- [ ] Schema ejecutado en la BD
- [ ] Variables de entorno configuradas
- [ ] JWT_SECRET generado de forma segura
- [ ] Domain generado en Railway
- [ ] API funcionando (probado con curl o Postman)
- [ ] Logs sin errores

---

## 🎉 ¡Listo!

Tu backend ahora está en producción. La URL será algo como:

```
https://tienda-videojuegos-production.up.railway.app
```

Usa esta URL en tu frontend para conectarte a la API.

---

## 📞 Soporte

- Documentación oficial: https://docs.railway.app
- Discord de Railway: https://discord.gg/railway
- PlanetScale docs: https://docs.planetscale.com
