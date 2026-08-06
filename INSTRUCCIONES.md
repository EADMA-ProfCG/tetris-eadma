# Instrucciones de instalación — Tetris EADMA

## Lo que necesitas (todo gratuito)
- Cuenta GitHub: https://github.com
- Cuenta Vercel: https://vercel.com

---

## PASO 1 — Crear cuenta en GitHub
1. Ve a https://github.com/signup
2. Ingresa email, contraseña y nombre de usuario
3. Verifica tu email

---

## PASO 2 — Crear el repositorio y subir los archivos
1. En GitHub, haz clic en el botón verde **"New"** (arriba a la izquierda)
2. Nombre del repositorio: `tetris-eadma`
3. Déjalo en **Public**
4. Haz clic en **"Create repository"**
5. En la página del repositorio vacío, haz clic en **"uploading an existing file"**
6. Arrastra TODOS los archivos de esta carpeta (incluyendo la carpeta `api/`)
   - index.html
   - package.json
   - vercel.json
   - api/scores.js
   - api/session.js
   - api/score-event.js
   - api/admin.js
   - api/reset.js
   - api/tournaments.js
7. Haz clic en **"Commit changes"**

---

## PASO 3 — Crear cuenta en Vercel y hacer deploy
1. Ve a https://vercel.com/signup
2. Selecciona **"Continue with GitHub"** (así se conectan automáticamente)
3. Una vez dentro, haz clic en **"Add New Project"**
4. Selecciona el repositorio `tetris-eadma`
5. No cambies nada — haz clic en **"Deploy"**
6. Espera ~1 minuto. Vercel te dará una URL como: `tetris-eadma.vercel.app`

---

## PASO 4 — Crear la base de datos (Vercel KV)
Este es el paso que guarda los puntajes de forma permanente y compartida.

1. En el dashboard de Vercel, entra a tu proyecto `tetris-eadma`
2. Ve a la pestaña **"Storage"**
3. Haz clic en **"Create Database"**
4. Selecciona **"KV"** (Redis)
5. Nombre: `tetris-db` (o cualquier nombre)
6. Haz clic en **"Create & Connect"**
7. Vercel conecta la base de datos al proyecto automáticamente

---

## PASO 5 — Configurar la contraseña del administrador (opcional)
La contraseña por defecto es `2026`. Para cambiarla de forma segura:

1. En tu proyecto de Vercel, ve a **Settings → Environment Variables**
2. Haz clic en **"Add"**
3. Nombre: `ADMIN_PASSWORD`
4. Valor: la contraseña que quieras
5. Guarda y espera que Vercel haga un nuevo deploy (~30 segundos)

---

## PASO 6 — Verificar que todo funciona
1. Abre la URL de tu proyecto (ej: `tetris-eadma.vercel.app`)
2. Deberías ver la pantalla de bienvenida del juego
3. Ingresa tu nombre, selecciona un curso y haz clic en "Jugar"
4. Inicia una partida — al terminar, el puntaje debería aparecer en el ranking

---

## ¿Cómo hacer cambios en el futuro?
1. Pide el cambio en Claude
2. Descarga el archivo modificado
3. En GitHub, abre el archivo que cambió, haz clic en el ícono de lápiz (editar)
4. Pega el nuevo contenido y haz clic en "Commit changes"
5. Vercel actualiza la página automáticamente en ~1 minuto

---

## Estructura de archivos
```
tetris-eadma/
├── index.html          ← El juego completo (HTML + CSS + JS)
├── package.json        ← Dependencias del proyecto
├── vercel.json         ← Configuración de Vercel
└── api/
    ├── scores.js       ← GET puntajes / POST guardar puntaje
    ├── session.js      ← Crear sesión de juego (anti-trampas)
    ├── score-event.js  ← Acumular puntos en el servidor
    ├── admin.js        ← Panel de administrador
    ├── reset.js        ← Reiniciar ranking / archivar torneo
    └── tournaments.js  ← Historial de torneos
```
