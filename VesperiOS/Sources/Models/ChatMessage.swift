// Sources/Models/ChatMessage.swift
import Foundation

public enum MessageRole: String, Codable, Sendable {
    case user
    case vesper
    case system
}

public struct ChatMessage: Identifiable, Codable, Sendable, Equatable {
    public let id: String
    public let role: MessageRole
    public let text: String
    public let timestamp: String
    public let emotion: VesperEmotion?
    public let options: [String]?
    public let suggestedSpreadId: String?
    public let suggestedSpreadRationale: String?
    
    public var isUser: Bool {
        role == .user
    }
    
    public init(
        id: String = UUID().uuidString,
        role: MessageRole,
        text: String,
        timestamp: String = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium),
        emotion: VesperEmotion? = nil,
        options: [String]? = nil,
        suggestedSpreadId: String? = nil,
        suggestedSpreadRationale: String? = nil
    ) {
        self.id = id
        self.role = role
        self.text = text
        self.timestamp = timestamp
        self.emotion = emotion
        self.options = options
        self.suggestedSpreadId = suggestedSpreadId
        self.suggestedSpreadRationale = suggestedSpreadRationale
    }
}
