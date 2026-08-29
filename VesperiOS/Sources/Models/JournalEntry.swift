// Sources/Models/JournalEntry.swift
import Foundation

public struct JournalEntry: Identifiable, Codable, Sendable {
    public let id: String
    public let timestamp: String
    public let cardName: String
    public let reflectionPrompt: String
    public let userReflection: String
    public let category: String
    
    public init(
        id: String = UUID().uuidString,
        timestamp: String = DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short),
        cardName: String,
        reflectionPrompt: String,
        userReflection: String,
        category: String = "DAILY REFLECTION"
    ) {
        self.id = id
        self.timestamp = timestamp
        self.cardName = cardName
        self.reflectionPrompt = reflectionPrompt
        self.userReflection = userReflection
        self.category = category
    }
}
