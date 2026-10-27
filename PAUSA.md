# Punto de continuación — 27 de octubre de 2026

## Estado actual

27/10/2026 — usuario confirmó que instaló el APK y compartió captura de Inicio en Android. Cambio posterior, aún no incluido en ese APK: el icono de la pestaña Perfil ya no usa `☺` (Android lo dibujaba como emoji amarillo); se dibuja una silueta de persona con contorno, mismos colores activo/inactivo y escala de selección que sus vecinos. Sin dependencias, cambios del servidor ni datos. TypeScript/lint aprobados. Pendiente generar e instalar un APK actualizado para ver este ajuste en el teléfono; el instalado se puede seguir usando mientras se desarrolla. Las referencias a EN COLA más abajo son el historial del primer envío, no el estado actual confirmado por el usuario.

27/10/2026 — APK Android solicitado y autorizado bajo la cuenta personal `angelbsc`. Proyecto EAS creado y vinculado: `f2c340ea-a4f9-40cf-9406-4a9ee4e21f01`. Compilación `3de8b454-1b11-4304-96e7-d6d88d8c1fcf` enviada, inicialmente EN COLA; todavía no se debe afirmar que exista un APK terminado. Estado/enlace: https://expo.dev/accounts/angelbsc/projects/psicologia-app/builds/3de8b454-1b11-4304-96e7-d6d88d8c1fcf . Consultar con `npx eas-cli@latest build:view 3de8b454-1b11-4304-96e7-d6d88d8c1fcf --json`.

Perfil `preview` en `eas.json`, firma administrada por EAS, paquete independiente `com.angelbsc.psicoaprende.preview`, nombre «PsicoAprende Prueba». API incorporada `http://192.168.123.100:3001`; HTTP permitido solo para preview mediante `expo-build-properties`. Configuración dinámica rechaza endpoints no privados o con credenciales. Producción conserva HTTPS-only. No se creó proyecto nativo manualmente ni se publicó en Google Play.

Usuario confirmó desde Android que `/health` devuelve `ok` en la misma red. PostgreSQL conservado; API reiniciada y conectada en 3001. El APK no necesitará Metro pero sí computador/servidor encendido y misma red. Guía: `docs/ANDROID-PRUEBA.md`. Falta instalación y prueba física del APK, incluidas notificaciones y animaciones.

Verificado antes de compilar: 103 pruebas aprobadas, TypeScript/lint correctos y dependencias compatibles con SDK 57 (Expo ~57.0.31, router ~57.0.29, @expo/ui ~57.0.26, build-properties ~57.0.22). Archivo EAS inspeccionado en `.local-build/eas-mobile-only-20261027`: sin .env, servidor, respaldos, claves, base de datos ni historial Git. Carga realizada con `EAS_NO_VCS=1`, `EXPO_NO_DOTENV=1` y `.easignore`; credenciales PostgreSQL no enviadas. No se cambiaron reglas de firewall.

Revisión adicional: `npx expo-doctor` aprobó 21/21 comprobaciones. Al momento de este punto de guardado EAS continúa EN COLA, sin artefacto disponible ni error reportado. La prueba de conectividad desde Android ya está confirmada por el usuario.

### Etapa anterior: perfil

26/10/2026 — perfil completado: nombre editable, meta diaria (30/50/100/150 XP), lectura (3 tamaños y espaciado), recordatorios diarios locales Android/iOS y tienda inicial de estilos de avatar. Preferencias, propiedad y canjes reales en PostgreSQL con migración aditiva; saldo descontado también en garra/progreso, sin afectar XP. Estilos visibles en Perfil/Inicio. Aviso local-v4, consentimientos históricos conservados. Recordatorios solicitan permiso al activar, se cancelan al cerrar sesión y no se simulan en web. `expo-notifications` instalado para SDK 57; desarrollo nativo existente requiere reconstrucción. Alcance y límites en `docs/PERFIL.md`.

Verificado: 101 pruebas automáticas aprobadas, TypeScript/lint correctos y exportaciones web/Android en `.local-build/web-profile-20261026` y `.local-build/android-profile-20261026`. QA en cuenta sintética (no cuentas del usuario): nombre, meta reflejada en Inicio, lectura guardada y aplicada a 320 px, canje por 30 monedas, equipar y recargar. Cuenta QA Perfil conserva 160 XP/0 lecciones y ahora tiene 40 monedas + estilo Jardín de ideas. Falta prueba física de notificaciones/permisos y fluidez nativa. API en 3001, Expo en 8081.

