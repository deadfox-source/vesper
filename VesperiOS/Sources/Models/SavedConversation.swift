// Sources/Models/SavedConversation.swift
import Foundation

public struct SavedConversationMessage: Codable, Sendable, Identifiable {
    public var id: String { "\(role)_\(text.hashValue)" }
    public let role: MessageRole
    public let text: String
    public let timestamp: String?
    
    public init(role: MessageRole, text: String, timestamp: String? = nil) {
        self.role = role
        self.text = text
        self.timestamp = timestamp
    }
    
    public var asChatMessage: ChatMessage {
        ChatMessage(
            role: role,
            text: text,
            timestamp: timestamp ?? ""
        )
    }
}

public struct SavedConversation: Identifiable, Codable, Sendable {
    public let id: String
    public let timestamp: String
    public let title: String
    public let messages: [SavedConversationMessage]
    
    public init(
        id: String = UUID().uuidString,
        timestamp: String = DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short),
        title: String,
        messages: [SavedConversationMessage]
    ) {
        self.id = id
        self.timestamp = timestamp
        self.title = title
        self.messages = messages
    }
}
