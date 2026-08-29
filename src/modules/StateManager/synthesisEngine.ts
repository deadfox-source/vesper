import { TAROT_DECK_MAP } from '../../constants/tarotDictionary';
import type { ElementType } from '../../constants/tarotDictionary';
import { SPREAD_LIBRARY } from './spreadLibrary';
import type { TelemetryState } from '../utils/useRealTelemetry';

export interface ElementalScore {
  FIRE: number;
  WATER: number;
  EARTH: number;
  AIR: number;
}

export interface SynthesisReport {
  timestamp: string;
  spreadName: string;
  elements: ElementalScore;
  dominantElement: ElementType;
  gridSummary: string;
  tacticalDirectives: string[];
  triadAnalysis: string;
  stressors: {
    kIndex: number;
    airDensity: number;
    frictionApplied: boolean;
  };
}

// Polarity classification for Elemental Dignity calculations




/**
 * Generates the full GRID synthesis report with Elemental Dignity,
 * Triad Calculus, and Environmental Telemetry overlays.
 */
export const generateOracleSynthesis = (
  nodes: Record<number, string>,
  spreadId: string,
  readingContext?: { isSelf: boolean; subjectName: string; query?: string; env?: TelemetryState }
): SynthesisReport => {
  const currentSpread = SPREAD_LIBRARY[spreadId];
  const cardNames = Object.values(nodes);

  // Tactical Math Overlays
  // Hamilton K-index 5 Stressor: Minor Storm detected
  const kIndex = 5;
  
  // 1. Calculate Elemental Balance
  const scores: ElementalScore = { FIRE: 0, WATER: 0, EARTH: 0, AIR: 0 };
  cardNames.forEach(name => {
    const card = name ? TAROT_DECK_MAP.get(name.toUpperCase()) : undefined;
    if (card && card.element !== 'SPIRIT') {
      scores[card.element as keyof ElementalScore]++;
    }
  });

  let dominant = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0] as ElementType;

  // 2. Generate Analysis Summary
  const subjectLabel = 'OPERATOR';
  let summary = `[ READING ANALYSIS: ${currentSpread.name} ]\n`;
  summary += `[ SUBJECT: ${subjectLabel} | TYPE: SELF INQUIRY ]\n`;
  if (readingContext?.query) {
     summary += `[ OPERATOR INTENTION: "${readingContext.query.toUpperCase()}" ]\n`;
  }
  summary += `\n`;

  // 3. Environmental Telemetry Overlay
  let envOverlay = '';
  const env = readingContext?.env;
  if (env) {
    envOverlay += `[ TELEMETRY OVERLAY: ACTIVE ]\n`;
    
    const kIndexVal = env.spaceWeather.kpIndex || 0;
    const isRealStorm = kIndexVal >= 5;

    if (isRealStorm) {
      envOverlay += `[WARNING] HAMILTON_K_INDEX: ${kIndexVal} (GEOMAGNETIC_STORM). Systemic friction applied to all ACTIVE vectors.\n`;
      scores.FIRE = Math.max(0, scores.FIRE - 1.5);
      scores.AIR = Math.max(0, scores.AIR - 1.0);
    }

    if (env.weather.status === 'ONLINE' && env.weather.code !== null) {
      // Rough mapping of WMO weather codes: 50+ is rain/snow
      if (env.weather.code >= 50) {
        scores.WATER += 1;
        envOverlay += `[NOTICE] Atmospheric precipitation detected (Code ${env.weather.code}). Emotional/WATER variables boosted.\n`;
      } else if (env.weather.code <= 3) {
        scores.FIRE += 0.5;
        envOverlay += `[NOTICE] Clear atmospheric conditions detected. FIRE variables boosted.\n`;
      }
      envOverlay += `> METEO: ${env.weather.temp}°C, WMO Code: ${env.weather.code}\n`;
    }

    if (env.battery.supported && env.battery.level !== null) {
      if (env.battery.level < 0.2 && !env.battery.charging) {
         scores.EARTH = Math.max(0, scores.EARTH - 0.5);
         envOverlay += `[WARNING] Operator power levels critical (< 20%). Structural/EARTH variables degraded.\n`;
      }
      envOverlay += `> POWER: ${Math.round(env.battery.level * 100)}% [${env.battery.charging ? 'AC' : 'DC'}]\n`;
    }

    if (env.location && env.location.status === 'ONLINE' && env.location.lat !== null) {
      envOverlay += `> COORD: ${env.location.lat.toFixed(4)}, ${env.location.lon?.toFixed(4)}\n`;
    }

    envOverlay += `> SPACE_WEATHER (Kp-Index): ${env.spaceWeather.status === 'ONLINE' ? kIndexVal.toFixed(2) : env.spaceWeather.status}\n\n`;

    dominant = (Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0] as ElementType);
  }



  // 4. Triad Calculus (Advanced Elemental Dignity) - Deprecated/Removed
  const triadAnalysis = '';

  // 5. Directives based on Dominance - Deprecated/Removed
  const directives: string[] = [];

  return {
    timestamp: new Date().toISOString(),
    spreadName: currentSpread.name,
    elements: scores,
    dominantElement: dominant,
    gridSummary: summary,
    tacticalDirectives: directives,
    triadAnalysis,
    stressors: {
      kIndex: readingContext?.env?.spaceWeather.kpIndex || kIndex,
      airDensity: 1, // Deprecated
      frictionApplied: (readingContext?.env?.spaceWeather.kpIndex || 0) >= 5
    }
  };
};