### Etapa anterior del mismo día: cápsulas

26/10/2026 — cápsulas sorpresa: todas las cápsulas cerradas son iguales, sin letras ni colores de rareza. Al abrir, el servidor sortea especial (70%), épica (25%) o legendaria (5%) con `crypto.randomInt`; cada apertura es independiente, sin cuota garantizada por tablero. La posición no altera las probabilidades. El resultado se guarda con el caso: recargar o repetir una solicitud no permite volver a sortear. Tableros antiguos conservan sus cápsulas, pero su rareza anterior no se muestra ni determina el nuevo sorteo; intentos ya abiertos conservan su resultado. Detalle en `docs/RETOS-CLINICOS.md`.

La máquina ya incluye 12 casos clínicos ficticios (4 por dificultad), corrección y explicaciones con referencias. Acierto especial: 30 XP/10 monedas; épico: 60 XP/25 monedas; legendario: 100 XP/50 monedas. Recompensa solo una vez por caso y usuario; repaso sin premios duplicados, errores sin penalización. Banco y corrección en servidor, tablas PostgreSQL aditivas, transacciones e idempotencia; preguntas abiertas y resultados se recuperan tras salir o recargar. Perfil muestra monedas; XP se integra en progreso sin desbloquear lecciones. No hay tienda ni dinero real. La dificultad es editorial, pendiente de validación docente.

Verificado el 26/10: 84 pruebas aprobadas (incluyen distribución exacta 70/25/5, compatibilidad de tableros antiguos, reintentos y recompensas con PostgreSQL aislado), TypeScript y lint correctos. QA web con cuenta sintética: tablero sin letras/colores distintivos, recogida, apertura que revela calidad y recarga que conserva el mismo caso/calidad. Sin responder ni otorgar premios en esta comprobación. Captura `capsulas-sorpresa-20261026.jpg` en visualizaciones del chat. API en 3001 y Expo web en 8081 iniciados; PostgreSQL local conservado. Falta prueba en teléfono físico de fluidez e interrupciones nativas. Las exportaciones anteriores no incluyen el ajuste probabilístico del 26/10.

### Historial anterior (no describe el alcance actual)

23/10/2026 — pulido de animaciones: aceleración/frenado suave, balanceo discreto, brazos de garra articulados mediante recorte en ejecución (sin cambiar los PNG), cápsula única en coordenadas de escena, escala gradual hacia la bandeja, caída con aceleración y rebote corto, destello suave y apertura centrada en modal accesible. El contenido de estudio, premios y arte original no se modificaron.

La secuencia ahora vive en `src/lib/claw-controller.ts`, separada del adaptador Animated. Guardia por generación evita callbacks obsoletos; cancelación al perder foco/ocultar pestaña/pasar a segundo plano, o cambiar movimiento reducido durante recogida. Las cápsulas solo se descuentan tras completar la entrega. Cambiar movimiento reducido con una cápsula abierta no repite la apertura. Modal Android no debe confundirse con pasar la app a segundo plano. Sin dependencias nuevas. `allowImportingTsExtensions` permite probar directamente el controlador puro con Node 24; Expo se mantiene sin emisión de TypeScript.

Verificado: 68 pruebas aprobadas (25 nuevas deterministas del controlador), TypeScript/lint correctos; exportaciones web/Android en `.local-build/web-claw-motion-20261023` y `.local-build/android-claw-motion-20261023`. QA web a 320/390 px: toque/mantener/freno, doble agarre con una sola cápsula, entrega a centro (160,296)/escala 0.75, apertura centrada, cierre con Escape/Seguir probando, salida a mitad de recogida y modo reducido. Sin errores/avisos de consola en la revisión. Falta validación en teléfono físico de fluidez, tacto, interrupciones nativas y TalkBack/VoiceOver; no se afirma FPS medido. Prototipo sigue sin preguntas, XP, monedas, sonidos ni física real.

