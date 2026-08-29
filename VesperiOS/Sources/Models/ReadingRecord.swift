// Sources/Models/ReadingRecord.swift
import Foundation

public struct ReadingRecord: Identifiable, Codable, Sendable {
    public let id: String
    public let timestamp: String
    public let spreadId: String
    public let spreadName: String
    public let query: String?
    public let nodes: [Int: String]
    public let cardNotes: [Int: String]?
    public let synthesisReport: SynthesisReport?
    public let userNotes: String?
    
    public init(
        id: String = UUID().uuidString,
        timestamp: String = DateFormatter.localizedString(from: Date(), dateStyle: .short, timeStyle: .short),
        spreadId: String,
        spreadName: String,
        query: String?,
        nodes: [Int: String],
        cardNotes: [Int: String]? = nil,
        synthesisReport: SynthesisReport?,
        userNotes: String? = nil
    ) {
        self.id = id
        self.timestamp = timestamp
        self.spreadId = spreadId
        self.spreadName = spreadName
        self.query = query
        self.nodes = nodes
        self.cardNotes = cardNotes
        self.synthesisReport = synthesisReport
        self.userNotes = userNotes
    }
}
