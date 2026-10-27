# Android: APK de prueba local

## Alcance

El perfil EAS `preview` genera un APK firmado llamado **PsicoAprende Prueba**,
con identificador `com.angelbsc.psicoaprende.preview`. Se instala directamente
en Android: no necesita Expo Go ni Metro. No es una publicación en Google Play.

Esta versión utiliza la API del computador en `http://192.168.123.100:3001`.
El teléfono y el computador deben estar en la misma red, y el computador debe
permanecer encendido con PostgreSQL y la API funcionando. El 27/10/2026 el
usuario confirmó que `/health` devuelve `ok` desde su Android.

HTTP se permite únicamente en este perfil de pruebas. Utilizar una red privada
de confianza y credenciales de prueba; no introducir datos de pacientes ni
reutilizar contraseñas importantes. El despliegue público requerirá HTTPS y una
API accesible desde Internet. La base de datos no se distribuye dentro del APK.

## Instalar y comprobar

Compilación solicitada el 27/10/2026:
[Estado y descarga en Expo](https://expo.dev/accounts/angelbsc/projects/psicologia-app/builds/3de8b454-1b11-4304-96e7-d6d88d8c1fcf).
La descarga solo estará disponible cuando indique **Finished**. Si aparece en
cola o en ejecución, todavía no hay un instalador terminado.

1. Abrir el enlace de la compilación terminada en el navegador del Android y descargar el APK.
2. Si Android lo solicita, permitir temporalmente instalar desde ese navegador. No desactivar Play Protect.
3. Instalar **PsicoAprende Prueba** y después retirar ese permiso al navegador.
4. Crear una cuenta de prueba o usar una cuenta existente de esta instalación.
5. Comprobar acceso, lecciones, exámenes, máquina de garra y perfil. Cerrar y abrir la app para verificar persistencia.
6. Para recordatorios, activar la opción y conceder permiso cuando Android lo solicite. Probar recepción con la app en segundo plano; el sistema puede retrasar avisos según ahorro de batería.

No se considera validada la experiencia en un dispositivo físico hasta completar
estas pruebas. En particular, comprobar animaciones, regreso desde segundo plano
y permisos de notificaciones.

## Encender el servidor después de apagar el computador

Abrir Docker Desktop y, en PowerShell dentro de la carpeta `psicologia-app`:

```powershell
npm run db:up
npm run api
```

Mantener abierta la terminal de la API. No hace falta ejecutar `npm run web`
para usar el APK. No borrar volúmenes de Docker: contienen las cuentas y el progreso.

Desde el teléfono, abrir `http://192.168.123.100:3001/health`; debe mostrar
`status: ok`. Si falla, revisar red compartida, servicios e IP del computador.
No exponer PostgreSQL a Internet. No se han cambiado reglas de firewall.

## Recompilar

La URL queda incorporada al APK durante la compilación. Si cambia la IP del
computador, restaurar esa dirección en la red o modificar `EXPO_PUBLIC_API_URL`
en `eas.json` y generar otro APK. Cambios del cliente también requieren recompilar.

```powershell
$env:EAS_NO_VCS = '1'
$env:EXPO_NO_DOTENV = '1'
npx --yes eas-cli@latest build --platform android --profile preview
```

Proyecto EAS: `@angelbsc/psicologia-app`, ID
`f2c340ea-a4f9-40cf-9406-4a9ee4e21f01`. La firma está administrada en EAS;
conservar el acceso a la cuenta para futuras actualizaciones.

`.easignore` excluye servidor, variables privadas, respaldos, PDF y archivos
locales. `EAS_NO_VCS=1` evita incluir historial Git. La inspección del archivo
de carga del 27/10/2026 no encontró esos archivos privados.