Corrección posterior en Jugar: la imagen exterior retenía su alto intrínseco de 1536 px en React Native Web y dejaba un gran hueco. Ahora la proporción 2:3 está en el contenedor y la imagen ocupa ese marco con dimensiones explícitas al 100%. Verificado a ancho móvil estrecho y 390 px, con acceso a la máquina conservado. No se cambió arte, animaciones ni progreso.

23/10/2026 — máquina de garra: tras aprobar el arte y pedir «sigamos», se implementó el primer prototipo en Jugar → máquina. Arte independiente (fondo, garra abierta/cerrada, cápsulas), controles por toque/mantener, agarre asistido, recogida/transporte/entrega y apertura animada. Once cápsulas, rellenado al vaciar, bloqueo de pulsaciones duplicadas, cancelación al perder foco o salir. Respeta movimiento reducido por defecto, con interruptor local. Estado efímero: sin preguntas, XP, monedas, tienda, física real ni endpoints nuevos. No se añadieron dependencias. Prompts y assets: `assets/images/claw/README.md`.

Verificación del prototipo: 43 pruebas aprobadas con PostgreSQL; TypeScript y lint correctos. Exportaciones web/Android en `.local-build/web-claw-20261023` y `.local-build/android-claw-20261023`. QA en navegador integrado a 320/390 px sin desbordamiento: toque, pulsación sostenida hasta el límite, recorrido completo, doble pulsación consume una cápsula, apertura, once recogidas hasta vaciar, relleno, movimiento reducido, salida durante animación y reinicio. Sin errores/avisos de consola en la comprobación. Progreso observado antes y después: 150 XP y 4/25, sin cambios. Captura `garra-interactiva-20261023.jpg` en la carpeta de visualizaciones de este chat. Falta probar en teléfono físico (incluido cambio de app durante una animación).

23/10/2026: por petición posterior, «Tiempo, espacio y persona» pasa a llamarse «Psicopatología de la orientación». Solo cambia el título del catálogo; se conserva el ID `semiologia-2026-v1-orientacion`, las preguntas y el progreso. Las instantáneas de exámenes anteriores mantienen el título histórico.

23/10/2026: petición puntual implementada en bloque 1, lección «Tiempo, espacio y persona». Solo tres enunciados y explicaciones ahora son viñetas clínicas de orientación temporal, espacial y personal; no se cambió otra lección, lectura, opciones, respuestas correctas ni IDs. Conserva objetivos y compatibilidad del progreso. Exámenes existentes mantienen la instantánea original; nuevos intentos toman los casos nuevos. Fuente p. 4 verificada y contraste clínico documentado en `docs/CONTENIDO.md`.

Verificado el 23/10: 37 pruebas aprobadas con PostgreSQL, TypeScript/lint correctos. Comparación SHA-256 antes/después confirma que el catálogo permanece idéntico salvo los tres enunciados y explicaciones de orientación. API y Expo iniciados con contenido actualizado; sin modificar cuentas ni progreso.

Última ampliación: «Que la app elija por mí» permite indicar cantidad y sortear preguntas de los temas seleccionados, sin repetir. Reemplaza selección previa y limpia búsqueda; permite revisar y cambiar antes de iniciar. Cantidad validada contra disponibles. Helper puro `src/lib/exam-selection.ts`, cuatro pruebas adicionales (36 en total). No modifica API ni esquema; el intento sigue guardando las preguntas finalmente elegidas. Modo sin tiempo y reparto obligatorio por tema no implementados.

Verificación de selección automática: 36 pruebas aprobadas, TypeScript/lint correctos; QA web a 320/390 px con cantidad excesiva rechazada, sorteo de 4 preguntas de 2 temas, búsqueda limpiada y selección podada al quitar tema, seguido del flujo completo de examen. Datos de prueba aislados, sin tocar cuentas del usuario. Captura `examen-seleccion-automatica.png` en la carpeta de visualizaciones del chat.

### Registro solo para estudiantes y exámenes propios — 17/10/2026

Última petición implementada: quitar selector profesional/estudiante del registro y desarrollar exámenes propios. No se cambia el cerebro del login. Nuevas cuentas siempre student; API rechaza otros roles, sin modificar cuentas antiguas. Aviso local-v2 incluye respuestas/resultados de exámenes; aceptación histórica conservada.

