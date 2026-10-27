# PsicoAprende

Prototipo móvil de aprendizaje interactivo de psicología, inspirado en sesiones breves,
progreso visible y retroalimentación inmediata.

## Qué incluye esta primera versión

- Bienvenida y propuesta educativa.
- Registro exclusivo de estudiantes e inicio de sesión reales con API Node.js y PostgreSQL, sin selector de rol.
- Rutas protegidas según el estado de autenticación.
- Inicio con racha, XP, meta diaria y próxima lección.
- Ruta de aprendizaje con desbloqueo progresivo.
- Ruta de semiología: 8 bloques, 25 lecciones, 75 fichas y 75 preguntas; PDF de clase y aclaraciones editoriales con fuentes externas identificadas.
- Lectura previa, repaso de conceptos, feedback con páginas de referencia y recompensa por finalización.
- Perfil: nombre editable, meta diaria, lectura ajustable, tienda de estilos con monedas y cierre de sesión. Recordatorios locales Android/iOS con horario y permisos. Detalles y límites: `docs/PERFIL.md`.
- Exámenes propios: temas, selección manual o automática al azar por cantidad (sin repetidos), 1–120 minutos, guardado por respuesta, resultados explicados e historial.
- Jugar: máquina pixel art manual con cápsulas especiales, épicas y legendarias; 12 casos clínicos ficticios, XP y monedas persistentes. Respeta movimiento reducido, permite retomar casos y evita premios duplicados. Balance, fuentes y API: `docs/RETOS-CLINICOS.md`. Arte y prompts: `assets/images/claw/README.md`.

Las cuentas, sesiones y lecciones completadas se guardan en PostgreSQL. Las contraseñas usan
scrypt con sal aleatoria (N=131072, r=8, p=1). Las sesiones duran 30 días y solo se guarda su hash
en la base de datos. En Android/iOS el token se almacena con SecureStore; en web se usa una cookie
HttpOnly/SameSite=Lax. Cerrar sesión revoca el token en el servidor.

## APK Android de prueba

El perfil EAS `preview` genera **PsicoAprende Prueba**, un APK independiente de
Expo Go/Metro conectado a la API local del computador. Requiere ambos equipos
en la misma red y el servidor encendido. Instalación, límites y reinicio:
[Guía de Android](docs/ANDROID-PRUEBA.md).

## Ejecutar

Requisitos: Node.js 24, Docker Desktop iniciado y dependencias instaladas con `npm ci`.

En este equipo `.env` ya está configurado y excluido de Git. En una instalación nueva, copia
`.env.example` a `.env`, genera una contraseña aleatoria y reemplázala tanto en
`POSTGRES_PASSWORD` como en `DATABASE_URL`. Nunca uses prefijos `EXPO_PUBLIC_` para secretos.

```bash
npm run db:up
npm run api
```

Mantén esa terminal activa. En otra terminal, dentro de esta carpeta:

```bash
npm start
```

Después, escanea el QR con Expo Go o usa:

```bash
npm run android
npm run web
```

Para iOS desde Windows, abre el proyecto con Expo Go en un iPhone o utiliza EAS Build.

La API escucha en el puerto 3001. PostgreSQL se expone solo en `127.0.0.1:54329` y sus datos
persisten en el volumen Docker `psicoaprende_postgres-data`. Reiniciar contenedores no borra cuentas.
No ejecutes `docker compose down -v` salvo que quieras borrar la base de datos.

Para probar con un teléfono, conecta teléfono y PC a la misma red. En desarrollo la app obtiene
el host de Expo automáticamente. Si usas un túnel, emulador con configuración especial o cambia
la IP, define `EXPO_PUBLIC_API_URL=http://IP-DE-TU-PC:3001` y reinicia Expo. Windows debe permitir
el puerto 3001 en la red privada; no se han cambiado reglas de firewall automáticamente.
La vista web usa `http://localhost:8081`; otros orígenes requieren agregarse a `WEB_ORIGINS`.

### Cerrar y retomar el trabajo

Detén Expo y la API con Ctrl+C en sus terminales, cierra Docker Desktop normalmente y apaga
Windows desde su menú. Los datos persisten en el volumen. Al regresar, abre Docker Desktop,
ejecuta `npm run db:up`, `npm run api` y, en otra terminal, `npm run web`.
Si Docker vuelve a fallar, no uses factory reset ni borres volúmenes: el incidente recuperado
y el respaldo local están documentados en `docs/RECUPERACION-DOCKER.md`.

## Validación y contrato

```bash
npm run test:content
npm run test:api
npx tsc --noEmit
npx expo lint
npx expo export --platform android
```

