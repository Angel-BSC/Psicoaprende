export const courseSource = {
  id: 'semiologia-2026-v1',
  title: 'Semiología de los procesos y funciones psicológicas',
  author: 'Psi. Clin. Paola Intriago Alarcón, Mg',
  institution: 'ULEAM · Carrera de Psicología',
  pageCount: 49,
  note: 'Adaptación de estudio, no validada por la docente. Las aclaraciones editoriales son de la app, no instrucciones del PDF. No sustituye el material ni permite diagnosticar.',
};
export type Concept = { title: string; body: string; pages: number[] };
export type Question = { id: string; prompt: string; options: string[]; correctIndex: number; explanation: string; pages: number[] };
export type Lesson = {
  id: string; moduleId: string; title: string; description: string; duration: string;
  xp: number; icon: string; pages: number[]; concepts: Concept[]; questions: Question[];
  references: { title: string; url: `https://${string}` }[];
};
export const modules = [
  { id: 'conciencia', title: 'Conciencia y orientación', icon: '🧭' },
  { id: 'atencion', title: 'Atención y memoria', icon: '🧠' },
  { id: 'percepcion', title: 'Percepción y experiencia del yo', icon: '👁️' },
  { id: 'pensamiento', title: 'Pensamiento y lenguaje', icon: '💬' },
  { id: 'afectividad', title: 'Afectividad y conducta', icon: '🌿' },
  { id: 'funciones', title: 'Sueño, ingesta y relaciones', icon: '🌙' },
  { id: 'sexualidad', title: 'Sexualidad: conceptos y contexto', icon: '📚' },
  { id: 'aclaraciones', title: 'Aclaraciones y lectura crítica', icon: '🔎' },
];
// Fuentes de contraste: no forman parte del PDF de clase. Consultadas el 16–17-10-2026.
const contrastSources: Record<string, Lesson['references']> = {
  'identidad-intereses': [
    { title: 'APA · What is Gender Dysphoria?', url: 'https://www.psychiatry.org/patients-families/gender-dysphoria/what-is-gender-dysphoria' },
    { title: 'APA · Paraphilic Disorders (DSM-5)', url: 'https://www.psychiatry.org/File%20Library/Psychiatrists/Practice/DSM/APA_DSM-5-Paraphilic-Disorders.pdf' },
  ],
  'transiciones-sueno': [{ title: 'Institute of Medicine · Glosario del sueño (2006), NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK19965/?report=reader' }],
  'lectura-pensamiento': [{ title: 'NIMH · Autism Spectrum Disorder', url: 'https://www.nimh.nih.gov/health/publications/autism-spectrum-disorder' }],
  'mutismo-contexto': [{ title: 'ASHA · Selective Mutism', url: 'https://www.asha.org/practice-portal/clinical-topics/selective-mutism/' }],
  'apetito-trastornos': [{ title: 'NIMH · Eating Disorders: What You Need to Know', url: 'https://www.nimh.nih.gov/health/publications/eating-disorders' }],
};
const c = (title: string, body: string, ...pages: number[]): Concept => ({ title, body, pages });
const q = (prompt: string, options: string[], correctIndex: number, explanation: string, ...pages: number[]): Omit<Question, 'id'> =>
  ({ prompt, options, correctIndex, explanation, pages });
