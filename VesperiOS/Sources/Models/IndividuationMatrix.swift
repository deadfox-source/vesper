// Sources/Models/IndividuationMatrix.swift
import Foundation

public struct IndividuationMatrix: Codable, Sendable, Equatable {
    public let persona: Int // Fire % (Conscious interface / identity)
    public let shadow: Int  // Water % (Unconscious depth / hidden forces)
    public let anima: Int   // Air % (Intellectual & emotional bridge)
    public let selfActualization: Int // Earth % (Grounded manifestation & integration)
    
    public init(persona: Int = 25, shadow: Int = 25, anima: Int = 25, selfActualization: Int = 25) {
        self.persona = persona
        self.shadow = shadow
        self.anima = anima
        self.selfActualization = selfActualization
    }
    
    public static func calculate(from entries: [JournalEntry], readings: [ReadingRecord] = []) -> IndividuationMatrix {
        var fire = 0
        var water = 0
        var air = 0
        var earth = 0
        
        // 1. Process Journal Entries
        for entry in entries {
            if let card = TarotDeck.getCard(named: entry.cardName) {
                switch card.element {
                case .fire: fire += 1
                case .water: water += 1
                case .air: air += 1
                case .earth, .spirit: earth += 1
                }
            }
        }
        
        // 2. Process Readings Nodes
        for reading in readings {
            for (_, cardName) in reading.nodes {
                if let card = TarotDeck.getCard(named: cardName) {
                    switch card.element {
                    case .fire: fire += 1
                    case .water: water += 1
                    case .air: air += 1
                    case .earth, .spirit: earth += 1
                    }
                }
            }
        }
        
        let total = fire + water + air + earth
        if total == 0 {
            return IndividuationMatrix(persona: 0, shadow: 0, anima: 0, selfActualization: 0)
        }
        
        return IndividuationMatrix(
            persona: Int(round(Double(fire) / Double(total) * 100)),
            shadow: Int(round(Double(water) / Double(total) * 100)),
            anima: Int(round(Double(air) / Double(total) * 100)),
            selfActualization: Int(round(Double(earth) / Double(total) * 100))
        )
    }
}
