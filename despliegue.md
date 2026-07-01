# Guía de Despliegue Oficial - STORE LAN 🚀

Esta guía te explica cómo desplegar la aplicación completa (Backend en Render y Frontend en Vercel) de forma 100% gratuita y funcional, lista para que la uses en celulares, tablets y computadoras.

---

## 🛠️ Paso 1: Subir tus últimos cambios a GitHub

Asegúrate de tener guardados y subidos todos tus cambios en tu repositorio de GitHub (`NelvaAdalit/Store-LAN`):

1. Abre tu terminal de VS Code y ejecuta:
   ```bash
   git add .
   git commit -m "feat: refactorización de seguridad, responsividad y chat en vivo"
   git push origin main
   ```
*(Nota: El archivo `.env` está en `.gitignore` por seguridad, nunca se subirá a GitHub, lo cual es correcto).*

---

## 🖥️ Paso 2: Desplegar el Backend (Servidor Node.js) en Render

Usaremos **Render** para alojar el servidor de base de datos de forma gratuita:

1. Ve a [Render.com](https://render.com/) e inicia sesión con tu cuenta de **GitHub**.
2. En el panel principal, haz clic en **New** (Nuevo) -> **Web Service** (Servicio Web).
3. Selecciona tu repositorio `NelvaAdalit/Store-LAN` y haz clic en **Connect** (Conectar).
4. Configura los siguientes campos:
   - **Name:** `store-lan-api` (o el nombre que gustes)
   - **Region:** Selecciona la más cercana (ej: Oregon o Frankfurt)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` (Gratuito)
5. Haz clic en la pestaña **Environment** (Variables de Entorno) y agrega las siguientes variables (copia los valores de tu archivo `.env` local):
   - `SUPABASE_URL` = *tu_url_de_supabase*
   - `SUPABASE_KEY` = *tu_anon_public_key_de_supabase*
   - `JWT_SECRET` = *tu_jwt_secret_personal*
   - `PORT` = `3001`
6. Haz clic en **Deploy Web Service** (Desplegar).
7. Espera unos minutos a que finalice el proceso de compilación. Render te proporcionará una URL pública de tu API, por ejemplo:
   👉 `https://store-lan-api.onrender.com`

---

## 🔗 Paso 3: Vincular el Frontend con tu nueva URL de Render

Antes de desplegar la web, debemos indicarle a los archivos Javascript dónde está tu servidor en internet:

1. En tu código local en VS Code, abre los siguientes archivos:
   - [frontend-client/config.js](file:///d:/Store-LAN/frontend-client/config.js)
   - [frontend-admin/config.js](file:///d:/Store-LAN/frontend-admin/config.js)
2. Reemplaza la URL de producción por tu URL obtenida en **Render** (no olvides agregar el sufijo `/api` al final):
   ```javascript
   const CONFIG = {
       API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
           ? 'http://localhost:3001/api'
           : 'https://store-lan-api.onrender.com/api' // <-- REEMPLAZA ESTA URL CON TU URL DE RENDER + /api
   };
   ```
3. Guarda los cambios, haz commit y súbelos a GitHub:
   ```bash
   git add .
   git commit -m "config: vincular url de producción de render"
   git push origin main
   ```

---

## 🎨 Paso 4: Desplegar el Frontend (Tienda y Admin) en Vercel

Usaremos **Vercel** para hospedar la web estática (es ultra rápido y gratuito):

1. Ve a [Vercel.com](https://vercel.com/) e inicia sesión con tu cuenta de **GitHub**.
2. Haz clic en **Add New** (Agregar Nuevo) -> **Project** (Proyecto).
3. Importa tu repositorio `NelvaAdalit/Store-LAN`.
4. En la configuración del proyecto:
   - Deja el **Framework Preset** como `Other`.
   - **Root Directory:** `./` (déjalo vacío o en el directorio raíz para que lea tu archivo `index.html` redirigible).
   - No necesitas configurar comandos de compilación ni variables de entorno.
5. Haz clic en **Deploy** (Desplegar).
6. ¡Listo! Vercel desplegará tu web en 15 segundos y te entregará tu enlace público oficial, por ejemplo:
   👉 `https://store-lan.vercel.app`

---

### 📱 ¡Prueba en tu Celular!
Abre la URL de Vercel en el celular del dueño del negocio.
* Se abrirá la tienda de clientes responsiva, con el carrusel de moda interactivo y el Chat en Vivo funcionando.
* Podrás ingresar al administrador navegando a `https://tu-proyecto.vercel.app/frontend-admin/index.html` para gestionar variantes, subir tu QR de pago o aprobar órdenes en tiempo real.