function lesson(slug: string, moduleId: string, title: string, description: string, concepts: Concept[], questions: Omit<Question, 'id'>[]): Lesson {
  const id = `${courseSource.id}-${slug}`;
  return {
    id, moduleId, title, description, concepts, duration: '5–7 min', xp: 30, references: contrastSources[slug] ?? [],
    pages: [...new Set([...concepts, ...questions].flatMap((item) => item.pages))].sort((a, b) => a - b),
    icon: modules.find((item) => item.id === moduleId)!.icon,
    questions: questions.map((question, index) => ({ ...question, id: `${id}-q${index + 1}` })),
  };
}
// Adaptación didáctica, no transcripción ni clasificación diagnóstica independiente.
// Versionar IDs si cambia el significado o el orden de respuestas de una pregunta.
export const lessons: Lesson[] = [
  lesson('nivel-conciencia', 'conciencia', 'El nivel de conciencia', 'Distingue elevación y disminución del estado de alerta.', [
    c('Una función integradora', 'La conciencia participa en el control del pensamiento y la acción. Sus alteraciones pueden repercutir en atención, percepción, memoria y otras funciones.', 1),
    c('Más o menos alerta', 'Las alteraciones cuantitativas describen cambios de la vigilia. El material sitúa la hipervigilancia en la elevación y la obnubilación en la disminución: cuesta mantener la alerta, aunque se pueden seguir lentamente órdenes sencillas.', 1),
    c('Distinguir grados', 'En la somnolencia se necesita estimulación para mantenerse despierto. En el estupor solo estímulos muy intensos logran un leve estado de alerta. En el coma no se consigue despertar a la persona mediante estimulación intensa.', 2, 3),
  ], [
    q('¿Qué describen las alteraciones cuantitativas de la conciencia?', ['El contenido de los recuerdos', 'El grado de elevación o disminución de la vigilia', 'La estructura gramatical', 'Los intereses personales'], 1, 'El criterio es el nivel de conciencia comparado con el estado de vigilia habitual.', 1),
    q('Una viñeta describe dificultad para mantenerse alerta, pero ejecución lenta de órdenes sencillas. ¿Qué término corresponde?', ['Hipervigilancia', 'Coma', 'Obnubilación', 'Hipermnesia'], 2, 'La obnubilación reduce la alerta sin eliminar completamente la capacidad de reconocer y seguir órdenes sencillas.', 1),
    q('¿Qué rasgo diferencia el coma del estupor en esta lectura?', ['Mayor facilidad para conversar', 'Recuerdos más detallados', 'Imposibilidad de despertar pese a estimulación intensa', 'Atención dirigida a una sola idea'], 2, 'En el estupor se puede lograr un leve estado de alerta con estímulos muy potentes; en el coma no se logra despertar a la persona.', 2, 3),
  ]),
  lesson('cualidad-conciencia', 'conciencia', 'La cualidad de la conciencia', 'Reconoce estrechamiento, vivencias oníricas y automatismos.', [
    c('No es solo intensidad', 'Las alteraciones cualitativas incluyen cambios globales de funciones cognitivas o restricción del campo de conciencia. El PDF coloca aquí delirium y estados crepusculares y oniroides.', 3),
    c('Crepuscular y oniroide', 'El estado crepuscular se describe con inicio y final súbitos, estrechamiento de conciencia y amnesia posterior. En el oniroide destacan vivencias escénicas muy vívidas, semejantes a un sueño.', 3),
    c('Automatismos', 'Una acción automática puede parecer coordinada e intencional, pero ocurre sin control consciente. Después puede quedar un recuerdo parcial, confuso o ausente.', 4),
  ], [
    q('¿Qué conjunto caracteriza el estado crepuscular descrito?', ['Inicio y final súbitos, estrechamiento y amnesia posterior', 'Aumento estable del vocabulario', 'Mayor capacidad de aprendizaje', 'Pérdida aislada de la lectura'], 0, 'Estos tres elementos aparecen juntos en la descripción del estado crepuscular.', 3),
    q('¿Qué destaca en los estados oniroides?', ['Ausencia de cualquier vivencia', 'Vivencias escénicas intensas semejantes a sueños', 'Dificultad exclusiva para escribir', 'Memoria siempre aumentada'], 1, 'El material enfatiza experiencias escénicas vívidas que mezclan realidad y fantasía.', 3),
    q('¿Por qué una acción coordinada puede ser un automatismo?', ['Porque siempre es voluntaria', 'Porque requiere mucha práctica', 'Porque es necesariamente lenta', 'Porque puede ocurrir sin control consciente'], 3, 'La apariencia organizada de una conducta no demuestra control consciente.', 4),
  ]),
  lesson('orientacion', 'conciencia', 'Psicopatología de la orientación', 'Identifica las referencias que utiliza la orientación.', [
    c('Tiempo', 'La orientación temporal permite ubicarse en referencias como día, mes, año o momento del día. Su alteración se denomina desorientación alopsíquica temporal.', 4),
    c('Espacio', 'La orientación espacial sitúa a la persona en un lugar: habitación, localidad, ciudad o país. No reconocer dónde se encuentra corresponde al ámbito alopsíquico espacial.', 4),
    c('Persona', 'La orientación autopsíquica se refiere a la propia identidad. Separa las preguntas sobre quién es la persona de las preguntas sobre cuándo o dónde se encuentra.', 4),
  ], [
    q('En una entrevista clínica, una paciente comprende las preguntas, dice correctamente su nombre y reconoce que está en el hospital. Sin embargo, afirma que es enero de 2022 cuando la consulta ocurre en octubre de 2026. ¿Qué dimensión de la orientación está alterada en esta viñeta?', ['Temporal', 'Espacial', 'Motora', 'Afectiva'], 0, 'La discrepancia en el mes y el año corresponde a la orientación alopsíquica temporal. En la viñeta reconoce quién es y dónde está: esos datos ayudan a distinguir tiempo, persona y espacio. Este hallazgo describe una alteración, pero por sí solo no establece su causa ni un diagnóstico.', 4),
    q('Durante la valoración clínica, un paciente dice su nombre y la fecha correctamente. Aunque se encuentra en un hospital de Manta, afirma estar en su casa de Quito y no reconoce el lugar de la entrevista. ¿Qué función debe registrarse como alterada según estos datos?', ['Memoria semántica', 'Orientación espacial', 'Intensidad sensorial', 'Fluidez verbal'], 1, 'El dato clave es que no reconoce el lugar ni la ciudad donde se encuentra: corresponde a la orientación alopsíquica espacial. Decir correctamente su nombre y la fecha no descarta esa dificultad. La viñeta no aporta una evaluación de memoria semántica, intensidad sensorial o fluidez verbal, ni permite establecer la causa.', 4),
    q('En una entrevista clínica, una paciente no logra indicar la fecha ni el lugar donde se encuentra, pero dice correctamente su nombre y reconoce quién es. ¿Qué referencia permite identificar el componente autopsíquico conservado en esta viñeta?', ['La hora', 'El país', 'La propia identidad', 'La temperatura'], 2, 'Reconocer quién es y decir su nombre aporta información sobre la propia identidad, referencia de la orientación autopsíquica. La fecha y el lugar exploran otras dimensiones, por lo que fallar en ellas no implica automáticamente perder la orientación en persona. Se describen los datos del caso, no un diagnóstico.', 4),
  ]),
  lesson('atencion', 'atencion', 'Seleccionar y sostener la atención', 'Compara disminución, exceso y fatiga atencional.', [
    c('Seleccionar información', 'La atención prioriza información e inhibe otra. Aprosexia se refiere a ausencia de atención; hipoprosexia, a capacidad reducida; hiperprosexia, a focalización excesiva sobre un estímulo o tema.', 5),
    c('Inestabilidad y agotamiento', 'La distractibilidad dificulta sostener el foco. La fatigabilidad describe agotamiento al mantener la atención, acompañado de menor rendimiento y errores.', 6),
    c('Hacia dónde se atiende', 'La hipervigilancia implica búsqueda continua de señales. Los sesgos atencionales priorizan información relevante para preocupaciones, miedos o estado de ánimo. Algunas anomalías también aparecen sin psicopatología.', 5, 6),
  ], [
    q('¿Cómo se denomina la disminución de la capacidad atencional?', ['Hipermnesia', 'Hipoprosexia', 'Hiperprosexia', 'Alexia'], 1, 'Hipoprosexia es disminución; aprosexia es ausencia y la hiperprosexia implica focalización excesiva.', 5),
    q('¿Qué distingue la fatigabilidad atencional?', ['Agotamiento al sostener la atención', 'Ausencia de recuerdos antiguos', 'Distorsión del tamaño de objetos', 'Aumento de la voz'], 0, 'Aparece al mantener el esfuerzo atencional y se acompaña de bajo rendimiento y errores.', 6),
    q('¿Qué ejemplo representa un sesgo atencional?', ['No reconocer la fecha', 'Perder la capacidad de leer', 'Repetir un movimiento ajeno', 'Priorizar señales relacionadas con una preocupación'], 3, 'El sesgo dirige selectivamente la atención hacia información relevante para la persona.', 6),
  ]),
  lesson('memoria', 'atencion', 'Recordar y reconocer', 'Diferencia fijación, evocación y familiaridad.', [
    c('Procesos de memoria', 'La memoria permite almacenar, retener y recuperar información. La amnesia de fijación dificulta consolidar recuerdos nuevos; la de evocación dificulta recuperar información sin implicar necesariamente que se haya perdido.', 7),
    c('Cantidad y distorsiones', 'Hipomnesia supone disminución de memoria; hipermnesia, aumento de recuerdos. Las paramnesias deforman el recuerdo; las confabulaciones mezclan recuerdos falsos y verdaderos para cubrir lagunas.', 7, 8),
    c('Familiaridad', 'Déjà vu: algo nuevo se siente ya vivido. Jamais vu: una situación conocida no produce familiaridad. Errores cotidianos como tener una palabra en la punta de la lengua no implican necesariamente patología.', 8),
  ], [
    q('¿Qué proceso está afectado en la amnesia de fijación?', ['Consolidar recuerdos nuevos', 'Articular sonidos', 'Regular el tono muscular', 'Reconocer emociones'], 0, 'El problema central es consolidar nueva información en la memoria.', 7),
    q('¿Qué describe el jamais vu?', ['Recordar con detalle excesivo', 'Sentir familiaridad ante algo nuevo', 'No sentir familiaridad ante algo conocido', 'Repetir palabras ajenas'], 2, 'Puede existir reconocimiento sin la sensación de familiaridad esperada.', 8),
    q('¿Qué indica el material sobre tener una palabra en la punta de la lengua?', ['Siempre indica demencia', 'Puede ocurrir sin alteraciones mnésicas', 'Es una alucinación auditiva', 'Implica pérdida de conciencia'], 1, 'Las parapraxias incluyen errores simples que también se dan en la vida cotidiana.', 8),
  ]),
  lesson('sensaciones', 'percepcion', 'Intensidad, tamaño y forma', 'Clasifica qué propiedad de la percepción está cambiando.', [
    c('Intensidad sensorial', 'Hiperestesia: aumento de intensidad de las sensaciones. Hipoestesia: disminución. Anestesia: ausencia. El estímulo puede existir aunque su intensidad se experimente de otra manera.', 9),
    c('El caso del dolor', 'Hiperalgesia es percepción exagerada del dolor; hipoalgesia, reducida; analgesia, ausencia de percepción dolorosa. Estos términos se refieren específicamente al dolor.', 9),
    c('Tamaño y forma', 'Las metamorfopsias afectan el tamaño o la forma percibidos. Macropsia: objetos mayores. Micropsia: menores. Si la distorsión concierne al propio cuerpo, se habla de autometamorfopsia.', 10),
  ], [
    q('¿Qué término se refiere a percepción exagerada de la intensidad del dolor?', ['Hipoestesia', 'Hiperalgesia', 'Analgesia', 'Micropsia'], 1, 'Hiperalgesia describe específicamente aumento de intensidad percibida del dolor.', 9),
    q('Un objeto real se percibe de tamaño menor. ¿Qué término corresponde?', ['Macropsia', 'Hipermnesia', 'Micropsia', 'Ecolalia'], 2, 'Micropsia reduce el tamaño percibido; macropsia lo aumenta.', 10),
    q('¿Qué distingue la autometamorfopsia?', ['Distorsión del tamaño o forma del propio cuerpo', 'Pérdida de lectura', 'Repetición de una frase', 'Dificultad para iniciar el sueño'], 0, 'El prefijo auto señala que la distorsión se refiere al propio cuerpo.', 10),
  ]),
  lesson('ilusiones-alucinaciones', 'percepcion', 'Ilusión o alucinación', 'Distingue estímulo real, interpretación y modalidad.', [
    c('Ilusión', 'Una ilusión interpreta erróneamente un estímulo real. La pareidolia es una forma particular: atribuir una figura reconocible a un estímulo ambiguo, como ver un rostro en una nube.', 10, 11),
    c('Alucinación', 'El PDF describe una experiencia con fuerza perceptiva que ocurre sin el estímulo apropiado. La presencia de un estímulo real mal interpretado distingue la ilusión de la alucinación.', 12),
    c('Modalidades', 'Las experiencias alucinatorias pueden ser visuales, auditivas, olfativas, gustativas o táctiles. Modalidad indica la vía sensorial, no el contenido ni la complejidad.', 12, 13, 14),
  ], [
    q('Unas ramas se confunden con una persona. ¿Qué fenómeno ilustra este ejemplo académico?', ['Amnesia', 'Ilusión', 'Afasia', 'Hipomimia'], 1, 'Las ramas son un estímulo real interpretado erróneamente.', 10),
    q('Reconocer una cara en las nubes es un ejemplo de...', ['Pareidolia', 'Mutismo', 'Abulia', 'Aprosexia'], 0, 'En la pareidolia se organiza un estímulo ambiguo en una figura con significado.', 11),
    q('¿Qué clasifica la expresión «alucinación auditiva»?', ['La duración', 'La causa demostrada', 'El diagnóstico definitivo', 'La modalidad sensorial'], 3, 'Auditiva describe la vía sensorial, no una causa ni un diagnóstico.', 12, 13),
  ]),
  lesson('experiencia-yo', 'percepcion', 'Extrañeza del entorno y del yo', 'Separa desrealización, despersonalización y transformación.', [
    c('Desrealización', 'La extrañeza se dirige al entorno: las cosas se perciben, pero parecen irreales o como una fantasía. El material distingue esa vivencia de saber que lo percibido corresponde a la realidad.', 15),
    c('Despersonalización', 'La extrañeza se refiere al propio yo. Pueden sentirse como ajenos los actos, pensamientos o sentimientos, o experimentarse la conducta como automática.', 15),
    c('Transformación en el texto', 'El PDF reserva este término para la vivencia de haberse convertido en otra persona. No lo confundas con la sensación de extrañeza respecto de uno mismo.', 15),
  ], [
    q('¿Dónde se centra la vivencia de desrealización?', ['En el entorno', 'En la ortografía', 'En el apetito', 'En la velocidad de marcha'], 0, 'Se refiere a la extrañeza o irrealidad del entorno.', 15),
    q('Sentir los propios actos y pensamientos como extraños corresponde a...', ['Hipermnesia', 'Disfonía', 'Despersonalización', 'Macropsia'], 2, 'La extrañeza se centra en el propio yo.', 15),
    q('¿Qué diferencia propone el documento para la transformación?', ['No dormir una noche', 'Considerar que se es otra persona', 'Percibir un sonido más fuerte', 'Olvidar una fecha'], 1, 'El documento distingue sentirse extraño de considerar que se es otra persona.', 15),
  ]),
  lesson('curso-pensamiento', 'pensamiento', 'El curso de las ideas', 'Observa velocidad, dirección y organización del discurso.', [
    c('Velocidad', 'Bradipsiquia es lentificación de la producción de ideas; taquipsiquia es aceleración. Describe el ritmo antes de interpretar el contenido.', 15, 16),
    c('Dirección', 'La prolijidad incluye detalles y rodeos innecesarios relacionados con la idea central. La tangencialidad responde de manera oblicua o irrelevante. La pérdida de meta aleja el discurso del asunto inicial sin regresar a él.', 16, 17),
    c('Organización y abstracción', 'Neologismos son palabras inventadas o con significado particular. La pobreza del habla reduce el lenguaje espontáneo. El pensamiento concreto dificulta comprender metáforas y abstracciones.', 17, 18),
  ], [
    q('¿Qué término describe lentitud en la producción de ideas?', ['Taquipsiquia', 'Bradipsiquia', 'Hipermnesia', 'Ecolalia'], 1, 'Bradi indica lentificación; taqui, aceleración.', 15, 16),
    q('Una pregunta recibe una respuesta oblicua e irrelevante. ¿Qué rasgo se estudia?', ['Tangencialidad', 'Orientación temporal', 'Eutimia', 'Analgesia'], 0, 'La tangencialidad se manifiesta mediante respuestas que no abordan directamente lo preguntado.', 17),
    q('¿Qué dificultad define el pensamiento concreto?', ['Conservar tono muscular', 'Distinguir día y noche', 'Captar significados metafóricos', 'Percibir colores'], 2, 'El concretismo tiende a interpretar literalmente y dificulta la abstracción.', 18),
  ]),
  lesson('contenido-pensamiento', 'pensamiento', 'El contenido del pensamiento', 'Compara preocupación, rumiación, obsesiones y temas delirantes.', [
    c('Futuro frente a pasado', 'La preocupación se orienta a resultados futuros inciertos. La rumiación vuelve repetidamente sobre malestar, problemas y sus causas, especialmente en el presente o pasado reciente.', 19),
    c('Obsesiones e intrusiones', 'Una obsesión puede ser un pensamiento, imagen o impulso recurrente y no deseado que causa malestar. El PDF señala que los pensamientos intrusos también aparecen en población general; su presencia aislada no establece un trastorno.', 19, 20),
    c('Temas de las ideas delirantes', 'Se diferencian temas como persecución (ser vigilado o seguido), grandeza (exaltación de cualidades o importancia) y referencia (atribuir a uno mismo comentarios o sucesos). Son categorías de estudio, no diagnósticos de personas reales.', 21, 22),
  ], [
    q('¿Qué orientación temporal destaca en la preocupación?', ['El futuro incierto', 'Solo la infancia', 'Solo la hora presente', 'Ninguna referencia temporal posible'], 0, 'La preocupación anticipa problemas y resultados futuros inciertos.', 19),
    q('¿Qué indica el PDF sobre los pensamientos intrusos?', ['Siempre implican psicosis', 'Solo ocurren en el sueño', 'También aparecen en población general', 'Son necesariamente voluntarios'], 2, 'El material los describe también fuera de población clínica.', 20),
    q('En la clasificación de temas delirantes, ¿qué tema corresponde a ser vigilado o seguido?', ['Grandeza', 'Persecución', 'Ruina', 'Nihilismo'], 1, 'Persecución se refiere a vigilancia o seguimiento; es una clasificación del contenido descrito.', 21),
  ]),
  lesson('lenguaje', 'pensamiento', 'Lenguaje, habla y voz', 'Diferencia lectura, escritura, denominación y repetición.', [
    c('Capacidades adquiridas', 'Afasia es una alteración adquirida del lenguaje por lesión cerebral. Alexia es pérdida de lectura ya adquirida; agrafia, de escritura; anomia, dificultad para encontrar nombres de objetos o personas.', 23),
    c('Articulación y voz', 'La disartria afecta el habla por alteraciones del control muscular de la articulación. La disfonía se refiere a la voz. No equivalen a una alteración de la comprensión del lenguaje.', 23),
    c('Repetición y fluidez', 'La ecolalia repite palabras o frases de otra persona. La tartamudez afecta fluidez y ritmo del habla. Estudia qué aspecto cambia antes de elegir el nombre.', 24),
  ], [
    q('¿Qué término corresponde a pérdida de lectura previamente adquirida?', ['Agrafia', 'Alexia', 'Disfonía', 'Ecolalia'], 1, 'Alexia se refiere a lectura; agrafia, a escritura.', 23),
    q('¿Qué aspecto se altera en la disfonía?', ['La voz', 'La orientación', 'El recuerdo', 'El tamaño percibido'], 0, 'La disfonía comprende alteraciones de la voz.', 23),
    q('¿Qué describe la ecolalia?', ['Inventar un nombre', 'Hablar lentamente', 'Repetir palabras de un interlocutor', 'No reconocer un lugar'], 2, 'Es una repetición en eco del habla ajena.', 24),
  ]),
  lesson('afectividad', 'afectividad', 'Matices de la afectividad', 'Estudia tono emocional, placer e identificación de emociones.', [
    c('Tono afectivo', 'La afectividad abarca emociones, sentimientos y estados de ánimo. Eutimia describe equilibrio del ánimo; hipertimia, aumento del tono afectivo; hipotimia, disminución.', 25, 26),
    c('Placer y emociones contrapuestas', 'Anhedonia se refiere a pérdida de capacidad para experimentar placer. Ambivalencia afectiva reúne emociones contrapuestas frente al mismo estímulo.', 27),
    c('Reconocer y expresar', 'Alexitimia implica dificultad para identificar, describir y comunicar emociones propias. El texto distingue depresión como estado anímico, síntoma y síndrome: no son usos intercambiables.', 27, 28),
  ], [
    q('¿Qué concepto describe un estado de ánimo equilibrado?', ['Eutimia', 'Anhedonia', 'Hipertimia', 'Disfonía'], 0, 'Eutimia designa equilibrio del estado de ánimo.', 25),
    q('¿Qué capacidad se relaciona con la anhedonia?', ['Reconocer ciudades', 'Articular palabras', 'Experimentar placer', 'Consolidar recuerdos'], 2, 'La anhedonia se refiere a pérdida de capacidad para experimentar placer.', 27),
    q('¿Qué dificultad describe la alexitimia?', ['Seguir un ritmo de sueño', 'Identificar y comunicar emociones propias', 'Mover una extremidad', 'Leer palabras'], 1, 'Concierne al reconocimiento y expresión de las propias emociones.', 28),
  ]),
  lesson('motricidad', 'afectividad', 'Cantidad y cualidad del movimiento', 'Distingue ritmo, repetición e imitación motora.', [
    c('Cuánto y qué tan rápido', 'Acinesia indica pérdida de movimiento o dificultad para iniciarlo. Hipocinesia implica reducción de movimientos; bradicinesia, lentitud en ejecutarlos. Hipercinesia se refiere al exceso de actividad.', 28, 30),
    c('Imitación y perseveración', 'Ecopraxia reproduce automáticamente movimientos de otra persona. Perseveración motora mantiene o repite una acción incluso cuando ya se solicita otra tarea.', 32, 33),
    c('Movimientos involuntarios', 'El temblor es oscilatorio y rítmico; la distonía implica contracciones sostenidas con posturas o movimientos anómalos; la mioclonía incluye movimientos muy breves y rápidos. Los tics pueden suprimirse por un tiempo breve.', 33, 34, 35),
  ], [
    q('¿Qué distingue hipocinesia de bradicinesia?', ['Memoria frente a atención', 'Menos movimientos frente a movimientos más lentos', 'Visión frente a audición', 'Sueño frente a apetito'], 1, 'Hipocinesia reduce actividad; bradicinesia enlentece su ejecución.', 30),
    q('¿Qué término describe imitar automáticamente movimientos ajenos?', ['Ecopraxia', 'Alexia', 'Micropsia', 'Anhedonia'], 0, 'Ecopraxia es un ecosíntoma motor; ecolalia corresponde al habla.', 33),
    q('¿Qué caracteriza al temblor descrito en el PDF?', ['Una idea repetitiva', 'Ausencia de lectura', 'Movimiento oscilatorio y rítmico', 'Pérdida de familiaridad'], 2, 'Se describe como movimiento no intencional, oscilatorio y rítmico.', 33),
  ]),
  lesson('conducta', 'afectividad', 'Conducta e intención', 'Diferencia escape, compulsiones, abulia y apraxia.', [
    c('Evitación y escape', 'Evitar busca no entrar en contacto con lo temido; escapar supone salir de una situación en la que ya se está. Las compulsiones son conductas o actos mentales repetitivos para reducir malestar ligado a una obsesión o prevenir un mal temido.', 36, 37),
    c('Voluntad y acción', 'Abulia disminuye la voluntad para iniciar o completar conductas dirigidas a un objetivo. Los actos impulsivos se realizan sin deliberar suficientemente sobre las consecuencias.', 39, 40),
    c('Saber qué hacer y poder hacerlo', 'En apraxia hay dificultad para ejecutar una actividad aprendida y coordinada pese a comprenderla, querer realizarla y disponer de capacidad física. No equivale simplemente a falta de voluntad.', 41),
  ], [
    q('¿Qué ejemplo corresponde a escape?', ['No reservar un viaje por miedo', 'Salir de una situación temida en la que ya se está', 'Recordar una ciudad', 'Imitar un gesto'], 1, 'Escape ocurre al encontrarse ya en la situación; evitar busca impedir ese contacto.', 36),
    q('¿Qué función atribuye el PDF a las compulsiones?', ['Aumentar vocabulario', 'Cambiar el tamaño de objetos', 'Reducir malestar ligado a una obsesión o prevenir un mal temido', 'Determinar la hora'], 2, 'Pueden ser conductas observables o actos mentales con esa función.', 37),
    q('¿Qué diferencia apraxia de una simple falta de voluntad?', ['Hay deseo y comprensión, pero falla la ejecución de una acción aprendida', 'Siempre hay pérdida de apetito', 'No hay ninguna dificultad motora', 'Se trata de hablar muy rápido'], 0, 'La descripción conserva comprensión, intención y capacidad física para la tarea.', 41),
  ]),
  lesson('sueno', 'funciones', 'Patrones del sueño', 'Reconoce cuándo se interrumpe el sueño y fenómenos asociados.', [
    c('El momento del insomnio', 'Insomnio inicial dificulta conciliar el sueño; medio o intermitente implica despertares con nuevos periodos de sueño; tardío describe despertar de madrugada sin poder continuar durmiendo.', 42),
    c('Horario y respiración', 'Las alteraciones circadianas afectan la organización del horario sueño-vigilia. El documento distingue además alteraciones respiratorias del sueño, sin equipararlas a cambios de horario.', 43),
    c('Parasomnias', 'Las pesadillas se describen durante sueño REM; los terrores nocturnos durante sueño profundo, con escaso recuerdo posterior. El sonambulismo incluye actividad motora durante sueño de ondas lentas.', 44),
  ], [
    q('¿Qué define el insomnio inicial?', ['Despertar solo de madrugada', 'Dificultad para conciliar el sueño', 'Caminar dormido', 'Cambiar de horario laboral'], 1, 'Inicial se refiere al comienzo del periodo de sueño.', 42),
    q('¿Qué se desorganiza en las alteraciones circadianas descritas?', ['Significado de palabras', 'Identidad personal', 'Horario sueño-vigilia', 'Tamaño visual'], 2, 'El problema descrito es la organización temporal del sueño y la vigilia.', 43),
    q('¿Qué fenómeno incluye caminar durante el sueño de ondas lentas?', ['Sonambulismo', 'Anomia', 'Hipermnesia', 'Prolijidad'], 0, 'El sonambulismo incluye secuencias de movimientos o actividades durante ese sueño.', 44),
  ]),
  lesson('ingesta', 'funciones', 'Apetito e ingesta: conceptos', 'Estudia términos descriptivos, no autodiagnósticos.', [
    c('Apetito e ingesta', 'El apartado considera cantidad de alimento y función de la comida en la vida de la persona. Esta lección selecciona conceptos descriptivos. Anorexia y bulimia se estudian con fuentes de contraste en el bloque Aclaraciones y lectura crítica.', 44),
    c('Rumiación alimentaria', 'Consiste en regurgitar alimento y volver a masticarlo. No debe confundirse con rumiación del pensamiento, que vuelve repetidamente sobre problemas o malestar.', 19, 45),
    c('Pica y contexto', 'El PDF usa pica para ingesta de sustancias no apropiadas como alimento y menciona el contexto cultural. Aquí se estudia el término, sin inferir un diagnóstico por un comportamiento aislado.', 45),
  ], [
    q('¿Qué diferencia la rumiación alimentaria de la del pensamiento?', ['La alimentaria se refiere a regurgitación y remasticación', 'Son exactamente lo mismo', 'Ambas se refieren a la voz', 'Ninguna implica repetición'], 0, 'Comparten una palabra, pero nombran fenómenos distintos.', 19, 45),
    q('¿Con qué se relaciona pica en este apartado?', ['Cambios de horario', 'Ingesta de sustancias no apropiadas como alimento', 'Repetición de gestos ajenos', 'Lentitud de ideas'], 1, 'El apartado vincula pica con esa ingesta y pide tener en cuenta el contexto.', 45),
    q('Además de cantidad ingerida, ¿qué dimensión considera el apartado?', ['Velocidad de escritura', 'Color de objetos', 'Función de la comida en la vida de la persona', 'Pronunciación'], 2, 'El inicio del apartado propone considerar cantidad y función de la comida.', 44),
  ]),
  lesson('relaciones', 'funciones', 'La persona y sus relaciones', 'Organiza autovaloración, vínculos e intereses.', [
    c('Consigo mismo', 'El documento propone explorar cómo se aprecia la persona y qué cualidades reconoce en sí misma. Son preguntas sobre autovaloración, no una prueba con una identidad correcta o incorrecta.', 48),
    c('Con otras personas', 'Se explora cómo se establecen vínculos y cómo se percibe a otras personas. Distingue este eje de la relación consigo mismo.', 48),
    c('Intereses y actividades', 'La relación con las cosas se explora mediante intereses, ideales, motivaciones y tiempo libre. Practicarás a qué dimensión pertenece una pregunta, sin evaluar tus respuestas personales.', 48),
  ], [
    q('Preguntar cómo valora una persona sus propias cualidades explora...', ['Relaciones consigo misma', 'Nivel de conciencia', 'Articulación verbal', 'Modalidad sensorial'], 0, 'La autovaloración corresponde a relaciones consigo mismo.', 48),
    q('¿Qué pregunta explora relaciones con otras personas?', ['¿Qué mes es?', '¿Cómo son tus vínculos con otras personas?', '¿Cuándo concilias el sueño?', '¿Qué intensidad tiene un sonido?'], 1, 'Esta pregunta explora el modo de establecer relaciones.', 48),
    q('¿Qué dimensión exploran intereses y uso del tiempo libre?', ['Velocidad del pensamiento', 'Memoria de fijación', 'Relaciones con las cosas y actividades', 'Orientación espacial'], 2, 'El PDF agrupa intereses, ideales y actividades en relaciones con las cosas.', 48),
  ]),
];
// Se añaden al final para conservar IDs, respuestas e historial de las 17 lecciones originales.
lessons.push(
  lesson('respuesta-sexual', 'sexualidad', 'Fases de la respuesta sexual', 'Reconoce el esquema didáctico del PDF, no una regla universal.', [
    c('Deseo y excitación', 'En el esquema de la página 45, deseo se refiere al interés y las fantasías; excitación, a cambios corporales de respuesta sexual. Son dimensiones distintas. Aquí no se evalúa la explicación vascular del documento.', 45),
    c('Meseta y orgasmo', 'El PDF llama meseta al mantenimiento de la excitación previo al orgasmo. Describe el orgasmo mediante placer intenso y contracciones musculares involuntarias. Estudiamos el vocabulario del esquema, no cómo debe ser una experiencia personal.', 45),
    c('Resolución', 'La resolución corresponde a la relajación posterior y liberación de tensión. El orden presentado en el material es deseo, excitación, meseta, orgasmo y resolución. Una pregunta sobre ese orden no constituye una evaluación clínica.', 45),
  ], [
    q('Según el esquema del PDF, ¿qué fase se refiere al interés y las fantasías sexuales?', ['Resolución', 'Deseo', 'Meseta', 'Orgasmo'], 1, 'Deseo designa el interés; excitación se refiere a cambios de respuesta corporal en este esquema.', 45),
    q('¿Qué nombre recibe el mantenimiento de la excitación previo al orgasmo en el material?', ['Meseta', 'Resolución', 'Anafrodisia', 'Dispareunia'], 0, 'El PDF sitúa la meseta entre excitación y orgasmo.', 45),
    q('¿Qué fase del esquema corresponde a la relajación posterior?', ['Deseo', 'Meseta', 'Excitación', 'Resolución'], 3, 'Resolución es el nombre de la fase de liberación de tensión en el esquema estudiado.', 45),
  ]),
  lesson('deseo-sexual', 'sexualidad', 'Vocabulario del deseo sexual', 'Distingue pérdida, disminución, aumento y aversión.', [
    c('Pérdida y disminución', 'El glosario del PDF utiliza anafrodisia para pérdida del deseo e hiposexualidad o hipoerotismo para disminución marcada. Son definiciones del material, no diagnósticos que puedan aplicarse por una respuesta a este cuestionario.', 46),
    c('Aumento', 'El documento denomina hipersexualidad o hipererotismo al aumento de libido y actividad sexual. Esta ficha no adopta las explicaciones causales ni las etiquetas diferenciadas por sexo que aparecen en ese párrafo.', 46),
    c('Aversión', 'La aversión se describe mediante temor, ansiedad o rechazo ante la posibilidad de actividad sexual. No equivale simplemente a tener menos deseo. Se estudia la descripción, sin inferir una causa o historia personal.', 46),
  ], [
    q('En el glosario del PDF, ¿qué término corresponde a la pérdida del deseo sexual?', ['Hipersexualidad', 'Meseta', 'Anafrodisia', 'Dispareunia'], 2, 'Anafrodisia es la etiqueta del documento para pérdida del deseo.', 46),
    q('¿Qué contraste establece el material entre hiposexualidad e hipersexualidad?', ['Dolor frente a memoria', 'Disminución frente a aumento del deseo', 'Sueño frente a vigilia', 'Identidad frente a orientación espacial'], 1, 'El contraste del glosario es disminución frente a aumento; no basta para diagnosticar.', 46),
    q('¿Qué rasgo caracteriza la descripción de aversión del PDF?', ['Temor o ansiedad ante la posibilidad de actividad sexual', 'Relajación posterior', 'Mayor capacidad de memoria', 'Aumento obligatorio del deseo'], 0, 'El elemento distintivo es la reacción de rechazo, temor o ansiedad, no solamente menor deseo.', 46),
  ]),
  lesson('disfunciones-sexuales', 'sexualidad', 'Excitación, eyaculación y dolor', 'Clasifica descripciones sin aplicar umbrales diagnósticos.', [
    c('Excitación', 'El PDF describe dificultad para obtener o mantener una erección y dificultad para mantener la lubricación como problemas de excitación. Se estudia la dimensión descrita, no se diagnostica a partir de un episodio.', 46),
    c('Eyaculación', 'El material contrapone eyaculación prematura y retardada: una ocurre antes de lo deseado; la otra se retrasa o puede no producirse. Esta lección no usa los tiempos del PDF como criterios diagnósticos.', 47),
    c('Dolor y contracción', 'Dispareunia designa dolor asociado a la actividad sexual. El PDF describe vaginismo mediante contracciones involuntarias y advierte que no debe confundirse con vaginitis. Aquí no se reproduce como regla la exclusión de causas médicas indicada en el texto.', 47),
  ], [
    q('¿A qué dimensión corresponde la dificultad para obtener o mantener una erección en el esquema?', ['Memoria', 'Orientación', 'Excitación sexual', 'Resolución del sueño'], 2, 'El material la ubica en alteraciones de la excitación sexual.', 46),
    q('¿Qué contraste se estudia entre eyaculación prematura y retardada?', ['Ocurrir antes de lo deseado frente a retrasarse', 'Dolor frente a ausencia de memoria', 'Mayor frente a menor vocabulario', 'Vigilia frente a sueño'], 0, 'Se compara el momento de la respuesta, sin convertir cifras aisladas en diagnósticos.', 47),
    q('¿Cuál es la distinción descriptiva que presenta esta lectura?', ['Dispareunia es ausencia de deseo', 'Vaginismo y vaginitis son sinónimos', 'Dispareunia es pérdida de memoria', 'Dispareunia se refiere a dolor; vaginismo, a contracción involuntaria'], 3, 'Se diferencian dolor y contracción involuntaria; no se establece una causa ni un diagnóstico individual.', 47),
  ]),
  lesson('identidad-intereses', 'sexualidad', 'Identidad, intereses y consentimiento', 'Aclaración editorial: distingue diversidad y trastorno.', [
    c('Identidad no es diagnóstico', 'Contraste editorial de p. 45: la APA aclara que ser transgénero no es un diagnóstico. La disforia de género se refiere al malestar clínicamente significativo o deterioro asociado a la incongruencia, no a la identidad por sí sola.', 45),
    c('Interés y trastorno', 'Contraste editorial de pp. 47–48: la APA distingue intereses sexuales atípicos de trastornos parafílicos. Un interés inusual por sí solo no basta: importan el malestar personal, el daño y la implicación de personas que no consienten o no pueden consentir. No es una lista diagnóstica completa.', 47, 48),
    c('Leer sin etiquetar', 'El PDF relaciona fetichismo con objetos o partes del cuerpo, voyeurismo con observar y exhibicionismo con mostrarse. La app no usa la desaprobación social como criterio diagnóstico. Distingue prácticas consensuadas entre adultos de daño o falta de consentimiento.', 47, 48),
  ], [
    q('Según la aclaración de la APA, ¿ser transgénero es por sí mismo un diagnóstico?', ['Sí, siempre', 'Solo según la ropa', 'No', 'Solo según la profesión'], 2, 'Aclaración editorial (APA): identidad y diagnóstico no son equivalentes.', 45),
    q('¿Qué distinción añade la fuente de contraste sobre parafilias?', ['Interés atípico no equivale automáticamente a trastorno', 'Todo interés inusual es un trastorno', 'La desaprobación social basta', 'El consentimiento nunca importa'], 0, 'Aclaración editorial (APA): se distinguen intereses y trastornos, considerando malestar, daño y consentimiento.', 47, 48),
    q('¿Qué asociación de vocabulario aparece en el apartado del PDF?', ['Fetichismo: pérdida de orientación', 'Fetichismo: interés sexual centrado en objetos o partes del cuerpo', 'Fetichismo: interrupción del sueño', 'Fetichismo: dificultad para hablar'], 1, 'Es una asociación terminológica del material, no una conclusión diagnóstica sobre una persona.', 48),
  ]),
  lesson('transiciones-sueno', 'aclaraciones', 'Transiciones del sueño', 'Contrasta la repetición de un término en la página 11.', [
    c('Qué observó la app', 'En p. 11, bajo Imágenes hipnapómpicas e hipnagógicas, el cuerpo del texto repite «hipnagógicas» para salir del sueño y para entrar en él. Señalarlo es una observación editorial nuestra; el PDF no pide consultar a la docente.', 11),
    c('Distinción de contraste', 'Aclaración editorial: la fuente de contraste llama hipnagógicas a las experiencias al quedarse dormido e hipnopómpicas a las del despertar. Lo que distingue estos nombres es el momento de transición.', 11),
    c('Cómo se evalúa', 'Las preguntas de esta lección utilizan la distinción de la fuente externa, no la repetición del párrafo. El fenómeno aislado no es aquí una prueba de enfermedad ni un diagnóstico.', 11),
  ], [
    q('Según la aclaración presentada, ¿cuándo se producen las imágenes hipnagógicas?', ['Al quedarse dormido', 'Solo al comer', 'Solo al caminar', 'Exclusivamente al mediodía'], 0, 'Aclaración editorial: hipnagógicas corresponde a la entrada al sueño.', 11),
    q('Según la fuente de contraste, ¿qué nombre corresponde a las imágenes al despertar?', ['Eidéticas', 'Hipnopómpicas', 'Paramnésicas', 'Prolijas'], 1, 'Aclaración editorial: hipnopómpicas corresponde a la transición del sueño a la vigilia.', 11),
    q('¿Qué motivó la nota editorial sobre la página 11?', ['El PDF ordena detener el curso', 'La docente prohíbe las preguntas', 'El párrafo repite el mismo nombre para dos transiciones', 'No hay ningún apartado sobre imágenes'], 2, 'La repetición es observable en el párrafo. Pedir una revisión fue una decisión editorial, no una instrucción del PDF.', 11),
  ]),
  lesson('lectura-pensamiento', 'aclaraciones', 'Pensamiento: descripción y etiquetas', 'Separa lo que dice el texto de lo que permite concluir.', [
    c('Una palabra, distinto contexto', 'P. 15 utiliza «pensamiento autista» y «autismo» para describir fantasía y alejamiento de la realidad. Contraste editorial: NIMH describe el autismo como una condición del neurodesarrollo. No se deben equiparar esas formulaciones ni deducir autismo por tener fantasías.', 15),
    c('Velocidad y asociación', 'En p. 16 el encabezado agrupa fuga de ideas y descarrilamiento y los explica mediante aceleración. Nuestra pregunta evalúa qué característica describe ese párrafo, no confirma que ambas etiquetas sean intercambiables en toda clasificación.', 16),
    c('Interrupción y explicación', 'En p. 16 se denomina bloqueo o interrupción a la detención súbita del hilo y se añade la etiqueta «robo del pensamiento». Una pausa describe lo observado; por sí sola no demuestra una causa externa. La equivalencia entre etiquetas debe aclararse antes de usarla como regla general.', 16),
  ], [
    q('¿Qué evita confundir la aclaración sobre la página 15?', ['Orientación con calendario', 'Autismo del neurodesarrollo con la descripción de fantasía del párrafo', 'Atención con concentración', 'Lectura con escritura'], 1, 'Contraste NIMH: el autismo es del neurodesarrollo, no una etiqueta que se deduzca de la fantasía descrita.', 15),
    q('¿Qué característica enfatiza el párrafo llamado «Fuga de ideas o descarrilamiento» del PDF?', ['Pérdida del gusto', 'Disminución de audición', 'Aceleración de las ideas', 'Mayor orientación espacial'], 2, 'La respuesta es sobre la descripción de p. 16; no valida una equivalencia universal entre ambos términos.', 16),
    q('Si una viñeta solo describe una detención súbita del discurso, ¿qué dato está presente?', ['Interrupción del hilo expresado', 'Prueba de una causa externa', 'Diagnóstico definitivo', 'Confirmación de autismo'], 0, 'La interrupción está descrita; su causa no queda demostrada por esa observación aislada.', 16),
  ]),
  lesson('mutismo-contexto', 'aclaraciones', 'Mutismo selectivo y contexto', 'Aclaración editorial de la formulación de la página 24.', [
    c('El pasaje del PDF', 'P. 24 presenta mutismo selectivo como negarse a hablar y menciona explicaciones distintas. La nota de revisión la añadió la app: no aparece como petición de la docente.', 24),
    c('Contraste con ASHA', 'ASHA lo sitúa entre los trastornos de ansiedad: existe dificultad persistente para hablar en ciertas situaciones sociales aunque se hable en otras. «Selectivo» no significa escoger deliberadamente no hablar.', 24),
    c('Contexto, no culpabilización', 'El contexto puede cambiar la posibilidad de hablar. Esta distinción no diagnostica un caso: la evaluación considera duración, interferencia, conocimiento del idioma y otras explicaciones. No se concluye desobediencia a partir del silencio.', 24),
  ], [
    q('Según ASHA, ¿con qué grupo se relaciona el mutismo selectivo?', ['Trastornos de ansiedad', 'Alteraciones del tamaño visual', 'Trastornos de orientación', 'Cambios del apetito'], 0, 'Aclaración editorial basada en ASHA: se clasifica como trastorno de ansiedad.', 24),
    q('¿Qué contraste caracteriza la descripción estudiada?', ['Hablar siempre más rápido', 'Nunca haber adquirido habla', 'Hablar en ciertos contextos y no lograr hacerlo en otros', 'Cambiar únicamente el volumen'], 2, 'La variación por contexto es importante; este dato por sí solo no completa un diagnóstico.', 24),
    q('¿Qué inferencia debe evitarse ante el silencio?', ['Que conviene conocer el contexto', 'Que necesariamente es desobediencia voluntaria', 'Que puede relacionarse con ansiedad', 'Que hace falta evaluar otras explicaciones'], 1, 'ASHA advierte que selectivo no significa elegir deliberadamente dónde hablar.', 24),
  ]),
  lesson('apetito-trastornos', 'aclaraciones', 'Apetito y trastornos alimentarios', 'Distingue un síntoma de un cuadro clínico.', [
    c('Por qué se añadió la nota', 'P. 44 comienza definiendo anorexia como pérdida de apetito y después describe restricción para adelgazar. Son niveles distintos: un síntoma no equivale por sí solo a anorexia nerviosa. Esta distinción es una aclaración editorial.', 44),
    c('Contraste con NIMH', 'NIMH describe anorexia nerviosa mediante restricción importante, miedo a ganar peso y alteraciones de la imagen corporal, entre otros rasgos. No se reduce a no tener hambre. La lectura es introductoria, no una lista diagnóstica completa.', 44),
    c('Bulimia y otras ingestas', 'NIMH caracteriza bulimia nerviosa por atracones con pérdida de control y conductas compensatorias: no es simplemente «lo opuesto» de perder el apetito. P. 45 distingue además rumiación alimentaria y pica, ya practicadas en el bloque 6.', 44, 45),
  ], [
    q('¿Por qué no se equipara pérdida de apetito con anorexia nerviosa?', ['Porque son siempre sinónimos', 'Porque el apetito nunca cambia', 'Porque el PDF no habla de comida', 'Porque un síntoma aislado no equivale al cuadro clínico'], 3, 'Aclaración editorial: hay que distinguir el síntoma del conjunto clínico descrito por NIMH.', 44),
    q('Según la fuente de contraste, ¿qué conjunto se asocia a bulimia nerviosa?', ['Solo ausencia de hambre', 'Atracones, pérdida de control y conductas compensatorias', 'Solo preferir un sabor', 'Únicamente cambiar de horario'], 1, 'Contraste NIMH: ese patrón no se explica diciendo que es simplemente lo opuesto de la anorexia.', 44),
    q('¿Qué diferencia rumiación alimentaria y pica en el material?', ['Regurgitar y remasticar frente a ingerir sustancias no alimentarias', 'Dormir frente a despertar', 'Hablar frente a escribir', 'Recordar frente a olvidar'], 0, 'P. 45 describe fenómenos distintos; no son sinónimos de anorexia nerviosa o bulimia nerviosa.', 45),
  ]),
);