Nueva pestaña «Exámenes»: elegir cualquiera de los 8 temas, buscar y seleccionar entre las 75 preguntas, duración de 1–120 minutos, un intento activo por cuenta, respuestas guardadas con conexión, posibilidad de retomarlo y entrega con confirmación. Corrección con explicaciones, páginas y fuentes, más últimos 50 intentos. No otorga XP ni desbloquea lecciones. Garra/monedas/tienda siguen fuera de alcance.

API `server/exams.mjs` y tabla `exam_attempts` creada sin borrar datos: instantáneas de preguntas, reloj PostgreSQL, propiedad por sesión, bloqueos/transacciones, versiones para conflictos y creación idempotente. El reloj no se pausa al salir; vencimiento aplicado en siguiente consulta/acción, sin aceptar respuestas tardías. Offline hay que reconectar para guardar o ver el resultado. Detalle en README y `docs/DISENO-Y-FUTURO.md`.

Verificación: 32 pruebas de API/contenido aprobadas en esquemas desechables aislados. TypeScript y lint sin errores. Exportaciones web/Android en `.local-build/web-exams-20261017` y `.local-build/android-exams-20261017`. QA web headless con Brave y PostgreSQL en esquema aleatorio independiente: registro sin roles, validación, selección/tiempo, guardado/recarga/plazo inmutable, entrega/omisiones/nota, historial, siguiente intento y vencimiento; sin errores JS. Se eliminó únicamente el esquema sintético de cada prueba, no cuentas ni progreso de la app. Script local reproducible: `.local-build/exam-ui-check.mjs` (rutas específicas de este equipo). Capturas en visualizaciones del chat: `registro-estudiantes.png`, `examen-personalizado.png`, `examen-en-curso.png`, `examen-resultado.png`. Falta prueba en teléfono físico.

### Historial de etapas anteriores (lo siguiente conserva contexto)

Última ampliación visual (17/10): usuario aprobó el nuevo Inicio y pidió aplicar también el estilo al acceso conservando el cerebro. Estilo extendido a login, bienvenida (cerebro original conservado), ruta, lectura/preguntas y perfil. El login reutiliza el mismo emoji del cerebro de bienvenida en lugar del ψ anterior. No se modificaron credenciales ni reglas de autenticación/progreso. Campos conservan validación y bloqueo durante envío. Perfil ya no presenta recordatorios como activados ni botones de preferencias inexistentes; quedan como «Próximamente». TypeScript, lint, 23 pruebas y exportaciones web/Android aprobados (`.local-build/web-academic-20261017`, `.local-build/android-academic-20261017`).

QA de esta ampliación: login vacío rechazado, login real con cuenta sintética, navegación a ruta, lectura y pregunta de repaso, feedback incorrecto, perfil y logout. Sin guardar intentos ni sumar XP; la cuenta mantiene 90 XP y 2/25. Login y perfil comprobados a 320 px sin desbordamiento; capturas de login, ruta, preguntas y perfil a 390 px. Pestaña final en `/login`, sesión de prueba cerrada y viewport restaurado. Capturas en la carpeta de visualizaciones del chat: `login-academico.png`, `ruta-academica.png`, `preguntas-academicas.png`, `perfil-academico.png`.

Último avance de interfaz (17/10): el usuario eligió un estilo suave y académico con detalles de juego. Inicio rediseñado con marfil/salvia/lavanda, próxima lección destacada, estadísticas, meta diaria y acceso a la ruta. Paleta y botones compartidos actualizados; no se cambiaron preguntas, autenticación ni reglas de progreso. Alcance: primera pasada de Inicio, no rediseño completo de todas las pantallas.

Verificación de esta pasada: TypeScript, lint y 5 pruebas de contenido aprobados; exportaciones web/Android en `.local-build/web-home-20261017` y `.local-build/android-home-20261017`. Tras recarga del usuario, el navegador volvió a estar accesible. Inicio comprobado a 320 y 390 px sin desbordamiento horizontal; accesos a siguiente lección, ruta y perfil comprobados sin completar lecciones. El progreso observado fue 90 XP y 2/25 lecciones (no modificado por esta prueba). Captura en `C:/Users/Administrator/.codex/visualizations/2026/10/15/01a13da4-45b6-7340-a1aa-8e62b1e9dc84/inicio-academico-20261017.png`.

