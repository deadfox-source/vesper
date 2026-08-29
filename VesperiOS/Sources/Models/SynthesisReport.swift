// Sources/Models/SynthesisReport.swift
import Foundation

public struct ElementalScore: Codable, Sendable {
    public var fire: Double
    public var water: Double
    public var earth: Double
    public var air: Double
    
    public init(fire: Double = 0, water: Double = 0, earth: Double = 0, air: Double = 0) {
        self.fire = fire
        self.water = water
        self.earth = earth
        self.air = air
    }
}

public struct SynthesisReport: Identifiable, Codable, Sendable {
    public var id: String = UUID().uuidString
    public let timestamp: String
    public let spreadName: String
    public let elements: ElementalScore
    public let dominantElement: ElementType
    public let gridSummary: String
    public let tacticalDirectives: [String]
    public let triadAnalysis: String
    public let isStormFrictionApplied: Bool
    public let spokenConcise: String?
    public let inquiryTheme: String?
    public let finalOutcome: String?
}

public struct SynthesisEngine {
    public static func generateLocalSynthesis(
        nodes: [Int: String],
        spreadId: String,
        query: String?,
        weather: WeatherData?,
        spaceWeather: SpaceWeatherData?,
        batteryLevel: Float?
    ) -> SynthesisReport {
        let spread = SpreadLibrary.map[spreadId] ?? SpreadLibrary.macroSystem
        var scores = ElementalScore()
        
        // 1. Calculate raw elemental occurrences
        for (_, cardName) in nodes {
            if let card = TarotDeck.getCard(named: cardName), card.element != .spirit {
                switch card.element {
                case .fire: scores.fire += 1
                case .water: scores.water += 1
                case .earth: scores.earth += 1
                case .air: scores.air += 1
                case .spirit: break
                }
            }
        }
        
        // 2. Environmental Telemetry Overlays
        var envSummary = ""
        var isStorm = false
        
        if let sw = spaceWeather, sw.kpIndex >= 5.0 {
            isStorm = true
            envSummary += "[WARNING] HAMILTON K-INDEX \(String(format: "%.1f", sw.kpIndex)) (GEOMAGNETIC STORM). Active vectors degraded.\n"
            scores.fire = max(0, scores.fire - 1.5)
            scores.air = max(0, scores.air - 1.0)
        }
        
        if let w = weather {
            if w.weatherCode >= 50 {
                scores.water += 1.0
                envSummary += "[NOTICE] Precipitation detected (WMO \(w.weatherCode)). Emotional/WATER parameters amplified.\n"
            } else if w.weatherCode <= 3 {
                scores.fire += 0.5
                envSummary += "[NOTICE] Clear sky radiation detected. FIRE parameters amplified.\n"
            }
        }
        
        if let bat = batteryLevel, bat < 0.20 {
            scores.earth = max(0, scores.earth - 0.5)
            envSummary += "[WARNING] Operator device power critical (< 20%). Structural/EARTH stability compromised.\n"
        }
        
        // 3. Determine Dominant Element
        let elementsList: [(ElementType, Double)] = [
            (.fire, scores.fire),
            (.water, scores.water),
            (.earth, scores.earth),
            (.air, scores.air)
        ]
        let dominant = elementsList.max(by: { $0.1 < $1.1 })?.0 ?? .fire
        
        // 4. Triad Calculus & Qualitative Analysis
        var triadCalculus = ""
        let sortedKeys = nodes.keys.sorted()
        if sortedKeys.count >= 3 {
            let firstCard = TarotDeck.getCard(named: nodes[sortedKeys[0]] ?? "")
            let midCard = TarotDeck.getCard(named: nodes[sortedKeys[1]] ?? "")
            let lastCard = TarotDeck.getCard(named: nodes[sortedKeys[2]] ?? "")
            
            if let f = firstCard, let m = midCard, let l = lastCard {
                if f.element.isMasculineActive && l.element.isMasculineActive && m.element.isFemininePassive {
                    triadCalculus = "TRIAD RESCUE: Flanking active elements (\(f.element.rawValue)/\(l.element.rawValue)) encapsulate passive \(m.element.rawValue) core."
                } else if (f.element == .fire && l.element == .water) || (f.element == .water && l.element == .fire) {
                    triadCalculus = "POLAR CONFLICT: Direct Fire-Water neutralization detected across lateral wings."
                } else {
                    triadCalculus = "EQUILIBRIUM: Synergistic elemental dignities maintaining systemic balance."
                }
            }
        } else {
            triadCalculus = "ISOLATED VECTOR: Insufficient node density for triad calculus."
        }
        
        // 5. Generate Tactical Directives
        var directives: [String] = []
        switch dominant {
        case .fire:
            directives.append("INITIATIVE: Channel raw kinetic momentum into immediate objective execution.")
            directives.append("HAZARD: Guard against impulsive over-extension and burnout.")
        case .water:
            directives.append("RECONNAISSANCE: Prioritize intuitive scans and relational de-escalation.")
            directives.append("HAZARD: Avoid stagnation in unresolved affective loops.")
        case .air:
            directives.append("ANALYSIS: Apply piercing logical differentiation to sever false assumptions.")
            directives.append("HAZARD: Beware of intellectual paralysis and defensive rationalization.")
        case .earth:
            directives.append("CONSOLIDATION: Anchor tangible assets and fortify physical operational perimeters.")
            directives.append("HAZARD: Prevent structural rigidity from blocking necessary systemic adaptation.")
        case .spirit:
            directives.append("SYNTHESIS: Total conscious integration achieved.")
        }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy.MM.dd - HH:mm:ss"
        let timestamp = formatter.string(from: Date())
        
        let gridSummary = """
        [ GRID SYNTHESIS: \(spread.name) ]
        [ DOMINANT VECTOR: \(dominant.rawValue) (\(dominant.platonicSolid)) ]
        \(envSummary.isEmpty ? "" : "\n\(envSummary)")
        """
        
        return SynthesisReport(
            timestamp: timestamp,
            spreadName: spread.name,
            elements: scores,
            dominantElement: dominant,
            gridSummary: gridSummary,
            tacticalDirectives: directives,
            triadAnalysis: triadCalculus,
            isStormFrictionApplied: isStorm,
            spokenConcise: nil,
            inquiryTheme: nil,
            finalOutcome: nil
        )
    }
}