export const editorialNotes = [
  { title: 'Por qué hay aclaraciones', pages: [11, 15, 16, 24, 44, 45, 46, 47, 48], reason: 'Son observaciones editoriales de la app: el PDF no pide revisión docente. Los bloques 7 y 8 ya incluyen preguntas. Las fuentes externas se identifican dentro de cada lección.' },
  { title: 'Ejemplo concreto: transición del sueño', pages: [11], reason: 'El párrafo llama «hipnagógicas» tanto a las imágenes al salir como al entrar al sueño. La lección Transiciones del sueño explica la distinción y cita la fuente de contraste.' },
  { title: 'Otros pasajes que contrastamos', pages: [15, 16, 24, 44, 45, 47, 48], reason: 'P. 15: uso de «autismo»; p. 16: equivalencias entre términos del pensamiento; p. 24: mutismo selectivo; p. 44: apetito y trastornos; pp. 45, 47–48: identidad e intereses sexuales. No afirmamos que la docente haya aprobado las adaptaciones.' },
];
export function getLesson(lessonId: string) { return lessons.find((item) => item.id === lessonId); }
export function countCompletedLessons(ids: string[]) { return lessons.filter((item) => ids.includes(item.id)).length; }
export function isLessonUnlocked(id: string, completedIds: string[]) {
  const index = lessons.findIndex((item) => item.id === id);
  return index >= 0 && (index === 0 || completedIds.includes(lessons[index - 1].id));
}
export function formatPages(pages: number[]) {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const groups: string[] = [];
  for (let index = 0; index < sorted.length; index++) {
    const start = sorted[index];
    let end = start;
    while (sorted[index + 1] === end + 1) end = sorted[++index];
    groups.push(start === end ? `${start}` : `${start}–${end}`);
  }
  return `PDF · ${sorted.length === 1 ? 'p.' : 'pp.'} ${groups.join(', ')}`;
}
