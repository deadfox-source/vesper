export interface SpreadNodeDef {
  id: number;
  name: string;
  x: number; // Normalized coordinate (0 to 1)
  y: number; // Normalized coordinate (0 to 1)
  title: string;
  description: string;
}

export interface SpreadConfig {
  id: string;
  name: string;
  nodes: SpreadNodeDef[];
}

export const SPREAD_LIBRARY: Record<string, SpreadConfig> = {
  GRID_MACRO_SYSTEM: {
    id: "GRID_MACRO_SYSTEM",
    name: "FULL SYSTEM SCAN",
    nodes: [
      { id: 1, name: 'Kether', x: 0.5, y: 0.1, title: "Intention / Aspiration", description: "The ultimate operational objective or the pure, initial spark of the inquiry." },
      { id: 2, name: 'Chokhmah', x: 0.25, y: 0.25, title: "Wisdom / Initiative", description: "The active potential and raw kinetic energy available to execute the mission." },
      { id: 3, name: 'Binah', x: 0.75, y: 0.25, title: "Understanding / Limitations", description: "The systemic boundaries, defense perimeters, or restrictions placed upon the user." },
      { id: 4, name: 'Chesed', x: 0.25, y: 0.45, title: "Mercy / Resources", description: "The constructive influences, available resources, and benevolent assets driving operational growth." },
      { id: 5, name: 'Gevurah', x: 0.75, y: 0.45, title: "Severity / Friction", description: "Destructive influences, harshness, or kinetic conflict expected during the operation." },
      { id: 6, name: 'Tiferet', x: 0.5, y: 0.55, title: "Beauty / Core Vector", description: "The true 'Self', the heart of the matter, where the objective and human aspiration intersect." },
      { id: 7, name: 'Netzach', x: 0.25, y: 0.7, title: "Victory / Emotional Drive", description: "The instinctual state, passion, and psychological resilience required for endurance." },
      { id: 8, name: 'Hod', x: 0.75, y: 0.7, title: "Splendor / Analytics", description: "The logical strategy, communication hurdles, and intellectual data routing necessary." },
      { id: 9, name: 'Yesod', x: 0.5, y: 0.8, title: "Foundation / Subsurface", description: "Hidden psychological variables, dreams, and the unknown astral aspect." },
      { id: 10, name: 'Malkuth', x: 0.5, y: 0.95, title: "Kingdom / Resolution", description: "The final manifestation, tangible form, and probable outcome of the operation." },
    ]
  },
  GRID_INFILTRATION: {
    id: "GRID_INFILTRATION",
    name: "QUICK INQUIRY",
    nodes: [
      { id: 1, name: 'Current Vector', x: 0.25, y: 0.2, title: "Current Vector", description: "The specific mindset or energetic approach required to approach the current situation." },
      { id: 2, name: 'Core Restraint', x: 0.75, y: 0.5, title: "System Restraint", description: "The primary adversarial force, whether an external obstacle or a deeply repressed Shadow element." },
      { id: 3, name: 'Action on Objective', x: 0.25, y: 0.8, title: "Action on Objective", description: "The definitive execution required to neutralize the psychological threat." }
    ]
  },
  GRID_EXFILTRATION: {
    id: "GRID_EXFILTRATION",
    name: "CHALLENGE RESOLUTION",
    nodes: [
      { id: 1, name: 'Threat Assessment', x: 0.3, y: 0.15, title: "Current Obstacle", description: "The immediate, tangible danger to psychological or systemic stability." },
      { id: 2, name: 'Hidden Variables', x: 0.7, y: 0.35, title: "Hidden Variables", description: "Hidden strengths, suppressed Shadow capabilities, or overlooked resources to leverage." },
      { id: 3, name: 'Route Clearance', x: 0.3, y: 0.55, title: "Route Clearance", description: "The precise, practical action required to secure a path forward." },
      { id: 4, name: 'External Support', x: 0.7, y: 0.75, title: "System Support", description: "External factors, systemic advantages, or aligned telemetry providing assistance." },
      { id: 5, name: 'Resolution', x: 0.3, y: 0.95, title: "Resolution Point", description: "The final, secure psychological state or physical resolution." }
    ]
  }
};