const getInterplayInsight = (elements: string[]): string => {
  const counts = elements.reduce((acc, el) => ({ ...acc, [el]: (acc[el] || 0) + 1 }), {} as Record<string, number>);
  
  // Conflict Detection
  if (counts['FIRE'] && counts['WATER']) return "SIGNAL_VOLATILITY: [ FIRE + WATER ] DETECTED. HIGH TURBULENCE IN THE ARCANE FIELD.";
  if (counts['AIR'] && counts['EARTH']) return "DENSITY_CONFLICT: [ AIR + EARTH ] DETECTED. SIGNAL ATTENUATION IS INCREASING.";
  
  // Harmony/Amplification
  if ((counts['FIRE'] || 0) >= 2) return "RESONANCE_AMPLIFICATION: FIRE DOMINANCE DETECTED. KINETIC POTENTIAL IS CRITICAL.";
  if ((counts['WATER'] || 0) >= 2) return "SYMPATHETIC_HARMONY: WATER DOMINANCE DETECTED. INTUITIVE CLARITY IS PEAKING.";
  if ((counts['AIR'] || 0) >= 2) return "LOGICAL_ASCENDANCE: AIR DOMINANCE DETECTED. DATA THROUGHPUT IS OPTIMIZED.";
  if ((counts['EARTH'] || 0) >= 2) return "STRUCTURAL_STABILITY: EARTH DOMINANCE DETECTED. FOUNDATIONAL INTEGRITY SECURED.";

  return "SIGNAL_STEADY: NO CONFLICTING FREQUENCIES DETECTED.";
};

export const generateQuickSynthesis = (
  nodes: Record<number, string>
): string => {
  const cardNames = Object.values(nodes);
  if (cardNames.length === 0) return "> AWAITING_NODE_SYNCHRONIZATION...";
  
  // Get last 3 cards based on highest node IDs
  const last3Entries = Object.entries(nodes)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .slice(0, 3);
    
  const last3Names = last3Entries.map(([, name]) => name.toUpperCase());
  const cardDefs = last3Names.map(name => TAROT_DECK_MAP.get(name));
  const elements = cardDefs.map(c => c?.element || 'VOID');
  
  const interplay = getInterplayInsight(elements);
  
  let report = `[ LATEST_SYNC: ${last3Names.join(' + ')} ]\n`;
  report += `> ARCANE_SIGNATURE: ${elements.join(' / ')}\n`;
  report += `> INTERPLAY: ${interplay}\n\n`;
  report += `> STATUS: INCREMENTAL_DATA_MAPPED.`;

  return report;
};
