export type CapsuleRarity = 'especial' | 'epica' | 'legendaria';
export const capsuleRarities = {
  especial: { label: 'Especial', color: 0, xp: 30, coins: 10, description: 'Aplicación clínica' },
  epica: { label: 'Épica', color: 1, xp: 60, coins: 25, description: 'Discriminación de conceptos' },
  legendaria: { label: 'Legendaria', color: 2, xp: 100, coins: 50, description: 'Integración clínica avanzada' },
} as const;
export const capsuleOdds = { especial: 70, epica: 25, legendaria: 5 } as const;
// Unopened capsules have no rarity; the server draws it only on first opening.
export type ChallengeCapsule = { id: string; x: number; y: number; color: 0 };
export type ClawAttempt = {
  id: string; capsuleId: string; rarity: CapsuleRarity; question: {
    id: string; topic: string; title: string; stem: string; options: string[];
  }; rewardAvailable: boolean; potentialXp: number; potentialCoins: number;
  result: null | { answer: number; correct: boolean; correctIndex: number; explanation: string; optionExplanations: string[];
    pdfPages: number[]; sources: { label: string; url: string }[]; editorialNote: string; earnedXp: number; earnedCoins: number };
};
export type ClawStatus = { capsules: ChallengeCapsule[]; activeAttempt: ClawAttempt | null; wallet: { coins: number; xp: number } };
