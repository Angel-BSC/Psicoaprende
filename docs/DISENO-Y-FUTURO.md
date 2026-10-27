# Dirección visual y próximas funciones

## Dirección elegida por el usuario — 17/10/2026

Estilo suave y académico con detalles de juego. Fondo marfil, verde salvia para acciones, lavanda para XP y acentos cálidos discretos. Priorizar lectura, jerarquía y espacios; evitar una estética de casino/arcade. Aplicado a Inicio, ruta, lectura/preguntas, perfil e inicio de sesión. La bienvenida mantiene el cerebro original y ahora puede desplazarse en pantallas pequeñas. Por petición expresa del usuario se conserva el cerebro y también se reutiliza en el login (antes tenía ψ). No se generó ni sustituyó el arte del cerebro.

Login con formulario en tarjeta, campos y botón accesibles; navegación y validaciones existentes conservadas. Ruta numerada con estados visibles sin reducir la legibilidad de todos los temas bloqueados. Perfil con estadísticas claras; preferencias no implementadas pasan a filas informativas «Próximamente», sin botones que no funcionan ni recordatorios falsamente activos. La meta se obtiene del progreso real.

El inicio usa datos reales de progreso, sin métricas inventadas. El juego acompaña al estudio mediante XP, racha y avance por bloques. No se cambiaron reglas de recompensa, autenticación ni datos del curso.

## Examen personalizable — primera versión implementada (17/10/2026)

Autorizado ahora por el usuario. Pestaña «Exámenes» con selección de:

- Campo o temas del temario.
- Las preguntas que quiera incluir (1–75 del catálogo actual), con búsqueda y selección de las visibles.
- El tiempo disponible: entre 1 y 120 minutos enteros.

Resumen y reglas visibles antes de comenzar. Un intento activo por cuenta; admite cualquier bloque, independientemente de los desbloqueos de la ruta. Selección manual o automática al azar por cantidad, exclusivamente del conjunto de temas seleccionados, sin preguntas repetidas. La opción automática reemplaza la selección previa, limpia la búsqueda y permite revisar/cambiar preguntas antes de empezar. No garantiza una cuota por tema. Se puede navegar, cambiar o quitar respuestas y confirmar la entrega. Después se muestran aciertos, omisiones, corrección, explicaciones, páginas y fuentes de contraste cuando corresponden. Historial de los últimos 50 intentos.

El reloj no se pausa al salir ni al desconectarse. PostgreSQL fija inicio y vencimiento; solo cuentan respuestas confirmadas por el servidor antes del plazo. El cliente sincroniza periódicamente y al volver al primer plano. El cierre por vencimiento se materializa en la siguiente consulta/acción, sin proceso programado; ninguna respuesta tardía puede entrar. La interfaz desconectada necesita reconectar para recibir su resultado.

Intentos, instantánea completa de preguntas y resultados persisten en PostgreSQL. Corrección y propiedad del intento comprobadas en servidor; transacciones, bloqueo de filas, versiones de respuesta y clave de creación evitan duplicados/conflictos. No modifica XP, racha ni desbloqueos. No es un examen supervisado ni un mecanismo antitrampas: el material de estudio sigue disponible.

No se añadieron pausa, modo sin tiempo ni preguntas escritas por el usuario. Son posibles ampliaciones. Registro simplificado a estudiantes: no muestra selector de rol y la API rechaza roles distintos. Se conservan las cuentas antiguas. Aviso de datos local-v2 incluye exámenes; no se reescribe la aceptación histórica de usuarios existentes.

## Máquina de garra — prototipo interactivo (23/10/2026)

**Actualización 24/10/2026:** ya se conectó a casos clínicos, rarezas, XP/monedas y persistencia real. Ver `RETOS-CLINICOS.md` para estado y reglas vigentes. Lo siguiente conserva el historial del prototipo anterior; sus límites de «sin preguntas/premios» ya no aplican.

Propuesta pixel art aprobada y petición «sigamos»: nueva pestaña Jugar con acceso a `/claw`, protegida por sesión. Flechas por toque o pulsación sostenida, ajuste asistido a la cápsula más cercana, descenso, cierre, elevación, transporte, entrega y apertura. Once cápsulas por prueba; se puede repetir y rellenar al vaciar. Interrupciones al salir o pasar a segundo plano cancelan la extracción sin consumir la cápsula. Bloqueo de controles y guardia síncrona contra recogidas simultáneas. Estado local, no modifica progreso ni base de datos.

Arte independiente generado con herramienta integrada: fondo, garra abierta/cerrada y atlas de cápsulas. React Native Animated, sin motor gráfico ni dependencias nuevas; transforms/opacity con controlador nativo en móvil y JS en web. Preferencia de movimiento reducido del dispositivo como valor inicial, modificable para esta prueba, sin persistir ajustes. Textos/controles accesibles fuera de las imágenes; carga de arte validada antes de habilitar controles y opción de recarga en caso de error.

Todavía NO implementado: preguntas del PDF, premios de XP/monedas, tienda, sonidos ni física real. Antes de conectar recompensas, definir reglas, límites de repetición y validación idempotente en servidor. Mantenerlo separado del modo examen. Los PNG son arte de prototipo y deberán pulirse si se requiere una cuadrícula pixel-perfect uniforme.

Pulido de movimiento (23/10): curvas suaves para el motor y frenado, balanceo leve, articulación real de brazos recortando el sprite abierto en ejecución, caída acelerada/rebote y cápsula única con escala gradual hasta la salida. Apertura modal centrada con separación/rotación de mitades y brillo discreto. El controlador puro se prueba sin temporizadores, incluyendo cancelaciones en cada fase y callbacks tardíos; el adaptador móvil anima transforms/opacity de forma nativa. La modalidad oculta el fondo al lector y los anuncios de movimiento se agrupan para no encadenar todas las fases. Falta QA en dispositivos reales; no es una simulación física ni hay garantía de FPS.
