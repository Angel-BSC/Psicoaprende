# Perfil funcional — 26/10/2026

## Funcionalidades

- Nombre editable de 2–80 caracteres, validado en cliente y servidor; correo y rol no se cambian desde esta pantalla.
- Meta diaria: 30, 50, 100 o 150 XP. Cambiarla actualiza Inicio, sin dar XP ni alterar la racha.
- Lectura: normal, grande (+15%) o muy grande (+30%); espaciado adicional opcional y vista previa. Se aplica a textos de lecciones, exámenes en curso/resultados y casos clínicos. No desactiva el escalado accesible del sistema.
- Personalización: estilo Clásico gratuito; Jardín de ideas (30 monedas), Mente curiosa (60), Luz del conocimiento (100). Compra explícita con confirmación, colección permanente y selección de estilo independiente. Visible en Perfil e Inicio. Sin azar ni pagos reales.
- Recordatorio diario local en Android/iOS con hora y minuto. Solo solicita permiso al activar; muestra errores de permiso/sistema. Estado real leído de las notificaciones programadas, persistente al reiniciar la app. Actualizar cancela el anterior; cerrar sesión cancela avisos, y cambiar de cuenta elimina los de la anterior. Al volver a iniciar sesión hay que activarlo otra vez. Hora local del dispositivo, entrega susceptible a restricciones del sistema. En web se explica que no hay avisos con la app cerrada; no se simula activación.
- Enlace al aviso de datos y cierre de sesión existente.

## Servidor y datos

`GET /profile` recupera nombre, preferencias, estilo, colección y saldo. `POST /profile` admite exclusivamente nombre/meta/lectura; `POST /profile/purchase {itemId}` canjea, y `POST /profile/equip {itemId}` elige un estilo propio. Todas las rutas exigen sesión, ignorando cualquier identidad o precio enviados para un canje. El catálogo y precios son del servidor.

Tablas nuevas aditivas: `profile_preferences` y `profile_purchases`. Precio pagado histórico y propiedad se registran juntos, con clave única usuario/objeto. Misma exclusión por fila de usuario que los premios de la garra; transacciones impiden saldo negativo y compras duplicadas concurrentes. Reintentar la misma compra devuelve la colección sin cobrar otra vez. Saldo disponible = premios ganados − canjes; `/progress`, `/claw` y `/profile` usan ese mismo cálculo. No se modifica XP para comprar. No hay devoluciones automáticas ni venta de monedas.

Aviso `local-v4`: describe preferencias, canjes y avisos locales; la aceptación histórica no se sobrescribe. No se implementaron recuperación de contraseña, verificación por correo ni eliminación de cuenta: no eran opciones pendientes de esta pantalla y requieren su flujo específico.

## Verificación y límites

101 pruebas automáticas aprobadas, TypeScript y lint correctos. Pruebas de API en esquemas PostgreSQL aislados (eliminados al terminar), incluyendo reinicio de API, aislamiento entre usuarios, validación, doble canje, insuficiencia de saldo y rollback. Controlador de recordatorios probado con adaptador simulado: denegación/revocación, cambios concurrentes, desactivación y cambio de sesión durante la solicitud de permiso.

QA web con cuenta sintética: validación y guardado de nombre; meta de 100 XP reflejada en Inicio; texto muy grande/espaciado guardado y aplicado en lección a 320 px (19.5 px y 35.1 px de interlineado); canje de 30 monedas, aplicación de avatar, persistencia tras recarga y saldo de 40. XP permanece en 160 y lecciones en 0. No se usó una cuenta real del usuario.

Exportaciones web y Android aprobadas en `.local-build/web-profile-20261026` y `.local-build/android-profile-20261026`. Se añadió `expo-notifications` mediante `expo install` para SDK 57 y su config plugin. Un desarrollo nativo ya instalado necesita reconstruirse para incorporar el módulo; la exportación JS no es una instalación APK/IPA. Falta verificar permisos y entrega de avisos en teléfono físico, con app cerrada, ahorro de batería y cambio de zona horaria. No se afirma que se hayan recibido notificaciones reales en este equipo Windows.

Referencia de implementación: https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