Idea originalmente futura, ahora implementada por nueva petición: examen personalizable por campo/temas, preguntas elegidas y tiempo. Ver estado más reciente arriba y `docs/DISENO-Y-FUTURO.md`.

Docker reparado con autorización del usuario, sin reset ni borrado de volúmenes. PostgreSQL original healthy y API conectada. Web disponible en http://localhost:8081/ y API en puerto 3001.

- Catálogo integrado: 8 bloques, 25 lecciones, 75 fichas y 75 preguntas con referencias de página.
- Última petición: explicar las notas de revisión y crear también preguntas de sexualidad y de los pasajes ambiguos. Se agregaron 8 lecciones al final de la ruta: 4 de sexualidad y 4 de aclaraciones (24 preguntas nuevas).
- Se sustituyeron las tarjetas de temas pendientes por notas editoriales explícitas, con páginas y ejemplos. El PDF no pide aclaración docente; esa observación fue de la app. No se atribuye aprobación a la docente.
- Fuentes externas de contraste enlazadas en lectura y feedback (APA, ASHA, NIMH e Institute of Medicine/NCBI). Detalle, limitaciones y cobertura en `docs/CONTENIDO.md`.
- Lectura previa, repaso, feedback, prerrequisitos y progreso persistente.
- Se conserva el historial anterior y su XP; la nueva ruta tiene IDs independientes.
- 23 pruebas automáticas aprobadas el 17/10; TypeScript y lint aprobados. Pruebas de integración con PostgreSQL en esquemas aislados, incluyendo completar las 25 lecciones, persistencia y XP sin duplicados.
- Exportaciones web y Android aprobadas el 17/10 en `.local-build/web-20261017` y `.local-build/android-20261017` (ignoradas en Git). Esto comprueba empaquetado, no sustituye prueba visual ni prueba en teléfono.
- QA web de la etapa anterior: sesión antigua restaurada, respuesta incorrecta/correcta, repaso sin perder respuesta, guardado real y persistencia después de recarga. La revisión visual de los dos bloques nuevos está pendiente: el navegador integrado bloqueó observar la pestaña en error. No eludir ese bloqueo; pedir al usuario que recargue la página.
- En la etapa anterior se usó la cuenta sintética «Prueba UI», que quedó con 60 XP: 30 anteriores y 30 de la primera lección de semiología (2/3 aciertos). En esta ampliación no se modificó su progreso.
- El 17/10 los servicios estaban apagados. Docker inició normalmente tras superar el primer timeout; no fue necesaria otra reparación. PostgreSQL healthy y `/health` de la API confirma conexión.
- Hay copia privada de la base previa al QA en `.local-backups/psicoaprende-20261016-recovery.dump`, ignorada por Git.
- Detalle de recuperación, respaldo y directorios temporales conservados en `docs/RECUPERACION-DOCKER.md`.

## Pendientes

- Obtener opinión sobre registro simplificado y exámenes personalizados; probarlos en teléfono físico. Selección aleatoria implementada por nueva petición; modo sin tiempo todavía no solicitado ni implementado.
- Revisar contenido con la docente: la ruta es una selección introductoria, no cobertura exhaustiva ni herramienta diagnóstica. Ver `docs/CONTENIDO.md`.
- Verificar visualmente los bloques 7 y 8 y los enlaces de fuentes; ampliar distractores, casos y cobertura si el usuario lo solicita. En p. 16 se evalúan descripciones, no se resuelve exhaustivamente la equivalencia de las etiquetas. No se incluyen todos los términos de parafilias.
- Probar en teléfono físico Android/iOS.
- Prototipo manual de garra y animaciones implementado por nueva solicitud. Siguiente etapa, aún pendiente: conectar preguntas del PDF y definir recompensas seguras en servidor; monedas y tienda todavía no implementadas. Validar primero la interacción con el usuario.
- Despliegue público, HTTPS, verificación de email y recuperación de contraseña siguen fuera de esta instalación local.

## Reiniciar en otra sesión

Abrir Docker Desktop y ejecutar `npm run db:up`, `npm run api`, y en otra terminal `npm run web`.
No ejecutar `docker compose down -v` ni factory reset. No imprimir `.env`.
La API importa `src/data/learning.ts`: reiniciarla tras modificar contenido.
