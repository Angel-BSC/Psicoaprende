import { randomInt } from 'node:crypto';
import { capsuleOdds } from '../src/lib/claw-contract.ts';

// Exhaustive integer buckets avoid floating-point boundary ambiguity.
export function rarityForRoll(roll) {
  if (!Number.isInteger(roll) || roll < 0 || roll >= 100) throw new RangeError('Invalid rarity roll');
  let boundary = 0;
  for (const [rarity, probability] of Object.entries(capsuleOdds)) {
    boundary += probability;
    if (roll < boundary) return rarity;
  }
  throw new Error('Invalid rarity probabilities');
}
export const drawCapsuleRarity = () => rarityForRoll(randomInt(100));
