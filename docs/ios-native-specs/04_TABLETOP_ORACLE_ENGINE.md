# 04 // TABLETOP ORACLE ENGINE SPECIFICATION
## Kabbalistic Cosmology, 78-Node Tarot Architecture & Elemental Dignities

---

## 1. Kabbalistic Tree of Life Database Schema

The structural schema of Vesper Grimoire maps the entire 78-card Tarot directly onto the **Kabbalistic Tree of Life**:

```
                 (1) KETHER [Aces / Primal Vector]
                   /     \
    (3) BINAH [3s] ------- (2) CHOKMAH [2s / Kinetic Spark]
           |      \       /      |
           |        \   /        |
    (5) GEBURAH [5s] (6) TIPHARETH [6s / Equilibrium]
           |        /   \        |
           |      /       \      |
    (8) HOD [8s]   ------- (7) NETZACH [7s / Instinct]
                   \     /
                 (9) YESOD [9s / Astral Subsurface]
                        |
                 (10) MALKUTH [10s / Material Resolution]
```

### The 10 Sephirot & Minor Arcana Pips
| Sephirah Node | Translation | Minor Arcana Assignment | Tactical Systems Translation |
| :--- | :--- | :--- | :--- |
| **1. Kether** | The Crown | The Aces | Primal energy; mission initialization spark. |
| **2. Chokmah**| Wisdom | The Twos | Dynamic vector force; initial willpower projection. |
| **3. Binah** | Understanding | The Threes | Structural boundaries; defensive perimeters. |
| **4. Chesed** | Mercy | The Fours | Resource consolidation; stabilizing assets. |
| **5. Geburah**| Severity | The Fives | Kinetic conflict; stress testing and disruption. |
| **6. Tiphareth**| Beauty / Core | The Sixes | Operational equilibrium; core psychological balance. |
| **7. Netzach**| Victory | The Sevens | Instinctual drive; overcoming operational friction. |
| **8. Hod** | Splendor | The Eights | Analytical processing; logic routing and communication. |
| **9. Yesod** | Foundation | The Nines | Subsurface architecture; hidden unconscious variables. |
| **10. Malkuth**| Kingdom | The Tens | Material resolution; grounding abstract code into reality. |

### The Four Worlds & Elemental Suits
- **Atziluth (Fire / Wands):** Governs active kinetic force, ambition, and project advancement.
- **Beri'ah (Water / Cups):** Governs relational intelligence, intuition, and shadow feeling.
- **Yetzirah (Air / Swords):** Governs systemic logic, analytical conflict, and communication.
- **Assiah (Earth / Pentacles):** Governs physical hardware, financial assets, and material stability.

---

## 2. The Elemental Dignities Calculus Engine

Cards are never interpreted in isolation; their influence depends on the elemental compositions of flanking cards in the spread triad.

### Polarity & Pairing Matrix
- **Active Elements (Outward / Kinetic):** Fire (Wands) & Air (Swords)
- **Passive Elements (Inward / Receptive):** Water (Cups) & Earth (Pentacles)

| Flanking Element | Target Element | Dignity Classification | Synthesized Algorithmic Output | Qualitative Effect |
| :--- | :--- | :--- | :--- | :--- |
| **Fire** | **Fire** | Amplified / Strong | `Multiplier (+2.0)` | Kinetic passion exponentially reinforced. |
| **Fire** | **Air** | Friendly / Supportive | `Additive (+1.5)` | Air acts as oxygen fueling the Fire; rapid ideation. |
| **Water** | **Earth** | Friendly / Supportive | `Additive (+1.5)` | Earth provides a stable vessel containing Water. |
| **Fire** | **Earth** | Neutral / Grounded | `Baseline (+0.5)` | Earth absorbs heat without altering Fire's primary vector. |
| **Air** | **Water** | Neutral / Therapeutic | `Baseline (+0.5)` | Friction creating mild behavioral adjustments. |
| **Fire** | **Water** | **Contrary / Ill-Dignified** | `Subtractive (-1.5)` | Fire is quenched by Water; active advancing plans neutralized. |
| **Air** | **Earth** | **Contrary / Ill-Dignified** | `Subtractive (-1.5)` | Rapid abstract thought smothered by heavy practical limits. |

