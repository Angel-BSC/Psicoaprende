# Cápsulas clínicas — actualización, 26/10/2026

## Balance inicial ajustable

| Rareza al abrir | Color revelado | Probabilidad por apertura | Primer acierto por caso |
| --- | --- | --- | --- |
| Especial | Salvia | 70% | 30 XP + 10 monedas |
| Épica | Lavanda | 25% | 60 XP + 25 monedas |
| Legendaria | Dorada | 5% | 100 XP + 50 monedas |

Por petición del usuario, las once cápsulas cerradas son idénticas, sin letras ni colores que anticipen calidad. La garra sigue siendo manual y asistida a la cápsula más cercana horizontalmente (superior en un empate). La rareza se sortea en servidor al abrir por primera vez, con `crypto.randomInt(100)` y umbrales 70/95/100; después se elige el caso de esa rareza. La posición y las aperturas anteriores no cambian las probabilidades. No hay cupos por carga ni legendaria garantizada. Los porcentajes son un balance inicial ajustable, no una frecuencia garantizada en pocas partidas.

Se eliminó la distribución anterior 7/3/1. Los tableros antiguos conservan IDs/posiciones, pero se ignoran sus campos de rareza/color y la API solo expone cápsulas neutras. Los casos ya abiertos y premios guardados conservan su calidad y resultado: recargar o reenviar la misma apertura no vuelve a sortear. Sin coste por intento, compras, dinero real ni pérdidas por error. Tienda y canje aún no implementados.

Cada caso entrega premio únicamente en su primer acierto por cuenta. Un error permite aprender con la explicación y volver a intentarlo cuando el caso reaparezca. Casos premiados se identifican como repaso sin premio. El servidor prioriza los casos de la rareza que se han presentado menos veces. El banco es finito: 12 casos, cuatro por rareza, con un máximo inicial de 760 XP y 340 monedas por cuenta si se aciertan todos. Los premios no desbloquean lecciones; sí se suman al XP total, objetivo diario y racha en America/Guayaquil.

## Contenido y límites

Casos ficticios originales para apoyar el estudio, no material clínico real ni instrumentos diagnósticos. Dificultad editorial propuesta para estudiantes, pendiente de validación docente y pilotaje: especial aplica conceptos; épica diferencia fenómenos próximos; legendaria integra varios hallazgos. No se afirma validación para quinto semestre ni cobertura exhaustiva del PDF. Las explicaciones y páginas están disponibles después de contestar.

La lectura del PDF se utilizó para conservar terminología y páginas, no para reproducir automáticamente todas sus afirmaciones. No se cambian las 75 preguntas de la ruta ni los exámenes previos. Banco y claves solo en `server/data/claw-cases.mjs`; el cliente recibe las cuatro opciones, nunca la clave antes de responder.

| Caso | Rareza | PDF, páginas | Operación de razonamiento |
| --- | --- | --- | --- |
| orientacion-01 | Especial | 4 | Orientación temporal frente a identidad y espacio |
| percepcion-01 | Especial | 10, 12 | Ilusión frente a percepción sin objeto |
| curso-01 | Especial | 15–17 | Lentificación frente a bloqueo o desorganización |
| memoria-01 | Especial | 7–8 | Consolidación nueva frente a evocación remota |
| yo-02 | Épica | 13, 15 | Extrañamiento del yo, identidad y autoscopia |
| tamano-02 | Épica | 10, 12, 15 | Micropsia frente a alucinación liliputiense |
| discurso-02 | Épica | 16–17 | Circunstancialidad con meta frente a tangencialidad |
| recuerdo-02 | Épica | 8 | Ecmnesia frente a viveza o familiaridad |
| integracion-03 | Legendaria | 3–5, 10 | Inicio/fluctuación/atención: hipótesis sindrómica sin atribuir causa |
| interrupcion-03 | Legendaria | 16 | Bloqueo frente a sustracción del pensamiento |
| asociaciones-03 | Legendaria | 16–17 | Fuga de ideas frente a disgregación |
| percepcion-03 | Legendaria | 10, 12–13 | Tres experiencias: objeto, distorsión e interpretación |

Fuentes complementarias consultadas (24/10/2026):

- [Columbia University: Mental Status Examination](https://www.columbia.edu/itc/hs/medical/psychmed/1_2004/mental_status_exam.pdf): definiciones de circunstancialidad, tangencialidad, bloqueo y fuga de ideas. Aclara la equivalencia problemática «fuga de ideas o descarrilamiento» de p. 16. No se adoptan sin matices todas las definiciones del documento histórico.
- [OpenStax: Clinical Nursing Skills, §20.1, tabla 20.2](https://openstax.org/books/clinical-nursing-skills/pages/20-1-mental-health-assessment): diferencia bloqueo de la creencia en sustracción externa. Se explicita la aclaración frente a p. 16, que también denomina «robo» al bloqueo.
- [NICE CG103, §§1.3.1 y 1.5.1](https://www.nice.org.uk/guidance/cg103/chapter/Recommendations): cambios recientes y fluctuantes, cognitivos y perceptivos, como indicadores que ameritan evaluación. No se diagnostica una causa ni se impone el límite de dos semanas del PDF.

## Persistencia y contrato

- `GET /claw`: recupera (o inicializa) tablero propio, intento activo y saldo.
- `POST /claw/attempts {capsuleId}`: sortea calidad y asigna caso al abrir una cápsula ya entregada visualmente. Reintento con el mismo ID devuelve el mismo caso y calidad; otro ID se rechaza si hay uno pendiente. Sorteo, instantánea y consumo se confirman juntos en PostgreSQL. La animación cancelada no hace esta petición y no consume en servidor.
- `POST /claw/attempts/:id/answer {answer}`: corrige la instantánea y registra premio en una transacción. Primera respuesta definitiva; repetir la misma es idempotente; cambiarla se rechaza.
- `POST /claw/attempts/:id/close {}`: reconoce un resultado y permite el siguiente. El resultado permanece recuperable hasta esta confirmación, incluso si se pierde la respuesta HTTP.
- `POST /claw/refill {}`: solo tras vaciar y cerrar el caso; crea una carga nueva sin reiniciar historial/premios.

Tablas aditivas `claw_boards`, `claw_attempts`, `claw_case_rewards`. Bloqueo por usuario y restricciones únicas para concurrencia. Sin cambios de cuentas antiguas, lecciones o volumen Docker. Requiere conexión para abrir/corregir; sin cola offline. Un conflicto entre pestañas se resuelve con «Actualizar estado guardado». No es un examen supervisado ni protección contra consultar el material; sí evita falsificar rarezas/premios y contabilizarlos dos veces.

El aviso local-v3 documentó estos registros; local-v4 añade preferencias y canjes del perfil. Las aceptaciones históricas no se reescriben. El saldo ahora descuenta canjes de estilos (ver `PERFIL.md`), sin alterar XP ni premios históricos. Revisión de condiciones, privacidad y contenido necesaria antes de publicación.
