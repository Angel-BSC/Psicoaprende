# Contenido de estudio: semiología

## Fuente y alcance

Documento proporcionado por el usuario: «2026 (2) SEMIOLOGÍA DE LOS PROCESOS Y FUNCIONES PSICOLÓGICAS», 49 páginas. ULEAM, Carrera de Psicología; docente indicada: Psi. Clin. Paola Intriago Alarcón, Mg. La numeración impresa coincide con la página del archivo.

La versión `semiologia-2026-v1` contiene **25 lecciones, 75 fichas conceptuales y 75 preguntas**, distribuidas en ocho bloques. Es una selección introductoria de conceptos, no una conversión exhaustiva ni un sustituto del documento. El contenido es una adaptación didáctica no validada por la docente. El PDF no se redistribuye dentro del paquete de la app. Las aclaraciones son decisiones editoriales de la app, no peticiones del PDF ni de la docente.

| Bloque | Lecciones | Secciones consultadas del PDF |
| --- | --- | --- |
| Conciencia y orientación | Nivel, cualidad, orientación | 1–4 |
| Atención y memoria | Atención, memoria | 5–8 |
| Percepción y experiencia del yo | Sensaciones, ilusiones/alucinaciones, experiencia del yo | 9–15 |
| Pensamiento y lenguaje | Curso, contenido, lenguaje | 15–24 |
| Afectividad y conducta | Afectividad, motricidad, conducta/intención | 25–41 |
| Sueño, ingesta y relaciones | Sueño, ingesta, relaciones | 42–45 y 48; comparación con p. 19 |
| Sexualidad: conceptos y contexto | Respuesta sexual, deseo, disfunciones, identidad/intereses/consentimiento | 45–48 |
| Aclaraciones y lectura crítica | Transiciones del sueño, pensamiento, mutismo selectivo, apetito/trastornos | 11, 15–16, 24, 44–45 |

Cada ficha y pregunta tiene páginas concretas en `src/data/learning.ts`. Los rangos de esta tabla son secciones de referencia, no una promesa de que todos sus términos estén evaluados. Los ejemplos son ejercicios académicos, no pruebas de autodiagnóstico ni recomendaciones de tratamiento.

## Flujo actual

