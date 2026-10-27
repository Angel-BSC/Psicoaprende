# Recuperación local de Docker — 16 de octubre de 2026

Autorización: el usuario pidió reparar conservando datos, sin reset ni borrado de volúmenes.

## Causa observada y actuación

Docker Desktop abortaba al inicializar `dockerInference`, con el error de Windows «The file cannot be accessed by the system». Los endpoints temporales eran objetos ReparsePoint de tamaño cero. El reinicio normal no terminó de recuperar el servicio.

Se detuvo Docker mediante `docker desktop stop --force --timeout 15`, se verificó la ausencia de procesos Desktop/backend y se conservaron estas dos carpetas mediante renombrado, sin borrar su contenido:

- `C:/Users/Administrator/AppData/Local/Docker/run` → `run.recovery-20261016`
- `C:/Users/Administrator/AppData/Local/docker-secrets-engine` → `docker-secrets-engine.recovery-20261016`

Se crearon carpetas vacías con los nombres originales y Docker arrancó con `docker desktop start --timeout 45`. El procedimiento coincide con el workaround reportado en https://github.com/docker/desktop-feedback/issues/554 . No garantiza que el fallo no vuelva a ocurrir.

No se modificaron los discos VHDX, imágenes, configuración de autenticación ni volúmenes; tampoco se reinstaló ni restableció Docker. Las carpetas de respaldo siguen presentes: no intentar limpiarlas automáticamente.

## Comprobaciones

- Contenedor original `psicoaprende-db-1`, PostgreSQL 17, estado healthy.
- Volumen `psicoaprende_postgres-data` conservado, fecha original 15 de octubre de 2026.
- Antes de probar nuevas lecciones: una cuenta y una finalización anteriores, legibles desde PostgreSQL.
- Respaldo privado: `.local-backups/psicoaprende-20261016-recovery.dump`, formato pg_dump custom, 6389 bytes. Se comprobó su índice con pg_restore; no se realizó una restauración de ensayo. Excluido de Git. Contiene datos privados y hashes: no compartir.
- API `/health`: status ok, database postgresql.
- 22 pruebas automáticas aprobadas: autenticación, sesiones, aislamiento, persistencia, historial anterior, nueva ruta, repetición sin duplicar XP y estructura del contenido.
- Prueba manual web en ancho móvil: sesión anterior restaurada; lectura, respuesta incorrecta, repaso sin perder respuesta, respuestas correctas, guardado 2/3 y 30 XP; ruta 1/17 y siguiente lección desbloqueada después de recargar.

Se usó la cuenta sintética de pruebas ya existente, no una cuenta de estudiante real. Se añadió la primera finalización de semiología a esa cuenta; su XP pasó de 30 a 60 manteniendo la finalización anterior.

Queda pendiente la prueba en dispositivos físicos Android/iOS. La exportación Android anterior pasó, pero no sustituye esa prueba.