Las pruebas usan un esquema PostgreSQL aleatorio y lo eliminan al terminar, sin tocar las tablas
de usuarios de la app. Cubren registro, duplicados concurrentes, credenciales inválidas, sesiones
expiradas/revocadas, cookies, CORS, límite de intentos, aislamiento por usuario y persistencia tras
reiniciar la API y reconectar PostgreSQL.

- `POST /auth/register`: nombre (2–80), correo (máx. 254), contraseña (12–128) y aceptación; crea exclusivamente estudiantes.
- `POST /auth/login`: devuelve usuario y sesión; conserva acceso a cuentas existentes.
- `GET /auth/me`: restaura identidad autenticada.
- `POST /auth/logout`: revoca la sesión actual.
- `GET /progress`: obtiene exclusivamente el progreso del usuario de la sesión.
- `POST /progress/complete`: valida respuestas y prerrequisitos; XP calculados en servidor, una recompensa por lección.
- `GET /health`: comprueba la conexión con PostgreSQL.
- `GET /exams/catalog`: temas y preguntas disponibles (sin corrección).
- `GET /exams`: últimos 50 intentos propios; finaliza vencidos.
- `POST /exams`: `questionIds`, `durationMinutes` (1–120), `requestKey` único de 16–80 caracteres; creación idempotente, un intento activo por usuario.
- `GET /exams/:id`: respuestas guardadas y plazo; incluye corrección solo al terminar.
- `POST /exams/:id/answer`: `questionId`, `answer` (índice o null para quitar) y `revision` recibida; rechaza conflictos de versión.
- `POST /exams/:id/submit`: entrega definitiva e idempotente; nota calculada en servidor.

El examen guarda una instantánea de preguntas en PostgreSQL y no modifica XP ni la ruta. El reloj
no se pausa; solo cuentan respuestas recibidas antes del plazo. El vencimiento se aplica al consultar
o modificar el intento, también después de reiniciar el servicio. Sin conexión, el alumno debe
reconectar para guardar respuestas o ver el resultado; no hay cola de respuestas offline.

Las escrituras requieren `X-Psico-Client: native` o `web`. Los clientes nativos envían
`Authorization: Bearer <token>`; el navegador envía su cookie y no recibe el token en JSON.
Los errores se presentan en español. Fallos de red conservan la sesión para reintentar; un 401
de una ruta protegida elimina el acceso local. Las consultas SQL están parametrizadas.

## Alcance de esta instalación

Esta es una conexión real **local**, todavía sin despliegue público. El HTTP local es para pruebas
en una red de confianza. Antes de publicar, configurar HTTPS, origen público, cookie Secure
(`NODE_ENV=production`), URL pública de API, copias de seguridad y limitador compartido si hay
varias instancias. Todavía no hay verificación de correo, recuperación por email ni eliminación
de cuenta desde la app: requieren su flujo y un servicio de correo. No se simula su funcionamiento.
El aviso de datos describe esta versión local y se versiona al registrar la aceptación.

Los contadores se calculan con días de America/Guayaquil. La racha actual cuenta días con primeras
finalizaciones; los repasos no otorgan XP adicionales ni mantienen la racha en esta versión.

## Estructura

- `src/app`: pantallas y navegación con Expo Router.
- `src/context`: sesión restaurable y sincronización del progreso por cuenta.
- `src/lib`: cliente HTTP, almacenamiento seguro y validaciones compartidas con servidor.
- `server`: API, esquema SQL y pruebas de integración.
- `src/data`: contenido inicial de las lecciones.
- `src/components`: componentes reutilizables.
- `src/constants`: sistema visual.

## Siguiente etapa recomendada

1. Revisar el contenido con la docente y ampliar cobertura del PDF (ver `docs/CONTENIDO.md`).
2. Probar Android/iOS en dispositivos físicos.
3. Definir las reglas de repaso y recompensas diarias.
4. Añadir recuperación de contraseña y verificación de correo.
5. Probar el flujo con 5 a 10 usuarios antes de ampliar contenido.

## Material de clase y futuras mecánicas

El temario actual es una selección introductoria, pendiente de revisión docente, de «Semiología
de los procesos y funciones psicológicas» (49 páginas), aportado por el usuario. No es una
herramienta diagnóstica ni una cobertura exhaustiva. Referencias, límites editoriales y la idea
de máquina de garra están documentados en `docs/CONTENIDO.md` y `docs/RETOS-CLINICOS.md`. Garra y monedas
ya están implementadas, junto con la tienda de estilos de avatar en Perfil. Las cuentas y el XP histórico se conservan; los contadores de la ruta
solo consideran el nuevo temario. El contenido se comparte entre app y API desde
`src/data/learning.ts`: reiniciar la API después de modificarlo.