### Algorithmic Triad Calculus (`ElementalDignityEngine.swift`)
```swift
public struct DignityResult {
    public let targetCard: String
    public let score: Double // -2.0 to +2.0
    public let status: DignityStatus
    public let description: String
}

public enum DignityStatus: String {
    case amplified = "AMPLIFIED"
    case supportive = "SUPPORTIVE"
    case neutral = "NEUTRAL"
    case illDignified = "ILL-DIGNIFIED"
    case rescued = "RESCUED"
}

public struct ElementalDignityEngine {
    public static func evaluateTriad(left: TarotCard, target: TarotCard, right: TarotCard) -> DignityResult {
        let leftRelation = pairScore(c1: target.element, c2: left.element)
        let rightRelation = pairScore(c1: target.element, c2: right.element)
        
        // Scenario 1: Flanking cards are contrary to each other
        if pairScore(c1: left.element, c2: right.element) < 0 {
            return DignityResult(
                targetCard: target.name,
                score: 0.0,
                status: .neutral,
                description: "Flanking elements [\(left.element)] and [\(right.element)] neutralize each other in localized conflict. Target operates in pure isolation."
            )
        }
        
        // Scenario 2: Both contrary to target -> Neutralized
        if leftRelation < 0 && rightRelation < 0 {
            return DignityResult(
                targetCard: target.name,
                score: -1.8,
                status: .illDignified,
                description: "Target [\(target.name)] is smothered by contrary flanking elements. Energy heavily neutralized."
            )
        }
        
        // Scenario 3: One contrary, one supportive -> Rescue Protocol
        if (leftRelation < 0 && rightRelation > 0) || (leftRelation > 0 && rightRelation < 0) {
            return DignityResult(
                targetCard: target.name,
                score: 0.5,
                status: .rescued,
                description: "Rescue Protocol Active: Supportive flanking element oxygenates and preserves the target's primary vector."
            )
        }
        
        let totalScore = leftRelation + rightRelation
        return DignityResult(
            targetCard: target.name,
            score: totalScore,
            status: totalScore > 0 ? .supportive : .neutral,
            description: "Harmonious elemental alignment. Synergistic reinforcement."
        )
    }
    
    private static func pairScore(c1: String, c2: String) -> Double {
        if c1 == c2 { return 1.5 }
        if (c1 == "FIRE" && c2 == "AIR") || (c1 == "AIR" && c2 == "FIRE") { return 1.0 }
        if (c1 == "WATER" && c2 == "EARTH") || (c1 == "EARTH" && c2 == "WATER") { return 1.0 }
        if (c1 == "FIRE" && c2 == "WATER") || (c1 == "WATER" && c2 == "FIRE") { return -1.5 }
        if (c1 == "AIR" && c2 == "EARTH") || (c1 == "EARTH" && c2 == "AIR") { return -1.5 }
        return 0.2
    }
}
```

---

## 3. ASCII Tarot Card Rendering Format

All 78 tarot cards are rendered using fixed 32-character width ASCII frames:

```
+==============================+
|        KING OF SWORDS        |
|          Elem: AIR           |
|                              |
|             /\               |
|            //\\              |
|           //  \\             |
|           ||  ||             |
|           ||  ||             |
|           ||  ||             |
|          [======]            |
|                              |
+==============================+
|  Supreme Analysis; absolute  |
|  authority, systematic       |
|  rule, and clear             |
|  communication.              |
+==============================+
```

### ASCII Frame Construction Rules
1. Outer width: exactly 32 characters (`+` followed by 30 `=` followed by `+`).
2. Card Name centered on line 2.
3. Element centered on line 3 (`Elem: FIRE`, `Elem: WATER`, `Elem: AIR`, `Elem: EARTH`).
4. Central art lines padded to fit within the `|` borders.
5. Jungian psychological directive auto-wrapped into 26-character line lengths and padded symmetrically.
