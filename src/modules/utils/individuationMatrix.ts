// src/modules/utils/individuationMatrix.ts

import { TAROT_DECK_MAP } from '../../constants/tarotDictionary';

export interface IndividuationMatrix {
  persona: number;
  shadow: number;
  anima: number;
  self: number;
}

export interface JournalEntryLike {
  drawnCardName: string;
}

export const calculateIndividuationMatrix = (entries: JournalEntryLike[]): IndividuationMatrix => {
  let persona = 0; // FIRE
  let shadow = 0;  // WATER
  let anima = 0;   // AIR
  let self = 0;    // EARTH

  entries.forEach(entry => {
    const card = TAROT_DECK_MAP.get(entry.drawnCardName.toUpperCase());
    if (card) {
      if (card.element === 'FIRE') persona++;
      if (card.element === 'WATER') shadow++;
      if (card.element === 'AIR') anima++;
      if (card.element === 'EARTH' || card.element === 'SPIRIT') self++;
    }
  });

  const total = persona + shadow + anima + self;
  if (total === 0) return { persona: 0, shadow: 0, anima: 0, self: 0 };

  return {
    persona: Math.round((persona / total) * 100),
    shadow: Math.round((shadow / total) * 100),
    anima: Math.round((anima / total) * 100),
    self: Math.round((self / total) * 100),
  };
};