Actualización puntual — 23/10/2026: solo los enunciados y explicaciones de las tres preguntas de «Tiempo, espacio y persona» (bloque 1) se contextualizaron como viñetas clínicas ficticias de entrevista. Se mantienen conceptos evaluados, opciones en el mismo orden, índices correctos, páginas e IDs; es una reformulación didáctica, no un nuevo objetivo de evaluación. No se modifica la lectura ni ninguna otra lección y no se invalida el progreso guardado. Los exámenes ya creados conservan su instantánea; los nuevos usan los enunciados actualizados. Se comprobó visualmente la p. 4 del PDF y se contrastó la exploración de tiempo/lugar/persona con [Merck Manual, evaluación del estado mental](https://www.merckmanuals.com/professional/neurologic-disorders/neurologic-examination/how-to-assess-mental-status). Los casos describen hallazgos, no atribuyen enfermedades ni causas.

Leer tres fichas → responder tres preguntas → ver explicación y páginas → guardar resultado en PostgreSQL. Se puede volver a los conceptos sin perder respuestas. La siguiente lección se desbloquea al finalizar la anterior; se verifica también en servidor.

Se mantiene la regla previa del prototipo: 30 XP por primera finalización, independientemente de aciertos; los repasos muestran la puntuación actual pero no duplican XP ni sobrescriben el primer intento guardado. «Completada» no significa dominio. No hay preguntas aleatorias, monedas ni compras en esta versión.

Los IDs nuevos tienen prefijo `semiologia-2026-v1`. Las finalizaciones anteriores permanecen en la base de datos y en el XP histórico, pero no cuentan como lecciones de la nueva ruta ni la desbloquean. Si cambia el significado de una pregunta o el orden de sus opciones, debe versionarse su ID y el de su lección; no reusar un ID para contenido distinto.

## Aclaraciones editoriales y trazabilidad

El PDF no solicita aclaración docente. Esa nota la añadió la app y su redacción anterior era demasiado general. Los apartados ya no quedan excluidos en bloque: tienen ocho lecciones nuevas y 24 preguntas. La revisión con la docente sigue siendo recomendable para acordar qué terminología se espera en clase; no se afirma que haya ocurrido.

- **P. 11:** aparece «hipnagógicas» tanto para salir como para entrar al sueño, verificado visualmente. La nueva lección pregunta la distinción de la fuente externa y señala expresamente la discrepancia.
- **P. 15:** se contrasta «pensamiento autista/autismo» con la descripción del neurodesarrollo del NIMH. No se equiparan.
- **P. 16:** se practica la descripción de aceleración e interrupción. No se valida como regla universal la equivalencia fuga de ideas/descarrilamiento o bloqueo/robo del pensamiento. Queda pendiente una comparación clínica más profunda con fuentes específicas.
- **P. 24:** se contrasta mutismo selectivo con ASHA y se practica la distinción entre ansiedad, contexto y atribución de voluntad.
- **Pp. 44–45:** se distingue pérdida de apetito de anorexia nerviosa y se contrasta bulimia con NIMH. No se usan combinaciones de alimentos como prueba de trastorno.
- **Pp. 45–48:** se practican fases, vocabulario del deseo, excitación, eyaculación, dolor, identidad e intereses. La identidad no se convierte en diagnóstico; se separan intereses atípicos y trastornos, con fuentes APA. No se evalúan explicaciones causales, umbrales temporales o fisiología vascular dudosos como hechos confirmados. No se cubre exhaustivamente cada término del listado de parafilias.
- No se reproducen ejemplos de prácticas dañinas como instrucciones de exploración ni procedimientos de autolesión. Evitar lenguaje estigmatizante y asociaciones que permitan inferir diagnósticos a partir de una sola viñeta.

Las fuentes externas se enlazan en la lectura y en el feedback de las lecciones correspondientes. Las páginas del PDF identifican el pasaje contrastado, no se presentan como respaldo de una corrección externa. Consultas: 16–17 de octubre de 2026.

- [Institute of Medicine, glosario del sueño (2006), NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK19965/?report=reader): distinción hipnagógico/hipnopómpico, no criterios diagnósticos.
- [NIMH, Autism Spectrum Disorder](https://www.nimh.nih.gov/health/publications/autism-spectrum-disorder).
- [ASHA, Selective Mutism](https://www.asha.org/practice-portal/clinical-topics/selective-mutism/).
- [NIMH, Eating Disorders](https://www.nimh.nih.gov/health/publications/eating-disorders).
- [APA, What is Gender Dysphoria?](https://www.psychiatry.org/patients-families/gender-dysphoria/what-is-gender-dysphoria).
- [APA, Paraphilic Disorders, ficha DSM-5](https://www.psychiatry.org/File%20Library/Psychiatrists/Practice/DSM/APA_DSM-5-Paraphilic-Disorders.pdf).

Las nuevas lecciones se añaden después de las 17 anteriores para conservar orden e historial. No cambian las respuestas ni los IDs de preguntas ya guardadas. Siguiente trabajo editorial: revisión por docente, más preguntas por concepto, distractores más próximos, casos contextualizados y ampliación explícita de cobertura.

## Idea futura del usuario — no implementada

Máquina de garra inspirada en la referencia visual rosa/cian del chat. Contiene cápsulas; una animación selecciona una, la abre y revela una pregunta aleatoria del PDF. Aciertos otorgarían XP y monedas canjeables por objetos de personalización del perfil.

Antes de desarrollarla: decidir reglas de repetición y recompensas, validar preguntas, separar animación de evaluación, calcular premios en servidor y ofrecer opción de reducir movimiento. No hay dependencias de motor gráfico, endpoints, moneda, tienda ni animaciones añadidas para esta idea.
