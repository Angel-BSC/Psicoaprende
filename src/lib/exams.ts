export type ExamQuestion = {
  id: string; prompt: string; options: string[]; moduleId: string; lessonTitle: string;
  correctIndex?: number; explanation?: string; pages?: number[];
  references?: { title: string; url: `https://${string}` }[];
};
export type ExamSummary = {
  id: string; questionCount: number; durationMinutes: number; startedAt: string; expiresAt: string;
  finishedAt: string | null; finishReason: 'submitted' | 'expired' | null; score: number | null;
  revision: number; serverTime: string; moduleIds: string[];
};
export type ExamAttempt = ExamSummary & { questions: ExamQuestion[]; answers: Record<string, number> };
export type ExamCatalog = {
  modules: { id: string; title: string }[];
  questions: Pick<ExamQuestion, 'id' | 'prompt' | 'moduleId' | 'lessonTitle'>[];
};
export const formatExamTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
