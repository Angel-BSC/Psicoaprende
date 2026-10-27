import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessons, modules, courseSource, formatPages, getLesson, countCompletedLessons, isLessonUnlocked } from '../../src/data/learning.ts';

test('catálogo introductorio: ocho bloques, 25 lecciones y 75 preguntas con IDs únicos', () => {
  assert.equal(modules.length, 8);
  assert.equal(lessons.length, 25);
  assert.equal(lessons.flatMap((l) => l.questions).length, 75);
  const ids = [...lessons.map((l) => l.id), ...lessons.flatMap((l) => l.questions.map((q) => q.id))];
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith(courseSource.id)));
  for (const module of modules) assert.ok(lessons.some((l) => l.moduleId === module.id));
});

test('los nuevos bloques se añaden sin desplazar la ruta original y declaran fuentes externas', () => {
  const originalSlugs = ['nivel-conciencia', 'cualidad-conciencia', 'orientacion', 'atencion', 'memoria', 'sensaciones', 'ilusiones-alucinaciones', 'experiencia-yo', 'curso-pensamiento', 'contenido-pensamiento', 'lenguaje', 'afectividad', 'motricidad', 'conducta', 'sueno', 'ingesta', 'relaciones'];
  assert.deepEqual(lessons.slice(0, 17).map((l) => l.id), originalSlugs.map((id) => `${courseSource.id}-${id}`));
  assert.equal(lessons.filter((l) => l.moduleId === 'sexualidad').length, 4);
  assert.equal(lessons.filter((l) => l.moduleId === 'aclaraciones').length, 4);
  for (const slug of ['identidad-intereses', 'transiciones-sueno', 'lectura-pensamiento', 'mutismo-contexto', 'apetito-trastornos']) {
    const lesson = getLesson(`${courseSource.id}-${slug}`);
    assert.ok(lesson.references.length);
    for (const reference of lesson.references) {
      assert.equal(new URL(reference.url).protocol, 'https:');
      assert.ok(reference.title.trim());
    }
  }
});

test('cada concepto y pregunta tiene referencias y una respuesta válida', () => {
  for (const lesson of lessons) {
    assert.equal(getLesson(lesson.id), lesson);
    assert.ok(modules.some((m) => m.id === lesson.moduleId));
    assert.equal(lesson.concepts.length, 3);
    assert.equal(lesson.questions.length, 3);
    assert.ok(Number.isInteger(lesson.xp) && lesson.xp > 0);
    for (const item of [lesson, ...lesson.concepts, ...lesson.questions]) {
      assert.ok(item.pages.length > 0);
      assert.ok(item.pages.every((page) => Number.isInteger(page) && page > 0 && page <= courseSource.pageCount));
      assert.ok(item.pages.every((page) => lesson.pages.includes(page)));
    }
    for (const question of lesson.questions) {
      assert.equal(new Set(question.options).size, question.options.length);
      assert.equal(question.options.length, 4);
      assert.ok(Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < question.options.length);
      assert.ok(question.prompt.trim() && question.explanation.trim());
    }
  }
});

test('desbloqueo secuencial y contadores excluyen el temario antiguo', () => {
  assert.equal(countCompletedLessons(['bases-psicologia', 'emociones']), 0);
  assert.equal(countCompletedLessons([lessons[0].id, lessons[0].id]), 1);
  assert.equal(isLessonUnlocked('inexistente', []), false);
  const completed = [];
  for (let i = 0; i < lessons.length; i++) {
    assert.equal(isLessonUnlocked(lessons[i].id, completed), true);
    if (i + 1 < lessons.length) assert.equal(isLessonUnlocked(lessons[i + 1].id, completed), false);
    completed.push(lessons[i].id);
  }
  assert.equal(countCompletedLessons(completed), lessons.length);
});

test('referencias agrupan solo páginas contiguas sin inventar cobertura', () => {
  assert.equal(formatPages([4]), 'PDF · p. 4');
  assert.equal(formatPages([3, 1, 2, 2]), 'PDF · pp. 1–3');
  assert.equal(formatPages([45, 19, 44]), 'PDF · pp. 19, 44–45');
});

test('orientación plantea tres viñetas clínicas conservando objetivos y corrección histórica', () => {
  const lesson = getLesson(`${courseSource.id}-orientacion`);
  assert.equal(lesson.title, 'Psicopatología de la orientación');
  assert.equal(lesson.moduleId, 'conciencia');
  assert.deepEqual(lesson.questions.map((q) => q.correctIndex), [0, 1, 2]);
  assert.deepEqual(lesson.questions.map((q) => q.options), [
    ['Temporal', 'Espacial', 'Motora', 'Afectiva'],
    ['Memoria semántica', 'Orientación espacial', 'Intensidad sensorial', 'Fluidez verbal'],
    ['La hora', 'El país', 'La propia identidad', 'La temperatura'],
  ]);
  for (const [i, question] of lesson.questions.entries()) {
    assert.equal(question.id, `${lesson.id}-q${i + 1}`);
    assert.deepEqual(question.pages, [4]);
    assert.match(question.prompt, /clínica/);
    assert.match(question.prompt, /paciente/);
    assert.ok(question.prompt.length > 180);
  }
});
